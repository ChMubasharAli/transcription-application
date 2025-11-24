import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Square, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { examResponseService } from '@/services/examResponseService';

interface ExamAudioFlowProps {
  questionAudioUrl: string;
  questionId?: string;
  onResponseSaved?: (audioBlob: Blob) => void;
  className?: string;
}

export const ExamAudioFlow: React.FC<ExamAudioFlowProps> = ({
  questionAudioUrl,
  questionId = 'sample-question',
  onResponseSaved,
  className = ""
}) => {
  // Question waveform refs and state
  const questionWaveformRef = useRef<HTMLDivElement>(null);
  const questionWavesurfer = useRef<WaveSurfer | null>(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionPlaying, setQuestionPlaying] = useState(false);
  const [questionCurrentTime, setQuestionCurrentTime] = useState('0:00');
  const [questionDuration, setQuestionDuration] = useState('0:00');

  // Recording state
  const [examState, setExamState] = useState<'idle' | 'playing-question' | 'recording' | 'finished'>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [saved, setSaved] = useState(false);

  // Live recording visualization
  const recordingWaveformRef = useRef<HTMLDivElement>(null);
  const recordingWavesurfer = useRef<WaveSurfer | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize question waveform
  useEffect(() => {
    if (!questionWaveformRef.current) return;

    try {
      questionWavesurfer.current = WaveSurfer.create({
        container: questionWaveformRef.current,
        waveColor: '#9ca3af',
        progressColor: '#3b82f6',
        cursorColor: '#3b82f6',
        barWidth: 2,
        barRadius: 1,
        height: 60,
        normalize: true,
        mediaControls: false,
      });

      questionWavesurfer.current.on('ready', () => {
        const duration = questionWavesurfer.current?.getDuration() || 0;
        setQuestionDuration(formatTime(duration));
        setQuestionLoading(false);
      });

      questionWavesurfer.current.on('audioprocess', () => {
        const current = questionWavesurfer.current?.getCurrentTime() || 0;
        const duration = questionWavesurfer.current?.getDuration() || 0;
        setQuestionCurrentTime(formatTime(current));
        
        // Debug logging
        console.log(`🎵 ExamAudioFlow: Current: ${current.toFixed(2)}s, Duration: ${duration.toFixed(2)}s, State: ${examState}`);
        
        // Trigger recording when playhead reaches the red marker (near the end)
        if (duration > 0 && current >= duration - 0.2 && examState === 'playing-question') {
          console.log('🎵 ExamAudioFlow: Triggering recording at red marker!');
          questionWavesurfer.current?.pause();
          startRecording();
        }
      });

      questionWavesurfer.current.on('play', () => {
        console.log('🎵 ExamAudioFlow: Play event');
        setQuestionPlaying(true);
        setExamState('playing-question');
      });

      questionWavesurfer.current.on('pause', () => {
        console.log('🎵 ExamAudioFlow: Pause event');
        setQuestionPlaying(false);
      });

      questionWavesurfer.current.on('finish', () => {
        console.log('🎵 ExamAudioFlow: Finish event');
        setQuestionPlaying(false);
        // Fallback: start recording if not already started
        if (examState === 'playing-question') {
          console.log('🎵 ExamAudioFlow: Fallback recording trigger');
          startRecording();
        }
      });

      questionWavesurfer.current.load(questionAudioUrl);

    } catch (err) {
      console.error('Error initializing question waveform:', err);
      setQuestionLoading(false);
    }

    return () => {
      if (questionWavesurfer.current) {
        questionWavesurfer.current.destroy();
      }
    };
  }, [questionAudioUrl]);

  // Initialize recording canvas
  useEffect(() => {
    if (!recordingWaveformRef.current || examState !== 'recording') return;

    try {
      // Create a simple canvas for live visualization
      const canvas = document.createElement('canvas');
      canvas.width = recordingWaveformRef.current.clientWidth || 800;
      canvas.height = 60;
      canvas.style.width = '100%';
      canvas.style.height = '60px';
      
      recordingWaveformRef.current.innerHTML = '';
      recordingWaveformRef.current.appendChild(canvas);

    } catch (err) {
      console.error('Error initializing recording canvas:', err);
    }

    return () => {
      if (recordingWaveformRef.current) {
        recordingWaveformRef.current.innerHTML = '';
      }
    };
  }, [examState]);

  const startRecording = useCallback(async () => {
    console.log('🎤 ExamAudioFlow: Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎤 ExamAudioFlow: Microphone access granted');
      setAudioStream(stream);
      
      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        console.log('🎤 ExamAudioFlow: Recording stopped, blob created');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setExamState('recording');
      console.log('🎤 ExamAudioFlow: Recording state set, MediaRecorder started');

      // Setup live visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start live waveform animation
      animateLiveWaveform();
      console.log('🎤 ExamAudioFlow: Live visualization setup complete');

    } catch (error) {
      console.error('🎤 ExamAudioFlow: Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  }, []);

  const animateLiveWaveform = useCallback(() => {
    if (!analyserRef.current || !recordingWavesurfer.current || examState !== 'recording') {
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume for simple visualization
    const sum = dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / bufferLength;
    const normalizedAverage = average / 255;

    // Create simple waveform data based on microphone input
    const waveformData = new Float32Array(256);
    for (let i = 0; i < waveformData.length; i++) {
      // Create bars that vary in height based on mic input
      const variation = Math.random() * 0.3;
      waveformData[i] = (normalizedAverage + variation) * (Math.random() > 0.5 ? 1 : -1);
    }

    // Update the canvas directly instead of recreating wavesurfer
    const canvas = recordingWaveformRef.current?.querySelector('canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        
        const barWidth = canvas.width / waveformData.length;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < waveformData.length; i++) {
          const barHeight = Math.abs(waveformData[i]) * centerY;
          const x = i * barWidth;
          ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
        }
      }
    }

    animationRef.current = requestAnimationFrame(animateLiveWaveform);
  }, [examState]);

  const finishAttempt = useCallback(async () => {
    // Stop recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }

    // Stop timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setExamState('finished');

    // Save the response
    if (recordedBlob) {
      console.log('🎤 ExamAudioFlow: Saving response...');
      const result = await examResponseService.saveExamResponse(
        questionId,
        recordedBlob,
        recordingTime
      );

      if (result.success) {
        console.log('🎤 ExamAudioFlow: Response saved successfully');
        setSaved(true);
        toast({
          title: "Response Saved",
          description: "Your exam response has been recorded and saved successfully.",
        });
        
        // Call the callback if provided
        if (onResponseSaved) {
          onResponseSaved(recordedBlob);
        }
      } else {
        console.error('🎤 ExamAudioFlow: Failed to save response:', result.error);
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save your response. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [mediaRecorder, audioStream, recordedBlob, recordingTime, questionId, onResponseSaved]);

  const startExam = () => {
    if (questionWavesurfer.current) {
      setSaved(false);
      setRecordedBlob(null);
      setRecordingTime(0);
      questionWavesurfer.current.seekTo(0);
      questionWavesurfer.current.play();
    }
  };

  const playRecordedAudio = () => {
    if (recordedBlob) {
      const audio = new Audio(URL.createObjectURL(recordedBlob));
      audio.play();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Question Waveform */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Audio</h3>
        <div 
          ref={questionWaveformRef}
          className="w-full bg-gray-50 rounded-lg border relative"
          style={{ minHeight: '96px' }}
        >
          {questionLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-gray-500">Loading question...</div>
            </div>
          )}
          
          {/* Red bookmark flag at the end */}
          <div className="absolute right-0 top-0 flex flex-col items-end">
            <div className="relative">
              <div className="w-4 h-6 bg-red-500 shadow-sm" 
                   style={{
                     clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)'
                   }}>
              </div>
              <div className="w-0.5 h-16 bg-red-500 absolute left-1/2 transform -translate-x-1/2 top-full"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{questionCurrentTime}</span>
            <span>/</span>
            <span>{questionDuration}</span>
          </div>
        </div>
      </div>

      {/* Recording Canvas - Only show when recording */}
      {examState === 'recording' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-600">Recording Your Response</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>REC</span>
              </div>
              <div className="text-red-600 font-mono text-sm">
                {formatTime(recordingTime)}
              </div>
            </div>
          </div>
          
          <div 
            ref={recordingWaveformRef}
            className="w-full bg-red-50 rounded-lg border-2 border-red-200 relative"
            style={{ minHeight: '96px' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-red-600 opacity-60">Live microphone monitoring...</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {examState === 'idle' && (
          <Button 
            onClick={startExam}
            disabled={questionLoading}
            className="px-8 py-3 text-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        )}
        
        {examState === 'recording' && (
          <Button 
            onClick={finishAttempt}
            variant="destructive"
            className="px-8 py-3 text-lg"
          >
            <Square className="w-5 h-5 mr-2" />
            Finish Attempt
          </Button>
        )}
        
        {examState === 'finished' && (
          <div className="space-y-4 text-center">
            {saved && (
              <div className="flex items-center justify-center space-x-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                <span>Saved ✓</span>
              </div>
            )}
            {recordedBlob && (
              <div className="space-x-4">
                <Button 
                  onClick={playRecordedAudio}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Play Recording
                </Button>
                <Button 
                  onClick={startExam}
                  className="px-6 py-2"
                >
                  Start Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};