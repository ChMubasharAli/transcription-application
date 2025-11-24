import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';

interface PassProbabilityData {
  passProbabilityPercent: number;
  projectedScore: number;
  daysLeft: number;
  attempts14: number;
  lastScore: number;
  prevScore: number;
  weeklyAvg: number;
  slopePerDay: number;
  growth: number;
  baseProbability: number;
  weeklyProbability: number;
  momentum: number;
  confidence: number;
  mocksTotal?: number;
}

export function PassProbability() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PassProbabilityData | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Utility functions
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

  const fetchPassProbability = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's exam date from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('exam_date')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profile, 'Error:', profileError);

      if (!profile?.exam_date) {
        setData(null);
        return;
      }

      // Calculate days left
      const examDate = new Date(profile.exam_date);
      const today = new Date();
      const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Fetch last 90 days of attempts
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 90);

      const { data: attempts, error } = await supabase
        .from('naati_attempts')
        .select('*')
        .eq('student_id', user.id)
        .gte('attempt_at', pastDate.toISOString())
        .order('attempt_at', { ascending: true });

      if (error) {
        console.error('Error fetching attempts:', error);
        toast({
          title: "Error",
          description: "Failed to load pass probability data.",
          variant: "destructive",
        });
        return;
      }

      if (!attempts || attempts.length < 1) {
        setData(null);
        return;
      }

      // Count mock tests (full-test type only)
      const mocksTotal = attempts.filter(a => a.test_type === 'full-test').length;

      // If fewer than 3 mock tests, don't calculate probability
      if (mocksTotal < 3) {
        setData({
          passProbabilityPercent: 0,
          projectedScore: 0,
          daysLeft,
          attempts14: 0,
          lastScore: 0,
          prevScore: 0,
          weeklyAvg: 0,
          slopePerDay: 0,
          growth: 0,
          baseProbability: 0,
          weeklyProbability: 0,
          momentum: 0,
          confidence: 0,
          mocksTotal
        });
        return;
      }

      // Calculate test totals and process attempts
      const processedAttempts = attempts.map(attempt => ({
        ...attempt,
        testTotal: (attempt.dialogue1_total || 0) + (attempt.dialogue2_total || 0),
        attemptDate: new Date(attempt.attempt_at)
      })).sort((a, b) => a.attemptDate.getTime() - b.attemptDate.getTime());

      // Get latest scores
      const lastScore = processedAttempts[processedAttempts.length - 1]?.testTotal || 0;
      const prevScore = processedAttempts.length > 1 ? 
        processedAttempts[processedAttempts.length - 2]?.testTotal || lastScore : lastScore;

      // Calculate weekly average (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyAttempts = processedAttempts.filter(a => a.attemptDate >= weekAgo);
      const weeklyAvg = weeklyAttempts.length > 0 ? 
        weeklyAttempts.reduce((sum, a) => sum + a.testTotal, 0) / weeklyAttempts.length : lastScore;

      // Count attempts in last 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const attempts14 = processedAttempts.filter(a => a.attemptDate >= twoWeeksAgo).length;

      // Calculate slope (linear regression over last 14 days)
      const recentAttempts = processedAttempts.filter(a => a.attemptDate >= twoWeeksAgo);
      let slopePerDay = 0;
      
      if (recentAttempts.length >= 2) {
        // Simple linear regression
        const n = recentAttempts.length;
        const sumX = recentAttempts.reduce((sum, a, i) => sum + i, 0);
        const sumY = recentAttempts.reduce((sum, a) => sum + a.testTotal, 0);
        const sumXY = recentAttempts.reduce((sum, a, i) => sum + (i * a.testTotal), 0);
        const sumXX = recentAttempts.reduce((sum, a, i) => sum + (i * i), 0);
        
        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) {
          slopePerDay = (n * sumXY - sumX * sumY) / denominator;
        }
      } else if (recentAttempts.length === 1 && processedAttempts.length > 1) {
        // Fallback calculation
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const score7DaysAgo = processedAttempts.find(a => a.attemptDate <= sevenDaysAgo)?.testTotal || lastScore;
        const daysBetween = Math.max(1, (today.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
        slopePerDay = (lastScore - score7DaysAgo) / daysBetween;
      }

      // Apply the formula
      const growth = clamp((lastScore - prevScore) / Math.max(prevScore, 1), -0.5, 0.5);
      const projectedScore = clamp(
        lastScore + clamp(slopePerDay, -2, 2) * Math.min(daysLeft, 21), 
        0, 
        90
      );
      
      const baseProbability = sigmoid((projectedScore - 63) / 5);
      const weeklyProbability = sigmoid((weeklyAvg - 63) / 5);
      const momentum = 1 + 0.5 * growth;
      const confidence = clamp(Math.log(1 + attempts14) / Math.log(1 + 7), 0, 1);
      
      const finalProb = clamp(
        (0.7 * baseProbability + 0.3 * weeklyProbability) * momentum, 
        0, 
        1
      ) * (0.6 + 0.4 * confidence);
      
      const passProbabilityPercent = Math.round(100 * finalProb);

      setData({
        passProbabilityPercent,
        projectedScore,
        daysLeft,
        attempts14,
        lastScore,
        prevScore,
        weeklyAvg,
        slopePerDay,
        growth,
        baseProbability,
        weeklyProbability,
        momentum,
        confidence
      });

    } catch (error) {
      console.error('Error calculating pass probability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassProbability();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pass Probability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground">Calculating probability...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pass Probability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg font-medium text-muted-foreground mb-2">
              No exam date set
            </div>
            <p className="text-sm text-muted-foreground">
              Please update your profile with your exam date to see pass probability.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-green-600';
    if (prob >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBadge = (projectedScore: number) => {
    if (projectedScore >= 63) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Pass Probability</span>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <div className={`space-y-4 ${(data.mocksTotal || 0) < 3 ? 'blur-sm' : ''}`}>
          {/* Main KPI */}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {(data.mocksTotal || 0) >= 3 ? `${data.passProbabilityPercent}%` : '---%'}
            </span>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Score:</span>
              <span className="font-medium ml-1">{Math.round(data.lastScore)}/90</span>
            </div>
            <div>
              <span className="text-muted-foreground">Days:</span>
              <span className="font-medium ml-1">{data.daysLeft}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tests:</span>
              <span className="font-medium ml-1">{data.attempts14}</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Projected score: {Math.round(data.projectedScore)}/90 based on recent performance
          </div>

          {/* Explanation */}
          {showExplanation && (data.mocksTotal || 0) >= 3 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Calculation Details</h4>
              <div className="space-y-1 text-sm">
                <div>Growth: {(data.growth * 100).toFixed(1)}%</div>
                <div>Base Probability: {(data.baseProbability * 100).toFixed(1)}%</div>
                <div>Weekly Probability: {(data.weeklyProbability * 100).toFixed(1)}%</div>
                <div>Momentum Factor: {data.momentum.toFixed(2)}</div>
                <div>Confidence: {(data.confidence * 100).toFixed(1)}%</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Formula: (0.7×base + 0.3×weekly) × momentum × (0.6 + 0.4×confidence)
              </div>
            </div>
          )}
        </div>
        
        {(data.mocksTotal || 0) < 3 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="text-center p-4">
              <p className="text-sm font-medium text-foreground">Not enough data — practice more to access this insight</p>
              <p className="text-xs text-muted-foreground mt-1">Do at least 3 mock tests</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}