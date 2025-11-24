import { useState, useEffect } from 'react';
import { PracticeSidebar } from '../PracticeSidebar';
import { PracticeContent } from '../PracticeContent';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Practice = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [userLanguage, setUserLanguage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const handleDashboardNavigation = () => {
      setActiveSection('dashboard');
    };

    const handleNavigateRapidReview = () => {
      console.log('Navigating to Rapid Review');
      window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: 'rapid-review' }));
    };

    window.addEventListener('navigate-to-dashboard', handleDashboardNavigation);
    window.addEventListener('navigate-rapid-review', handleNavigateRapidReview);

    return () => {
      window.removeEventListener('navigate-to-dashboard', handleDashboardNavigation);
      window.removeEventListener('navigate-rapid-review', handleNavigateRapidReview);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const {
          data: profile
        } = await supabase.from('profiles').select(`
            full_name,
            language_id,
            languages (name)
          `).eq('id', user.id).maybeSingle();
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');
        setUserLanguage(profile?.languages?.name || 'No language selected');
      }
    };
    fetchUserData();

    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          // Refetch user data when profile is updated
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  return <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed h-screen">
          <PracticeSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-6 pl-64">
          {/* Header - Only visible on dashboard */}
          {activeSection === 'dashboard' && (
            <div className="border-b border-border bg-card">
              <div className="p-6 mx-0 my-[88px]">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome, {userName} to NAATI CCL <span className="text-primary">Practice Hub</span>
                </h1>
                <p className="text-muted-foreground mb-1">
                  You have chosen your language as <span className="text-primary mx-[8px] px-0 font-bold text-xl">{userLanguage}</span>
                </p>
                <p className="text-muted-foreground">
                  Comprehensive CCL practice tools and resources
                </p>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1">
            <PracticeContent activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>;
};
export default Practice;