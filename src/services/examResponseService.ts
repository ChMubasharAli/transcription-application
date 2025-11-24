import { supabase } from '@/integrations/supabase/client';

export interface ExamResponse {
  id: string;
  user_id: string;
  question_id: string;
  audio_file_path: string;
  transcript?: string;
  duration_seconds: number;
  recorded_at: string;
}

export const examResponseService = {
  /**
   * Save an exam audio response to storage and database
   */
  async saveExamResponse(
    questionId: string,
    audioBlob: Blob,
    durationSeconds: number
  ): Promise<{ success: boolean; data?: ExamResponse; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Generate unique filename
      const timestamp = new Date().toISOString();
      const fileName = `${user.id}/${questionId}_${timestamp}.webm`;

      // Upload audio file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-responses')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Failed to upload audio file' };
      }

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
        console.error('Database error:', dbError);
        // Try to cleanup uploaded file
        await supabase.storage
          .from('exam-responses')
          .remove([fileName]);
        return { success: false, error: 'Failed to save response record' };
      }

      return { success: true, data: responseData };

    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get exam responses for the current user
   */
  async getUserExamResponses(questionId?: string): Promise<{ success: boolean; data?: ExamResponse[]; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

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
        console.error('Database error:', error);
        return { success: false, error: 'Failed to fetch responses' };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get public URL for an audio file
   */
  async getAudioUrl(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data } = supabase.storage
        .from('exam-responses')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return { success: false, error: 'Failed to get audio URL' };
    }
  }
};