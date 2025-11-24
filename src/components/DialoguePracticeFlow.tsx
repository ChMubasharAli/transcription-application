import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

interface DialogueSegment {
  id: string;
  segment_order: number;
  text_content: string;
  translation?: string;
  audio_url?: string;
  speaker?: string;
}

interface Dialogue {
  id: string;
  title: string;
  description: string;
  segments: DialogueSegment[];
}

interface ScoringResult {
  accuracy: number;
  register: number;
  contentQuality: number;
  fluency: number;
  pronunciation: number;
  overall: number;
  feedback: string;
  detailedScores: {
    accuracy: { score: number; feedback: string; };
    register: { score: number; feedback: string; };
    contentQuality: { score: number; feedback: string; };
    fluency: { score: number; feedback: string; };
    pronunciation: { score: number; feedback: string; };
  };
}

interface DialoguePracticeFlowProps {
  dialogue: Dialogue;
  onComplete: (results: ScoringResult[]) => void;
}

const DialoguePracticeFlow: React.FC<DialoguePracticeFlowProps> = ({ 
  dialogue, 
  onComplete 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [scoringResults, setScoringResults] = useState<ScoringResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSegment = dialogue.segments[currentSegmentIndex];
  const progress = ((currentSegmentIndex + 1) / dialogue.segments.length) * 100;

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSegmentAudio = async () => {
    if (!currentSegment.audio_url || !audioRef.current) return;
    
    try {
      setIsPlaying(true);
      audioRef.current.src = currentSegment.audio_url;
      audioRef.current.onended = () => setIsPlaying(false);
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = processRecording;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your interpretation now"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast({
        title: "No Audio",
        description: "No audio was recorded. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Transcribe audio using Whisper
      console.log('Transcribing audio...');
      const transcribeResponse = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          audioFormat: 'webm'
        }
      });
      
      if (transcribeResponse.error) {
        throw new Error(transcribeResponse.error.message);
      }
      
      const transcriptionData = transcribeResponse.data;
      const transcript = transcriptionData.text;
      setUserTranscript(transcript);
      
      console.log('User transcript:', transcript);
      
      // Score the interpretation using GPT
      console.log('Scoring interpretation...');
      const scoreResponse = await supabase.functions.invoke('score-dialogue', {
        body: {
          userTranscript: transcript,
          referenceTranscript: currentSegment.text_content,
          referenceTranslation: currentSegment.translation || '',
          segmentId: currentSegment.id,
          userId: user?.id
        }
      });
      
      if (scoreResponse.error) {
        throw new Error(scoreResponse.error.message);
      }
      
      const scoringData = scoreResponse.data;
      if (scoringData.success) {
        const results = [...scoringResults, scoringData.scores];
        setScoringResults(results);
        
        toast({
          title: "Segment Complete!",
          description: `Overall Score: ${scoringData.scores.overall.toFixed(1)}/10`
        });
        
        // Move to next segment or complete
        if (currentSegmentIndex < dialogue.segments.length - 1) {
          setTimeout(() => {
            setCurrentSegmentIndex(currentSegmentIndex + 1);
            setUserTranscript('');
          }, 2000);
        } else {
          setIsComplete(true);
          onComplete(results);
        }
      } else {
        throw new Error(scoringData.error);
      }
      
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process recording",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retrySegment = () => {
    setUserTranscript('');
    // Remove last scoring result if exists
    if (scoringResults.length > currentSegmentIndex) {
      setScoringResults(scoringResults.slice(0, currentSegmentIndex));
    }
  };

  const getCurrentScore = () => {
    return scoringResults[currentSegmentIndex];
  };

  if (isComplete) {
    const averageScore = scoringResults.reduce((sum, result) => sum + result.overall, 0) / scoringResults.length;
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Dialogue Practice Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">
              {averageScore.toFixed(1)}/10
            </div>
            <p className="text-lg text-muted-foreground">Overall Average Score</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoringResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Segment {index + 1}: {result.overall.toFixed(1)}/10
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Accuracy: {result.accuracy.toFixed(1)}</div>
                    <div>Register: {result.register.toFixed(1)}</div>
                    <div>Content: {result.contentQuality.toFixed(1)}</div>
                    <div>Fluency: {result.fluency.toFixed(1)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex-1"
            >
              Practice Again
            </Button>
            
            <Button 
              onClick={() => {
                // Navigate to dashboard to see scoring history
                window.dispatchEvent(new CustomEvent('navigate-to-dashboard'));
              }}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{dialogue.title}</CardTitle>
            <Badge variant="outline">
              Segment {currentSegmentIndex + 1} of {dialogue.segments.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Current Segment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listen & Interpret</span>
            {currentSegment.speaker && (
              <Badge variant="secondary">{currentSegment.speaker}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reference Text */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Original Text:</h4>
            <p className="text-sm">{currentSegment.text_content}</p>
          </div>
          
          {/* Expected Translation */}
          {currentSegment.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Expected Translation:</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">{currentSegment.translation}</p>
            </div>
          )}

          {/* Audio Controls */}
          <div className="flex gap-2">
            <Button
              onClick={playSegmentAudio}
              disabled={isPlaying || !currentSegment.audio_url}
              variant="outline"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Playing...' : 'Play Audio'}
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="flex gap-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            
            {userTranscript && (
              <Button onClick={retrySegment} variant="outline">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Processing your interpretation... This may take a moment.
              </p>
            </div>
          )}

          {/* User Transcript */}
          {userTranscript && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Your Interpretation:</h4>
              <p className="text-sm text-green-700 dark:text-green-300">{userTranscript}</p>
            </div>
          )}

          {/* Scoring Results */}
          {getCurrentScore() && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">
                  Score: {getCurrentScore().overall.toFixed(1)}/10
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="font-semibold">{getCurrentScore().accuracy.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{getCurrentScore().register.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Register</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{getCurrentScore().contentQuality.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Content</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{getCurrentScore().fluency.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Fluency</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{getCurrentScore().pronunciation.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Pronunciation</div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h5 className="font-medium mb-1">Feedback:</h5>
                  <p className="text-sm">{getCurrentScore().feedback}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DialoguePracticeFlow;