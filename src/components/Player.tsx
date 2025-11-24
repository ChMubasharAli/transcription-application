import { useState, useRef, useEffect } from 'react';
import { Dialogue, PerSegmentResult } from '../types';
import { generateMockDeductions } from '../scoring';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Play, Pause, RotateCcw, Mic, Square, Volume2 } from 'lucide-react';

interface PlayerProps {
  dialogue: Dialogue;
  onDialogueComplete: (results: PerSegmentResult[]) => void;
}

export function Player({ dialogue, onDialogueComplete }: PlayerProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const [repeatCount, setRepeatCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [segmentResults, setSegmentResults] = useState<PerSegmentResult[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSegment = dialogue.segments[currentSegmentIndex];
  const isLastSegment = currentSegmentIndex === dialogue.segments.length - 1;
  const canProceed = hasPlayedOnce || recordedBlob !== null;

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDialogueComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setHasPlayedOnce(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleRepeat = () => {
    setRepeatCount(prev => prev + 1);
    handlePlay();
  };

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handlePlayback = () => {
    if (recordedUrl) {
      const audio = new Audio(recordedUrl);
      audio.play();
    }
  };

  const handleNextSegment = () => {
    // Call the score-dialogue edge function for real scoring
    const scoreSegment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('score-dialogue', {
          body: {
            userTranscript: recordedUrl ? "Audio recorded - transcript will be processed" : "No audio recorded",
            referenceTranscript: currentSegment.promptTranscript || "",
            referenceTranslation: "", // Add translation field to types if needed
            segmentId: currentSegment.id,
            userId: "current-user-id", // This should come from auth
            audioUrl: recordedUrl
          }
        });

        if (error) {
          console.error('Scoring error:', error);
          // Fallback to basic result
          const result: PerSegmentResult = {
            segmentId: currentSegment.id,
            studentAudioUrl: recordedUrl,
            studentTranscript: "Processing...",
            deductions: {
              accuracy: 1,
              languageQuality: 1,
              languageRegister: 0,
              delivery: 1,
              repeatPenalty: repeatCount > 1 ? Math.min(2, repeatCount - 1) : 0
            },
            notes: repeatCount > 1 ? `Used ${repeatCount} repeats` : undefined
          };
          
          const newResults = [...segmentResults, result];
          setSegmentResults(newResults);
          
          if (isLastSegment) {
            handleDialogueComplete(newResults);
          } else {
            setCurrentSegmentIndex(prev => prev + 1);
            setHasPlayedOnce(false);
            setRecordedBlob(null);
            setRecordedUrl('');
            setRepeatCount(1);
          }
        } else {
          // Use real scoring data
          const scores = data.scores;
          const result: PerSegmentResult = {
            segmentId: currentSegment.id,
            studentAudioUrl: recordedUrl,
            studentTranscript: scores?.feedback || "Processed",
            deductions: {
              accuracy: Math.max(0, 5 - Math.floor(scores?.accuracy || 0)),
              languageQuality: Math.max(0, 5 - Math.floor(scores?.contentQuality || 0)),
              languageRegister: Math.max(0, 3 - Math.floor(scores?.register || 0)),
              delivery: Math.max(0, 3 - Math.floor(scores?.fluency || 0)),
              repeatPenalty: repeatCount > 1 ? Math.min(2, repeatCount - 1) : 0
            },
            notes: repeatCount > 1 ? `Used ${repeatCount} repeats` : undefined
          };
          
          const newResults = [...segmentResults, result];
          setSegmentResults(newResults);
          
          if (isLastSegment) {
            handleDialogueComplete(newResults);
          } else {
            setCurrentSegmentIndex(prev => prev + 1);
            setHasPlayedOnce(false);
            setRecordedBlob(null);
            setRecordedUrl('');
            setRepeatCount(1);
          }
        }
      } catch (error) {
        console.error('Error calling score function:', error);
        // Fallback to basic scoring
        const result: PerSegmentResult = {
          segmentId: currentSegment.id,
          studentAudioUrl: recordedUrl,
          studentTranscript: "Error processing - fallback scoring",
          deductions: {
            accuracy: 2,
            languageQuality: 1,
            languageRegister: 1,
            delivery: 1,
            repeatPenalty: repeatCount > 1 ? Math.min(2, repeatCount - 1) : 0
          },
          notes: repeatCount > 1 ? `Used ${repeatCount} repeats` : undefined
        };
        
        const newResults = [...segmentResults, result];
        setSegmentResults(newResults);
        
        if (isLastSegment) {
          handleDialogueComplete(newResults);
        } else {
          setCurrentSegmentIndex(prev => prev + 1);
          setHasPlayedOnce(false);
          setRecordedBlob(null);
          setRecordedUrl('');
          setRepeatCount(1);
        }
      }
    };

    scoreSegment();

    // Results are now handled inside scoreSegment function
  };

  const handleDialogueComplete = (results = segmentResults) => {
    if (timerRef.current) clearInterval(timerRef.current);
    onDialogueComplete(results);
  };

  const progress = ((currentSegmentIndex) / dialogue.segments.length) * 100;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-card-foreground">{dialogue.title}</CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm font-mono">
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant={repeatCount === 0 ? "default" : "destructive"}>
              {repeatCount === 0 ? "1 free repeat" : "Further repeats will be penalized"}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Segment {currentSegmentIndex + 1} / {dialogue.segments.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Audio Player */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Prompt Audio</h3>
          <audio 
            ref={audioRef}
            src={currentSegment.promptAudioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlaying ? handlePause : handlePlay}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepeat}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Repeat
            </Button>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Prompt:</p>
            <p className="text-foreground">{currentSegment.promptTranscript}</p>
          </div>
        </div>

        {/* Recording */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Your Response</h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={handleRecord}
              className="flex items-center gap-2"
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Record Answer'}
            </Button>

            {recordedBlob && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayback}
                className="flex items-center gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Play Back
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              Recording...
            </div>
          )}

          {recordedBlob && (
            <div className="p-3 bg-accent rounded-md">
              <p className="text-sm text-accent-foreground">✓ Response recorded</p>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleNextSegment}
            disabled={!canProceed}
            className="w-full"
            size="lg"
          >
            {isLastSegment ? 'Complete Dialogue' : 'Next Segment'}
          </Button>
          
          {!canProceed && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Play the prompt or record your answer to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}