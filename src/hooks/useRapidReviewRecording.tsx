import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface RapidReviewRecordingState {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  transcript: string | null;
  isTranscribing: boolean;
  isScoring: boolean;
  feedback: any | null;
}

export const useRapidReviewRecording = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<RapidReviewRecordingState>({
    isRecording: false,
    recordingTime: 0,
    audioBlob: null,
    transcript: null,
    isTranscribing: false,
    isScoring: false,
    feedback: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, audioBlob: blob, isRecording: false }));
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Start timer
      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0 }));
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check microphone permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to transcribe audio.',
        variant: 'destructive'
      });
      return null;
    }

    setState(prev => ({ ...prev, isTranscribing: true }));

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // Call transcribe function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio, audioFormat: 'webm' }
      });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        transcript: data.text, 
        isTranscribing: false 
      }));

      return data.text;

    } catch (error) {
      console.error('Transcription error:', error);
      setState(prev => ({ ...prev, isTranscribing: false }));
      toast({
        title: 'Transcription Failed',
        description: 'Failed to transcribe audio. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const scoreResponse = async (
    segmentId: string,
    transcript: string,
    expectedAnswer: string,
    audioBlob: Blob
  ) => {
    if (!user) return null;

    setState(prev => ({ ...prev, isScoring: true }));

    try {
      // Upload audio to storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/rapid-review/${segmentId}-${timestamp}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('exam-responses')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Call scoring function
      const { data: scoreData, error: scoreError } = await supabase.functions.invoke('score-rapid-review', {
        body: {
          segmentId,
          transcript,
          expectedAnswer,
          audioUrl: fileName
        }
      });

      if (scoreError) throw scoreError;

      // Save to database
      const { error: dbError } = await supabase
        .from('user_audio_responses')
        .insert({
          user_id: user.id,
          segment_id: segmentId,
          audio_url: fileName,
          user_transcript: transcript,
          feedback: scoreData.feedback,
          overall_score: scoreData.overall_score,
          accuracy_score: scoreData.accuracy_score,
          fluency_score: scoreData.fluency_score,
          pronunciation_score: scoreData.pronunciation_score
        });

      if (dbError) throw dbError;

      setState(prev => ({ 
        ...prev, 
        feedback: scoreData, 
        isScoring: false 
      }));

      toast({
        title: 'Feedback Generated',
        description: `Overall Score: ${scoreData.overall_score}/100`,
      });

      return scoreData;

    } catch (error) {
      console.error('Scoring error:', error);
      setState(prev => ({ ...prev, isScoring: false }));
      toast({
        title: 'Scoring Failed',
        description: 'Failed to generate feedback. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const resetState = () => {
    setState({
      isRecording: false,
      recordingTime: 0,
      audioBlob: null,
      transcript: null,
      isTranscribing: false,
      isScoring: false,
      feedback: null
    });
    chunksRef.current = [];
  };

  return {
    state,
    startRecording,
    stopRecording,
    transcribeAudio,
    scoreResponse,
    resetState
  };
};
