import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useFluctuatingNumber } from '@/hooks/useAnimatedCounter';

const PerformanceChart = () => {
  // Fluctuating performance scores
  const speakingScore = useFluctuatingNumber(78, 2);
  const writingScore = useFluctuatingNumber(85, 2);
  const readingScore = useFluctuatingNumber(82, 2);
  const listeningScore = useFluctuatingNumber(88, 2);
  
  // Previous week scores for comparison
  const prevSpeaking = useFluctuatingNumber(74, 1);
  const prevWriting = useFluctuatingNumber(82, 1);
  const prevReading = useFluctuatingNumber(79, 1);
  const prevListening = useFluctuatingNumber(85, 1);

  // Week 1 & 2 fluctuating scores
  const week1Avg = useFluctuatingNumber(70, 1);
  const week2Avg = useFluctuatingNumber(76, 1);

  const weeklyData = [
    { week: 'Week 1', speaking: 65, writing: 72, reading: 68, listening: 75, avg: Math.round(week1Avg) },
    { week: 'Week 2', speaking: 70, writing: 78, reading: 74, listening: 80, avg: Math.round(week2Avg) },
    { week: 'Week 3', speaking: Math.round(prevSpeaking), writing: Math.round(prevWriting), reading: Math.round(prevReading), listening: Math.round(prevListening), avg: Math.round((prevSpeaking + prevWriting + prevReading + prevListening) / 4) },
    { week: 'Week 4', speaking: Math.round(speakingScore), writing: Math.round(writingScore), reading: Math.round(readingScore), listening: Math.round(listeningScore), avg: Math.round((speakingScore + writingScore + readingScore + listeningScore) / 4) },
  ];

  const currentWeek = weeklyData[weeklyData.length - 1];
  const previousWeek = weeklyData[weeklyData.length - 2];

  const getChange = (current: number, previous: number) => {
    return current - previous;
  };

  return (
    <Card className="p-6 bg-gradient-card hover:shadow-3d transition-all duration-300 animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Weekly Performance</h3>
            <p className="text-sm text-muted-foreground">Track your progress over time</p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="space-y-4 mb-6">
        {Object.entries(currentWeek).slice(1).map(([skill, score]) => {
          const change = getChange(score as number, (previousWeek as any)[skill]);
          const isImprovement = change > 0;
          
          const skillLabels: { [key: string]: string } = {
            speaking: 'Accuracy',
            writing: 'Language Quality', 
            reading: 'Register',
            listening: 'Delivery'
          };
          
          return (
            <div key={skill} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-card-foreground">{skillLabels[skill]}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-card-foreground animate-pulse">{score}%</span>
                  <div className={`flex items-center space-x-1 text-xs ${isImprovement ? 'text-green-600' : 'text-red-500'}`}>
                    {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="animate-pulse">{Math.abs(change)}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    skill === 'speaking' ? 'bg-green-500' :
                    skill === 'writing' ? 'bg-blue-500' :
                    skill === 'reading' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Overview */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-card-foreground mb-3">4-Week Progress</h4>
        <div className="flex justify-between">
          {weeklyData.map((week, index) => (
            <div key={week.week} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{week.week}</div>
              <div className={`w-8 h-16 rounded-t-lg ${
                index === weeklyData.length - 1 ? 'bg-gradient-primary' : 'bg-secondary'
              } relative`}>
                <div 
                  className="w-full bg-gradient-primary rounded-t-lg transition-all duration-500"
                  style={{ 
                    height: `${week.avg}%`,
                  }}
                />
              </div>
              <div className="text-xs font-medium text-card-foreground mt-1 animate-pulse">
                {week.avg}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PerformanceChart;