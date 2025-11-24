import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Download, Calendar, Settings, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
interface ProgressDataPoint {
  days_to_exam: number;
  attempt_at: string;
  test_total: number;
  dialogue1_total: number;
  dialogue2_total: number;
  accuracy: number;
  fluency: number;
  pronunciation: number;
  register: number;
  consistency: number;
  language_code: string;
  test_type: string;
}
interface Filters {
  daysRange: [number, number];
  languages: string[];
  testTypes: string[];
}
interface ParameterToggle {
  key: keyof ProgressDataPoint;
  label: string;
  color: string;
  max: number;
  enabled: boolean;
}
interface KPIs {
  nearestWeekAvg: number;
  trend: number;
  passReadiness: number;
}
export function NAATIProgressChart() {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgressDataPoint[]>([]);
  const [kpis, setKPIs] = useState<KPIs>({
    nearestWeekAvg: 0,
    trend: 0,
    passReadiness: 0
  });
  const [filters, setFilters] = useState<Filters>({
    daysRange: [-90, 7],
    languages: [],
    testTypes: []
  });
  const [parameterToggles, setParameterToggles] = useState<ParameterToggle[]>([{
    key: 'accuracy',
    label: 'Accuracy',
    color: '#8b5cf6',
    max: 20,
    enabled: false
  }, {
    key: 'fluency',
    label: 'Fluency',
    color: '#06b6d4',
    max: 10,
    enabled: false
  }, {
    key: 'pronunciation',
    label: 'Pronunciation',
    color: '#10b981',
    max: 7,
    enabled: false
  }, {
    key: 'register',
    label: 'Register',
    color: '#f59e0b',
    max: 5,
    enabled: false
  }, {
    key: 'consistency',
    label: 'Consistency',
    color: '#ef4444',
    max: 3,
    enabled: false
  }]);

  // Fetch progress data
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile first to get exam_date
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('exam_date').eq('id', user.id).single();
      if (profileError || !profile?.exam_date) {
        toast({
          title: "Error",
          description: "Could not find exam date. Please update your profile.",
          variant: "destructive"
        });
        return;
      }

      // Build query with filters
      let query = supabase.from('naati_attempts').select('*').eq('student_id', user.id).order('attempt_at', {
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
        console.error('Error fetching progress data:', error);
        toast({
          title: "Error",
          description: "Failed to load progress data.",
          variant: "destructive"
        });
        return;
      }
      if (!attempts || attempts.length === 0) {
        setData([]);
        return;
      }

      // Process data
      const examDate = new Date(profile.exam_date);
      const processedData: ProgressDataPoint[] = [];
      const seenDays = new Set<number>();
      attempts.forEach(attempt => {
        const attemptDate = new Date(attempt.attempt_at);
        const daysToExam = Math.floor((examDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));

        // Filter by days range
        if (daysToExam < filters.daysRange[0] || daysToExam > filters.daysRange[1]) {
          return;
        }

        // De-duplicate same day attempts (keep latest)
        if (seenDays.has(daysToExam)) {
          const existingIndex = processedData.findIndex(d => d.days_to_exam === daysToExam);
          if (existingIndex >= 0 && new Date(attempt.attempt_at) > new Date(processedData[existingIndex].attempt_at)) {
            processedData[existingIndex] = {
              days_to_exam: daysToExam,
              attempt_at: attempt.attempt_at,
              test_total: (attempt.dialogue1_total || 0) + (attempt.dialogue2_total || 0),
              dialogue1_total: attempt.dialogue1_total || 0,
              dialogue2_total: attempt.dialogue2_total || 0,
              accuracy: attempt.accuracy || 0,
              fluency: attempt.fluency || 0,
              pronunciation: attempt.pronunciation || 0,
              register: attempt.register || 0,
              consistency: attempt.consistency || 0,
              language_code: attempt.language_code,
              test_type: attempt.test_type
            };
          }
        } else {
          seenDays.add(daysToExam);
          processedData.push({
            days_to_exam: daysToExam,
            attempt_at: attempt.attempt_at,
            test_total: (attempt.dialogue1_total || 0) + (attempt.dialogue2_total || 0),
            dialogue1_total: attempt.dialogue1_total || 0,
            dialogue2_total: attempt.dialogue2_total || 0,
            accuracy: attempt.accuracy || 0,
            fluency: attempt.fluency || 0,
            pronunciation: attempt.pronunciation || 0,
            register: attempt.register || 0,
            consistency: attempt.consistency || 0,
            language_code: attempt.language_code,
            test_type: attempt.test_type
          });
        }
      });

      // Sort by days to exam
      processedData.sort((a, b) => a.days_to_exam - b.days_to_exam);
      setData(processedData);

      // Calculate KPIs
      calculateKPIs(processedData);
    } catch (error) {
      console.error('Error in fetchProgressData:', error);
    } finally {
      setLoading(false);
    }
  };
  const calculateKPIs = (data: ProgressDataPoint[]) => {
    // Nearest Week Avg (-7 to 0 days)
    const nearestWeekData = data.filter(d => d.days_to_exam >= -7 && d.days_to_exam <= 0);
    const nearestWeekAvg = nearestWeekData.length > 0 ? nearestWeekData.reduce((sum, d) => sum + d.test_total, 0) / nearestWeekData.length : 0;

    // Trend (30-day slope)
    const trendData = data.filter(d => d.days_to_exam >= -30 && d.days_to_exam <= 0);
    let trend = 0;
    if (trendData.length >= 2) {
      const n = trendData.length;
      const sumX = trendData.reduce((sum, d) => sum + d.days_to_exam, 0);
      const sumY = trendData.reduce((sum, d) => sum + d.test_total, 0);
      const sumXY = trendData.reduce((sum, d) => sum + d.days_to_exam * d.test_total, 0);
      const sumXX = trendData.reduce((sum, d) => sum + d.days_to_exam * d.days_to_exam, 0);
      trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // Pass Readiness (last 14 days)
    const readinessData = data.filter(d => d.days_to_exam >= -14 && d.days_to_exam <= 0);
    const passReadiness = readinessData.length > 0 ? readinessData.filter(d => d.test_total >= 63).length / readinessData.length * 100 : 0;
    setKPIs({
      nearestWeekAvg,
      trend,
      passReadiness
    });
  };
  useEffect(() => {
    fetchProgressData();
  }, [filters]);

  // Toggle parameter line
  const toggleParameter = (key: keyof ProgressDataPoint) => {
    setParameterToggles(prev => prev.map(toggle => toggle.key === key ? {
      ...toggle,
      enabled: !toggle.enabled
    } : toggle));
  };

  // Export CSV
  const exportCSV = () => {
    if (data.length === 0) return;
    const csvHeaders = ['Days to Exam', 'Attempt Date', 'Test Total', 'Dialogue 1', 'Dialogue 2', 'Accuracy', 'Fluency', 'Pronunciation', 'Register', 'Consistency', 'Language', 'Test Type'];
    const csvRows = data.map(row => [row.days_to_exam, new Date(row.attempt_at).toLocaleDateString(), row.test_total, row.dialogue1_total, row.dialogue2_total, row.accuracy, row.fluency, row.pronunciation, row.register, row.consistency, row.language_code, row.test_type]);
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `naati-progress-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label} days to exam`}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(dataPoint.attempt_at).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className="font-medium">Total: {dataPoint.test_total}/90</span>
            {dataPoint.test_total >= 63 ? <CheckCircle className="inline ml-1 h-3 w-3 text-green-500" /> : <AlertTriangle className="inline ml-1 h-3 w-3 text-yellow-500" />}
          </p>
          <div className="text-xs space-y-1 mt-2">
            <div>Dialogue 1: {dataPoint.dialogue1_total}/45</div>
            <div>Dialogue 2: {dataPoint.dialogue2_total}/45</div>
            <div>Accuracy: {dataPoint.accuracy}/20</div>
            <div>Fluency: {dataPoint.fluency}/10</div>
            <div>Pronunciation: {dataPoint.pronunciation}/7</div>
            <div>Register: {dataPoint.register}/5</div>
            <div>Consistency: {dataPoint.consistency}/3</div>
          </div>
        </div>;
    }
    return null;
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>Progress vs Exam Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">Loading progress data...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (data.length === 0) {
    return <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Progress vs Exam Date</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="days-range">Days Range:</Label>
              <span className="text-sm text-muted-foreground">
                {filters.daysRange[0]} to {filters.daysRange[1]}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-lg font-medium text-muted-foreground mb-2">
              No attempts in selected window
            </div>
            <p className="text-sm text-muted-foreground">
              Try widening the days range or complete a mock test.
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      

      
    </Card>;
}