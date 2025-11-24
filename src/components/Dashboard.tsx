import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from './NotificationBell';
import AnnouncementPopup from './AnnouncementPopup';
// Removed NAATIPerformanceDashboard and NAATIProgressChart imports
import { PassProbability } from './PassProbability';
import PracticeTimeKPIs from './PracticeTimeKPIs';
import StudyStats from './StudyStats';
import { 
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Zap,
  CheckCircle,
  BarChart3,
  Edit
} from 'lucide-react';

interface RecentTestResult {
  id: string;
  dialogue_title: string;
  total_score: number;
  completed_at: string;
  status: string;
  time_spent_seconds: number;
  domain_title?: string;
}

interface PerformanceMetrics {
  weeklyAverage: number;
  growthPercentage: number;
  weeklyPerformance: number;
  totalTests: number;
  currentLevel: string;
  todayAverage: number;
  highestScore: number;
  weeklyTestCount: number;
  weakestDomain: string;
  strongestDomain: string;
  domainScores: Record<string, number>;
}

interface DashboardProps {}

const Dashboard = ({}: DashboardProps) => {
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [recentResults, setRecentResults] = useState<RecentTestResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    weeklyAverage: 0,
    growthPercentage: 0,
    weeklyPerformance: 0,
    totalTests: 0,
    currentLevel: 'Beginner',
    todayAverage: 0,
    highestScore: 0,
    weeklyTestCount: 0,
    weakestDomain: 'No data available',
    strongestDomain: 'No data available',
    domainScores: {}
  });
  const { toast } = useToast();
  // Calculate performance metrics based on your formula
  const calculatePerformanceMetrics = (results: RecentTestResult[]): PerformanceMetrics => {
    if (results.length === 0) {
      return {
        weeklyAverage: 0,
        growthPercentage: 0,
        weeklyPerformance: 0,
        totalTests: 0,
        currentLevel: 'Beginner',
        todayAverage: 0,
        highestScore: 0,
        weeklyTestCount: 0,
        weakestDomain: 'No data available',
        strongestDomain: 'No data available',
        domainScores: {}
      };
    }

    // Step 1: Convert dialogue scores to test scores (assuming single dialogue = test for now)
    // In real implementation, you'd group by test sessions with 2 dialogues each
    const testScores = results.map(result => result.total_score * 2); // Convert to /90 scale
    
    // Step 2: Calculate Weekly Average from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyResults = results.filter(result => {
      const resultDate = new Date(result.completed_at);
      return resultDate >= weekAgo;
    });
    
    const weeklyScores = weeklyResults.map(result => result.total_score * 2); // Convert to /90 scale
    const weeklyAverage = weeklyScores.length > 0 
      ? weeklyScores.reduce((sum, score) => sum + score, 0) / weeklyScores.length 
      : 0;
    const weeklyTestCount = weeklyScores.length;
    
    // Step 3: Calculate Growth Percentage
    let growthPercentage = 0;
    if (testScores.length >= 2) {
      const firstScore = testScores[testScores.length - 1]; // Oldest score
      const lastScore = testScores[0]; // Most recent score
      if (firstScore > 0) {
        growthPercentage = ((lastScore - firstScore) / firstScore) * 100;
      }
    }
    
    // Step 4: Calculate Weekly Performance using your formula
    const weeklyPerformanceBase = (weeklyAverage / 90) * 100;
    const weeklyPerformance = weeklyPerformanceBase + (growthPercentage * 0.5);
    
    // Step 5: Calculate today's average score
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayResults = results.filter(result => {
      const resultDate = new Date(result.completed_at);
      return resultDate >= todayStart;
    });
    
    const todayScores = todayResults.map(result => result.total_score * 2); // Convert to /90 scale
    const todayAverage = todayScores.length > 0 
      ? todayScores.reduce((sum, score) => sum + score, 0) / todayScores.length 
      : 0;
    
    // Step 6: Calculate highest score of all time (converted to /90 scale)
    const allTestScores = results.map(result => result.total_score * 2); // Convert to /90 scale
    const highestScore = allTestScores.length > 0 ? Math.max(...allTestScores) : 0;
    
    // Step 7: Determine current level
    let currentLevel = 'Beginner';
    if (weeklyAverage >= 63) currentLevel = 'Advanced'; // Pass level
    else if (weeklyAverage >= 50) currentLevel = 'Intermediate';
    else if (weeklyAverage >= 30) currentLevel = 'Beginner+';
    
    // Step 8: Calculate weakest domain
    const domainScores: { [domain: string]: number[] } = {};
    
    results.forEach(result => {
      const domain = result.domain_title || 'Unknown';
      if (!domainScores[domain]) {
        domainScores[domain] = [];
      }
      domainScores[domain].push(result.total_score * 2); // Convert to /90 scale
    });
    
    let weakestDomain = 'No data available';
    let lowestAverage = Infinity;
    
    Object.entries(domainScores).forEach(([domain, scores]) => {
      if (scores.length >= 2) { // Only consider domains with at least 2 practice sessions
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        if (average < lowestAverage) {
          lowestAverage = average;
          weakestDomain = domain;
        }
      }
    });
    
    // Calculate strongest domain
    let strongestDomain = 'No data available';
    let highestAverage = -Infinity;
    
    const domainAverages: Record<string, number> = {};
    
    Object.entries(domainScores).forEach(([domain, scores]) => {
      if (scores.length >= 2) {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        domainAverages[domain] = average;
        if (average > highestAverage) {
          highestAverage = average;
          strongestDomain = domain;
        }
      }
    });

    return {
      weeklyAverage,
      growthPercentage,
      weeklyPerformance: Math.max(0, Math.min(100, weeklyPerformance)),
      totalTests: testScores.length,
      currentLevel,
      todayAverage,
      highestScore,
      weeklyTestCount,
      weakestDomain,
      strongestDomain,
      domainScores: domainAverages
    };
  };

  // Remove mock data - all data now comes from real API calls


  // Fetch user profile data including exam date
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view your dashboard.",
            variant: "destructive",
          });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('exam_date')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load your profile data.",
            variant: "destructive",
          });
        } else if (profile?.exam_date) {
          setExamDate(new Date(profile.exam_date));
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  // Fetch recent test results with domain information
  useEffect(() => {
    const fetchRecentResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: sessions, error } = await supabase
          .from('user_test_sessions')
          .select(`
            id,
            total_score,
            completed_at,
            status,
            time_spent_seconds,
            dialogues!user_test_sessions_dialogue_id_fkey (
              title,
              domains!dialogues_domain_id_fkey (
                title
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('total_score', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(50); // Increased limit to get more data for domain analysis

        if (error) {
          console.error('Error fetching recent results:', error);
        } else if (sessions) {
          const results: RecentTestResult[] = sessions.map(session => ({
            id: session.id,
            dialogue_title: session.dialogues?.title || 'Unknown Dialogue',
            total_score: session.total_score || 0,
            completed_at: session.completed_at || '',
            status: session.status,
            time_spent_seconds: session.time_spent_seconds || 0,
            domain_title: session.dialogues?.domains?.title || 'Unknown Domain'
          }));
          setRecentResults(results);
          
          // Calculate performance metrics using the new formula
          const metrics = calculatePerformanceMetrics(results);
          setPerformanceMetrics(metrics);
        }
      } catch (error) {
        console.error('Error fetching recent results:', error);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchRecentResults();
    
    // Set up real-time subscription for test sessions
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const channel = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_test_sessions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Test session updated, refreshing dashboard...');
            fetchRecentResults();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe?.then(cleanup => cleanup?.());
    };
  }, []);

  // Calculate days until exam with proper timezone handling
  const today = new Date();
  // Set today to start of day in local timezone to avoid timezone issues
  today.setHours(0, 0, 0, 0);
  
  const daysUntilExam = examDate ? (() => {
    const examDateCopy = new Date(examDate);
    examDateCopy.setHours(0, 0, 0, 0);
    const timeDiff = examDateCopy.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  })() : null;

  // Function to update exam date
  const updateExamDate = async (newDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Updating exam date for user:', user.id);
      console.log('New date to save:', newDate.toISOString().split('T')[0]);

      const { data, error } = await supabase
        .from('profiles')
        .update({ exam_date: newDate.toISOString().split('T')[0] })
        .eq('id', user.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        throw error;
      }

      setExamDate(newDate);
      setIsEditingDate(false);
      toast({
        title: "Success",
        description: "Exam date updated successfully",
      });
    } catch (error) {
      console.error('Error updating exam date:', error);
      toast({
        title: "Error",
        description: "Failed to update exam date",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <AnnouncementPopup />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">Track your progress and exam preparation</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Exam Countdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Countdown */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-primary">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Exam Countdown</span>
              </div>
              <Dialog open={isEditingDate} onOpenChange={setIsEditingDate}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Exam Date</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditingDate(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => selectedDate && updateExamDate(selectedDate)}
                        disabled={!selectedDate}
                      >
                        Save Date
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-muted-foreground">Loading your exam details...</div>
              </div>
            ) : !examDate ? (
              <div className="text-center py-8">
                <div className="text-lg text-muted-foreground mb-4">No exam date set</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your NAATI CCL exam date to track your progress
                </p>
                <Button 
                  onClick={() => {
                    setSelectedDate(undefined);
                    setIsEditingDate(true);
                  }}
                  className="mt-2"
                >
                  Set Exam Date
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {daysUntilExam !== null && daysUntilExam > 0 ? daysUntilExam : daysUntilExam === 0 ? "Today!" : "Past"}
                </div>
                <p className="text-muted-foreground mb-4">
                  {daysUntilExam !== null && daysUntilExam > 0 
                    ? "days until your NAATI CCL exam"
                    : daysUntilExam === 0 
                    ? "Your exam is today!"
                    : "exam date has passed"}
                </p>
                <p className="text-sm text-foreground">
                  Exam Date: {examDate.toLocaleDateString('en-AU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Performance Score */}
        <Card className="relative">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Weekly Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">
                  {performanceMetrics.weeklyTestCount >= 3 
                    ? `${Math.round(performanceMetrics.weeklyAverage)}/90` 
                    : '--/90'
                  }
                </span>
                <Badge variant={performanceMetrics.weeklyAverage >= 63 ? "default" : performanceMetrics.weeklyAverage >= 45 ? "secondary" : "destructive"}>
                  {performanceMetrics.currentLevel}
                </Badge>
              </div>
              <Progress value={(performanceMetrics.weeklyAverage / 90) * 100} className="h-3" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tests:</span>
                  <span className="font-medium ml-1">{performanceMetrics.weeklyTestCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Growth:</span>
                  <span className={`font-medium ml-1 ${performanceMetrics.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceMetrics.growthPercentage >= 0 ? '+' : ''}{Math.round(performanceMetrics.growthPercentage)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {performanceMetrics.weeklyTestCount >= 3 
                  ? "Average of mock test scores from last 7 days"
                  : "Complete 3+ mock tests in 7 days to unlock insights"
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StudyStats />


        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Today's Average</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {performanceMetrics.todayAverage > 0 ? `${Math.round(performanceMetrics.todayAverage)}/90` : '--/90'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Highest Score</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {performanceMetrics.highestScore > 0 ? `${performanceMetrics.highestScore}/90` : '--/90'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Probability */}
      <PassProbability />

      {/* Recent Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Practice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Recent Practice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resultsLoading ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Loading recent results...</div>
                </div>
              ) : recentResults.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">No completed tests yet</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete a dialogue practice to see your results here
                  </p>
                </div>
              ) : (
                recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.dialogue_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.completed_at).toLocaleDateString('en-AU')} • 
                        {Math.round(result.time_spent_seconds / 60)}min
                      </p>
                    </div>
                    <Badge variant={result.total_score >= 32 ? "default" : result.total_score >= 20 ? "secondary" : "destructive"}>
                      {result.total_score}/45
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Practice History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Study Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Study Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Focus Area</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                {performanceMetrics.weakestDomain === 'No data available' 
                  ? 'Complete more dialogues across different domains to see recommendations'
                  : `${performanceMetrics.weakestDomain} domain needs improvement`
                }
              </p>
              {performanceMetrics.weakestDomain !== 'No data available' && performanceMetrics.domainScores && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Average score: {Math.round(performanceMetrics.domainScores[performanceMetrics.weakestDomain] || 0)}/90
                </div>
              )}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Strength</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                {performanceMetrics.strongestDomain === 'No data available' 
                  ? 'Complete more practice to identify strengths'
                  : `Strong performance in ${performanceMetrics.strongestDomain}`
                }
              </p>
              {performanceMetrics.strongestDomain !== 'No data available' && performanceMetrics.domainScores && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Average score: {Math.round(performanceMetrics.domainScores[performanceMetrics.strongestDomain] || 0)}/90
                </div>
              )}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Translation</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                Focus on improving translation accuracy and speed
              </p>
              <div className="text-xs text-green-600 dark:text-green-400">
                Practice with diverse text types to enhance skills
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;