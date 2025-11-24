import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePracticeSessionTracking = () => {
  const { user, isAuthenticated } = useAuth();
  const currentSessionId = useRef<string | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  // Start a new practice session
  const startSession = async () => {
    if (!user || currentSessionId.current) return;

    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          student_id: user.id,
          started_at: new Date().toISOString(),
          activity_type: 'general_practice'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error starting practice session:', error);
        return;
      }

      if (data) {
        currentSessionId.current = data.id;
        sessionStartTime.current = new Date();
        console.log('Practice session started:', data.id);
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
    }
  };

  // End the current practice session
  const endSession = async () => {
    if (!currentSessionId.current) return;

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .update({
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSessionId.current);

      if (error) {
        console.error('Error ending practice session:', error);
      } else {
        console.log('Practice session ended:', currentSessionId.current);
      }
    } catch (error) {
      console.error('Error ending practice session:', error);
    } finally {
      currentSessionId.current = null;
      sessionStartTime.current = null;
    }
  };

  // Handle page visibility change (when user switches tabs/apps)
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      // Page is hidden - end session
      await endSession();
    } else if (isAuthenticated && user) {
      // Page is visible again - start new session
      await startSession();
    }
  };

  // Handle page unload (when user closes browser/tab)
  const handleBeforeUnload = () => {
    if (currentSessionId.current) {
      // Use navigator.sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        id: currentSessionId.current,
        ended_at: new Date().toISOString()
      });
      
      navigator.sendBeacon('/api/end-session', data);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Start session when user signs in
      startSession();
    } else {
      // End session when user signs out
      endSession();
    }

    return () => {
      // Cleanup on unmount
      endSession();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    // Add event listeners for page visibility and unload
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Add event listener for when user navigates away
    const handlePageHide = () => {
      endSession();
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return {
    currentSessionId: currentSessionId.current,
    sessionStartTime: sessionStartTime.current,
    startSession,
    endSession
  };
};