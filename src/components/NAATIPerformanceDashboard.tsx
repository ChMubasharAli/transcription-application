import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Download, Calendar, Filter, CheckCircle, AlertTriangle } from 'lucide-react';
interface WeeklyData {
  week_start: string;
  attempts_count: number;
  weekly_avg_total: number;
  weekly_accuracy: number;
  weekly_fluency: number;
  weekly_pronunciation: number;
  weekly_register: number;
  weekly_consistency: number;
  pass_rate: number;
}
interface Filters {
  dateRange: string;
  languages: string[];
  testTypes: string[];
}
interface KPIs {
  thisWeekAvg: number;
  trendPercentage: number;
  passRate: number;
}
export function NAATIPerformanceDashboard() {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [kpis, setKPIs] = useState<KPIs>({
    thisWeekAvg: 0,
    trendPercentage: 0,
    passRate: 0
  });
  const [filters, setFilters] = useState<Filters>({
    dateRange: '8weeks',
    languages: [],
    testTypes: []
  });

  // Fetch NAATI performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const weeksBack = filters.dateRange === '4weeks' ? 4 : 8;
      startDate.setDate(endDate.getDate() - weeksBack * 7);

      // Build query with filters
      let query = supabase.from('naati_attempts').select('*').eq('student_id', user.id).gte('attempt_at', startDate.toISOString()).lte('attempt_at', endDate.toISOString()).order('week_start', {
        ascending: true
      });

      // Apply language filter
      if (filters.languages.length > 0) {
        query = query.in('language_code', filters.languages);
      }

      // Apply test type filter
      if (filters.testTypes.length > 0) {
        query = query.in('test_type', filters.testTypes);
      }
      const {
        data: attempts,
        error
      } = await query;
      if (error) {
        console.error('Error fetching NAATI data:', error);
        toast({
          title: "Error",
          description: "Failed to load performance data.",
          variant: "destructive"
        });
        return;
      }

      // Process data into weekly aggregates
      const weeklyMap = new Map<string, any>();
      attempts?.forEach(attempt => {
        const weekKey = attempt.week_start;
        const testTotal = (attempt.dialogue1_total || 0) + (attempt.dialogue2_total || 0);
        const isPassing = testTotal >= 63;
        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, {
            week_start: weekKey,
            attempts: [],
            totalScores: [],
            accuracyScores: [],
            fluencyScores: [],
            pronunciationScores: [],
            registerScores: [],
            consistencyScores: [],
            passingAttempts: 0
          });
        }
        const weekData = weeklyMap.get(weekKey);
        weekData.attempts.push(attempt);
        weekData.totalScores.push(testTotal);
        weekData.accuracyScores.push(attempt.accuracy || 0);
        weekData.fluencyScores.push(attempt.fluency || 0);
        weekData.pronunciationScores.push(attempt.pronunciation || 0);
        weekData.registerScores.push(attempt.register || 0);
        weekData.consistencyScores.push(attempt.consistency || 0);
        if (isPassing) weekData.passingAttempts++;
      });

      // Calculate weekly aggregates
      const processedWeekly: WeeklyData[] = Array.from(weeklyMap.values()).map(week => ({
        week_start: week.week_start,
        attempts_count: week.attempts.length,
        weekly_avg_total: week.totalScores.reduce((sum: number, score: number) => sum + score, 0) / week.totalScores.length,
        weekly_accuracy: week.accuracyScores.reduce((sum: number, score: number) => sum + score, 0) / week.accuracyScores.length,
        weekly_fluency: week.fluencyScores.reduce((sum: number, score: number) => sum + score, 0) / week.fluencyScores.length,
        weekly_pronunciation: week.pronunciationScores.reduce((sum: number, score: number) => sum + score, 0) / week.pronunciationScores.length,
        weekly_register: week.registerScores.reduce((sum: number, score: number) => sum + score, 0) / week.registerScores.length,
        weekly_consistency: week.consistencyScores.reduce((sum: number, score: number) => sum + score, 0) / week.consistencyScores.length,
        pass_rate: week.passingAttempts / week.attempts.length * 100
      })).sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());
      setWeeklyData(processedWeekly);

      // Calculate KPIs
      if (processedWeekly.length > 0) {
        const thisWeek = processedWeekly[processedWeekly.length - 1];
        const firstWeek = processedWeekly[0];
        let trendPercentage = 0;
        if (processedWeekly.length >= 2 && firstWeek.weekly_avg_total > 0) {
          trendPercentage = (thisWeek.weekly_avg_total - firstWeek.weekly_avg_total) / firstWeek.weekly_avg_total * 100;
        }
        const totalAttempts = processedWeekly.reduce((sum, week) => sum + week.attempts_count, 0);
        const passingAttempts = processedWeekly.reduce((sum, week) => sum + week.pass_rate / 100 * week.attempts_count, 0);
        const overallPassRate = totalAttempts > 0 ? passingAttempts / totalAttempts * 100 : 0;
        setKPIs({
          thisWeekAvg: thisWeek.weekly_avg_total,
          trendPercentage,
          passRate: overallPassRate
        });
      }
    } catch (error) {
      console.error('Error in fetchPerformanceData:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPerformanceData();
  }, [filters]);

  // Export CSV function
  const exportCSV = () => {
    if (weeklyData.length === 0) return;
    const csvHeaders = ['Week Start', 'Attempts', 'Avg Total', 'Accuracy', 'Fluency', 'Pronunciation', 'Register', 'Consistency', 'Pass Rate %'];
    const csvRows = weeklyData.map(week => [week.week_start, week.attempts_count, Math.round(week.weekly_avg_total), Math.round(week.weekly_accuracy), Math.round(week.weekly_fluency), Math.round(week.weekly_pronunciation), Math.round(week.weekly_register), Math.round(week.weekly_consistency), Math.round(week.pass_rate)]);
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `naati-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Format week display
  const formatWeek = (weekStart: string) => {
    const date = new Date(weekStart);
    return `Week of ${date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short'
    })}`;
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>NAATI Performance (Weekly)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">Loading performance data...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (weeklyData.length === 0) {
    return <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>NAATI Performance (Weekly)</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={filters.dateRange} onValueChange={value => setFilters(prev => ({
            ...prev,
            dateRange: value
          }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4weeks">4 Weeks</SelectItem>
                <SelectItem value="8weeks">8 Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-lg font-medium text-muted-foreground mb-2">
              No attempts in this period
            </div>
            <p className="text-sm text-muted-foreground">
              Try expanding the date range or completing a mock test.
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  return;
}