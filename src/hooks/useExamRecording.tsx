import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ExamRecordingState {
  isRecording: boolean;
  recordingTime: number;
  saved: boolean;
  recordedBlob: Blob | null;
}

export const useExamRecording = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ExamRecordingState>({
    isRecording: false,
    recordingTime: 0,
    saved: false,
    recordedBlob: null
  });

  const saveRecording = async (audioBlob: Blob, questionId: string, durationSeconds: number) => {
    if (!user) {
      throw new Error('User must be authenticated to save recordings');
    }

    try {
      console.log('💾 Saving exam recording...', { questionId, durationSeconds });
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/${questionId}-${timestamp}.webm`;
      
      // Upload audio file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-responses')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('💾 Upload error:', uploadError);
        throw uploadError;
      }

      console.log('💾 File uploaded successfully:', uploadData);

      // Save response record to database
      const { data: responseData, error: dbError } = await supabase
        .from('exam_responses')
        .insert({
          user_id: user.id,
          question_id: questionId,
          audio_file_path: fileName,
          duration_seconds: durationSeconds
        })
        .select()
        .single();

      if (dbError) {
        console.error('💾 Database error:', dbError);
        throw dbError;
      }

      console.log('💾 Response saved to database:', responseData);
      
      setState(prev => ({ ...prev, saved: true }));
      return responseData;

    } catch (error) {
      console.error('💾 Error saving recording:', error);
      throw error;
    }
  };

  const getRecordingUrl = async (audioFilePath: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.storage
        .from('exam-responses')
        .createSignedUrl(audioFilePath, 3600); // 1 hour expiry

      if (error) {
        console.error('🔗 Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('🔗 Error getting recording URL:', error);
      return null;
    }
  };

  const getUserResponses = async (questionId?: string) => {
    if (!user) return [];

    try {
      let query = supabase
        .from('exam_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (questionId) {
        query = query.eq('question_id', questionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('📜 Error fetching responses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('📜 Error getting user responses:', error);
      return [];
    }
  };

  return {
    state,
    setState,
    saveRecording,
    getRecordingUrl,
    getUserResponses
  };
};