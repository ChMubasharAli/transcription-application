import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyStatsData {
  todayPracticed: number;
  totalPracticed: number;
  practiceDays: number;
}

const StudyStats = () => {
  const [statsData, setStatsData] = useState<StudyStatsData>({
    todayPracticed: 0,
    totalPracticed: 0,
    practiceDays: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudyStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date in Australia/Sydney timezone
      const now = new Date();
      const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const todayString = sydneyFormatter.format(now);
      const [day, month, year] = todayString.split('/');
      const todayStartLocal = new Date(`${year}-${month}-${day}T00:00:00+11:00`);
      const tomorrowStartLocal = new Date(todayStartLocal.getTime() + 24 * 60 * 60 * 1000);

      // Fetch all test sessions for the user
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('started_at, status')
        .eq('user_id', user.id)
        .eq('session_type', 'practice');

      if (error) {
        console.error('Error fetching study stats:', error);
        return;
      }

      let todayPracticed = 0;
      let totalPracticed = 0;
      const uniquePracticeDays = new Set<string>();

      if (sessions) {
        for (const session of sessions) {
          const sessionDate = new Date(session.started_at);
          
          // Count total practiced sessions (completed or in progress)
          if (session.status === 'completed' || session.status === 'in_progress') {
            totalPracticed++;
            
            // Add to unique practice days
            const sessionDayString = sydneyFormatter.format(sessionDate);
            uniquePracticeDays.add(sessionDayString);
            
            // Check if session is from today
            if (sessionDate >= todayStartLocal && sessionDate < tomorrowStartLocal) {
              todayPracticed++;
            }
          }
        }
      }

      setStatsData({
        todayPracticed,
        totalPracticed,
        practiceDays: uniquePracticeDays.size
      });
    } catch (error) {
      console.error('Error fetching study stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch study statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyStats();

    // Poll every 5 minutes for updates
    const pollInterval = setInterval(fetchStudyStats, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-muted/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-medium text-cyan-500 mb-0.5">--</div>
            <div className="text-xs text-muted-foreground">Today Practiced</div>
          </CardContent>
        </Card>
        <Card className="border-muted/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-medium mb-0.5">--</div>
            <div className="text-xs text-muted-foreground">Total Practiced</div>
          </CardContent>
        </Card>
        <Card className="border-muted/50">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-medium mb-0.5">--</div>
            <div className="text-xs text-muted-foreground">Prac. Days</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Today Practiced */}
      <Card className="border-muted/50">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-medium text-cyan-500 mb-0.5">
            {statsData.todayPracticed}
          </div>
          <div className="text-xs text-muted-foreground">Today Practiced</div>
        </CardContent>
      </Card>

      {/* Total Practiced */}
      <Card className="border-muted/50">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-medium mb-0.5">
            {statsData.totalPracticed}
          </div>
          <div className="text-xs text-muted-foreground">Total Practiced</div>
        </CardContent>
      </Card>

      {/* Practice Days */}
      <Card className="border-muted/50">
        <CardContent className="p-3 text-center">
          <div className="text-lg font-medium mb-0.5">
            {statsData.practiceDays}
          </div>
          <div className="text-xs text-muted-foreground">Prac. Days</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyStats;