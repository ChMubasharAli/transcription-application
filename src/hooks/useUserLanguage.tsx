import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserLanguage = () => {
  const [userLanguageId, setUserLanguageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (!user) {
        setUserLanguageId(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_id')
          .eq('id', user.id)
          .maybeSingle();

        setUserLanguageId(profile?.language_id || null);
      } catch (error) {
        console.error('Error fetching user language:', error);
        setUserLanguageId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLanguage();
  }, [user]);

  return { userLanguageId, loading };
};