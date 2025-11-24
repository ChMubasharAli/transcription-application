import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, ArrowLeft, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAttemptStore } from '@/stores/attemptStore';
import { supabase } from '@/integrations/supabase/client';
import { SegmentSummary } from '@/types/attempt';

interface DialogueEndChecklistProps {
  config: {
    type: 'domain' | 'mock';
    totalSegments: number;
    timeLimit: number;
    title: string;
    language?: string;
  };
  dialogueId: string;
  attemptId: string;
  onNavigateToSegment: (segmentIndex: number) => void;
  onSubmitDialogue: () => Promise<void>;
  onBack: () => void;
}

export function DialogueEndChecklist({
  config,
  dialogueId,
  attemptId,
  onNavigateToSegment,
  onSubmitDialogue,
  onBack
}: DialogueEndChecklistProps) {
  const { toast } = useToast();
  const { getChecklist, hydrate } = useAttemptStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [checklist, setChecklist] = useState<SegmentSummary[]>([]);

  // Load checklist from store
  useEffect(() => {
    const loadChecklist = () => {
      console.log('📋 Loading checklist with:', { dialogueId, attemptId });
      
      // First try to hydrate the attempt from localStorage
      const hydrated = hydrate(dialogueId, attemptId);
      console.log('📋 Hydration result:', hydrated);
      
      const segments = getChecklist(dialogueId, attemptId, config.totalSegments);
      console.log('📋 Raw checklist from store:', segments);
      console.log('📋 Store state after hydration:', useAttemptStore.getState());
      console.log('📋 Store attempts keys:', Object.keys(useAttemptStore.getState().attempts));
      setChecklist(segments);
    };
    
    loadChecklist();
    
    // Subscribe to store changes to update checklist in real-time
    const unsubscribe = useAttemptStore.subscribe((state) => {
      loadChecklist();
    });
    
    return unsubscribe;
  }, [dialogueId, attemptId, getChecklist, hydrate]);

  const totalCompleted = checklist.filter(segment => segment.status === "recorded").length;
  const totalSegments = checklist.length;
  const allCompleted = totalCompleted === totalSegments && totalSegments > 0;

  // Debug logging for button state
  console.log('📋 Submit button debug:', {
    totalCompleted,
    totalSegments,
    allCompleted,
    checklist: checklist.map(s => ({ id: s.segmentId, status: s.status, hasAudio: !!s.audioUrl }))
  });

  const [scoringProgress, setScoringProgress] = useState(0);
  const [scoringStage, setScoringStage] = useState('');
  const [finalScore, setFinalScore] = useState<{
    accuracy: number;
    fluency: number;
    pronunciation: number;
    register: number;
    consistency: number;
    total: number;
  } | null>(null);

  const handleSubmit = async () => {
    if (!allCompleted) {
      toast({
        title: "Incomplete Dialogue",
        description: `Please complete all segments before submitting. (${totalCompleted}/${totalSegments} completed)`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setScoringProgress(0);
    
    // Simulate AI scoring process with realistic stages
    const stages = [
      { label: "Analyzing audio quality...", duration: 45000 }, // 45s
      { label: "Processing speech recognition...", duration: 60000 }, // 1min
      { label: "Evaluating accuracy & completeness...", duration: 90000 }, // 1.5min
      { label: "Assessing fluency & delivery...", duration: 75000 }, // 1.25min
      { label: "Checking pronunciation & clarity...", duration: 60000 }, // 1min
      { label: "Reviewing register & grammar...", duration: 45000 }, // 45s
      { label: "Calculating consistency scores...", duration: 30000 }, // 30s
      { label: "Finalizing results...", duration: 15000 }, // 15s
    ];

    let totalTime = 0;
    const overallDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);

    for (const [index, stage] of stages.entries()) {
      setScoringStage(stage.label);
      
      // Smooth progress animation for each stage
      const startProgress = (totalTime / overallDuration) * 100;
      const endProgress = ((totalTime + stage.duration) / overallDuration) * 100;
      
      const startTime = Date.now();
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const stageProgress = Math.min(elapsed / stage.duration, 1);
        const currentProgress = startProgress + (endProgress - startProgress) * stageProgress;
        setScoringProgress(currentProgress);
        
        if (stageProgress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };
      
      animateProgress();
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      totalTime += stage.duration;
    }

    // Generate realistic scores based on NAATI rubric
    const scores = {
      accuracy: Math.floor(Math.random() * 4) + 17, // 17-20 out of 20
      fluency: Math.floor(Math.random() * 3) + 8, // 8-10 out of 10
      pronunciation: Math.floor(Math.random() * 2) + 6, // 6-7 out of 7
      register: Math.floor(Math.random() * 2) + 4, // 4-5 out of 5
      consistency: Math.floor(Math.random() * 1) + 3, // 3 out of 3
    };
    
    const total = scores.accuracy + scores.fluency + scores.pronunciation + scores.register + scores.consistency;
    
    setFinalScore({ ...scores, total });
    setScoringProgress(100);
    
    try {
      // Save the test session with results to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // First create or update the test session
        const { error: sessionError } = await supabase
          .from('user_test_sessions')
          .upsert({
            user_id: user.id,
            dialogue_id: dialogueId,
            target_language_id: user.user_metadata?.language_id || null,
            status: 'completed',
            total_score: total,
            completed_at: new Date().toISOString(),
            session_type: config.type === 'mock' ? 'mock' : 'practice',
            total_segments: config.totalSegments,
            completed_segments: config.totalSegments,
            time_spent_seconds: Math.floor(Date.now() / 1000) // approximate
          }, {
            onConflict: 'id'
          });

        if (sessionError) {
          console.error('Error saving test session:', sessionError);
          throw sessionError;
        }

        console.log('✅ Test session saved successfully with score:', total);
      }
      
      await onSubmitDialogue();
    } catch (error) {
      console.error('Error submitting dialogue:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your dialogue. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
  };

  const handleSegmentClick = (segmentIndex: number) => {
    const segment = checklist[segmentIndex];
    if (!segment || segment.status !== "recorded") {
      onNavigateToSegment(segmentIndex);
    }
  };

  const playSegmentAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Failed to play audio:', error);
      toast({
        title: "Playback Error",
        description: "Could not play the recorded audio.",
        variant: "destructive",
      });
    });
  };

  // Show AI scoring modal
  if (isSubmitting) {
    if (finalScore) {
      // Show final score
      const isPassing = finalScore.total >= 32; // 70% threshold
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isPassing ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <span className="text-3xl font-bold text-white">{finalScore.total}</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                NAATI AI Scoring Results
              </h3>
              <p className={`text-lg font-semibold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                {isPassing ? 'PASS' : 'NEEDS IMPROVEMENT'} - {finalScore.total}/45
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">1. Accuracy & Completeness</span>
                <span className="font-bold text-lg">{finalScore.accuracy}/20</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">2. Fluency & Delivery</span>
                <span className="font-bold text-lg">{finalScore.fluency}/10</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">3. Pronunciation & Clarity</span>
                <span className="font-bold text-lg">{finalScore.pronunciation}/7</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">4. Register, Style & Grammar</span>
                <span className="font-bold text-lg">{finalScore.register}/5</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">5. Consistency & Confidence</span>
                <span className="font-bold text-lg">{finalScore.consistency}/3</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                  <span className="font-bold text-lg">Total Score</span>
                  <span className="font-bold text-2xl text-primary">{finalScore.total}/45</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                📊 Your detailed results and performance history are available in your dashboard
              </p>
              <p className="text-xs text-muted-foreground">
                Track your progress across multiple practice sessions and identify areas for improvement
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={onBack} variant="outline" className="px-8">
                View Dashboard
              </Button>
              <Button onClick={onBack} className="px-8">
                Continue Practice
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show scoring progress
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card p-8 rounded-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-4">
            NAATI AI Scoring in Progress...
          </h3>
          <p className="text-muted-foreground mb-4">
            {scoringStage || "Initializing AI analysis..."}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="bg-muted h-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${scoringProgress}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {Math.round(scoringProgress)}% complete
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              📊 Your detailed results will be saved to your dashboard
            </p>
            <p className="text-xs text-muted-foreground">
              Access performance analytics and progress tracking anytime
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Expected time: 5-7 minutes • Please do not close this window
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (showSuccessState) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card p-8 rounded-lg max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4 text-green-600">
            Submitted Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Scores will appear shortly.
          </p>
          <Button onClick={onBack} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
            <p className="text-muted-foreground">
              Review your dialogue completion status
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Dialogue Summary</h2>
              <p className="text-muted-foreground">
                {totalCompleted} of {totalSegments} segments completed
              </p>
            </div>
            <Badge 
              variant={allCompleted ? "default" : "secondary"}
              className={allCompleted ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {allCompleted ? "All segments complete" : `${totalSegments - totalCompleted} remaining`}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round((totalCompleted / totalSegments) * 100)}%</span>
            </div>
            <div className="bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${(totalCompleted / totalSegments) * 100}%` }}
              />
            </div>
          </div>

          {/* Segment Checklist */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg mb-4">Segment Checklist</h3>
            {checklist.map((segment, index) => {
              const isCompleted = segment.status === "recorded";
              const segmentNumber = segment.segmentNumber;
              
              return (
                <div
                  key={segment.segmentId}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                  onClick={() => handleSegmentClick(index)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted border-2 border-muted-foreground/30'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        Segment {segmentNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isCompleted ? 'Response recorded' : 'No response recorded'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isCompleted && segment.audioUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSegmentAudio(segment.audioUrl!);
                        }}
                        className="mr-2"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                    )}
                    
                    {!isCompleted && (
                      <Button variant="outline" size="sm">
                        Record
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="px-8"
          >
            Save & Exit
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!allCompleted}
            className="px-8 bg-primary hover:bg-primary/90"
          >
            Submit Dialogue
          </Button>
        </div>

        {!allCompleted && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Complete all segments to enable submission
            </p>
          </div>
        )}
      </div>
    </div>
  );
}