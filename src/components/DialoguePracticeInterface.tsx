import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Play,
  Pause,
  RotateCcw,
  Mic,
  Square,
  Volume2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  VolumeX,
  Check,
  Download,
  Star,
  BarChart3,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AudioWaveform } from "@/components/AudioWaveform";
import { useSegmentPersistence } from "@/hooks/useSegmentPersistence";
import { DialogueEndChecklist } from "@/components/DialogueEndChecklist";
import { useAttemptStore, useCurrentAttempt } from "@/stores/attemptStore";

interface AudioWaveformRef {
  play: () => void;
  pause: () => void;
  playPause: () => void;
  isReady: () => boolean;
  setVolume: (volume: number) => void;
  stopRecording: () => void;
  isRecording: () => boolean;
  seekToStart: () => void;
  getRecordingTime: () => number;
  startRecording: () => void;
  playRecordedAudio: () => void;
  saveRecording: () => void;
}

interface DialogueConfig {
  type: "domain" | "mock";
  totalSegments: number;
  timeLimit: number;
  title: string;
  language?: string;
  dialogueId: string;
  description?: string;
  difficulty?: string;
  domain?: {
    color: string;
    title: string;
  };
}

interface DialogueSegment {
  id: string;
  dialogue_id: string;
  segment_order: number;
  text_content: string;
  audio_url: string;
  start_time: number;
  end_time: number;
  speaker: string | null;
  translation: string | null;
  created_at: string;
  updated_at: string;
}

interface DialoguePracticeInterfaceProps {
  config: DialogueConfig;
  onComplete: (results?: any) => void;
  onBack: () => void;
}

interface ScoreResponse {
  success: boolean;
  dialogues: Array<{
    dialogueIndex: number;
    transcript: string;
    reference_transcript: string;
    student_transcript: string;
    scores: {
      accuracy_score: number;
      accuracy_feedback: string;
      language_quality_score: number;
      language_quality_feedback: string;
      fluency_pronunciation_score: number;
      fluency_pronunciation_feedback: string;
      delivery_coherence_score: number;
      delivery_coherence_feedback: string;
      cultural_context_score: number;
      cultural_context_feedback: string;
      response_management_score: number;
      response_management_feedback: string;
      total_raw_score: number;
      final_score: number;
      one_line_feedback: string;
    };
    one_line_feedback: string;
  }>;
  combined_score: number;
  overall_feedback: string;
}

export function DialoguePracticeInterface({
  config,
  onComplete,
  onBack,
}: DialoguePracticeInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize attempt store
  const startAttempt = useAttemptStore((state) => state.startAttempt);
  const currentAttempt = useCurrentAttempt();

  // State for new flow
  const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>(
    []
  );
  const [currentSegment, setCurrentSegment] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);

  // Audio and recording states
  const [currentSegmentData, setCurrentSegmentData] =
    useState<DialogueSegment | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>("");
  const [attempts, setAttempts] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const [overallTimeLeft, setOverallTimeLeft] = useState(10 * 60);

  const audioWaveformRef = useRef<AudioWaveformRef>(null);
  const overallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedAnswerIds = useRef<string[]>([]);
  const segmentScores = useRef<Map<string, any>>(new Map());

  // STEP 1: Fetch dialogue segments when component mounts
  useEffect(() => {
    const fetchDialogueSegments = async () => {
      if (!user || !config.dialogueId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Missing user or dialogue information.",
        });
        return;
      }

      try {
        setLoading(true);
        console.log("📥 Fetching dialogue segments for:", config.dialogueId);

        const { data, error } = await supabase.functions.invoke(
          "get-dialogue-segments",
          {
            body: { dialogueId: config.dialogueId },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success && data.segments) {
          setDialogueSegments(data.segments);
          console.log("✅ Loaded segments:", data.segments.length);

          // Initialize with first segment
          if (data.segments.length > 0) {
            setCurrentSegmentData(data.segments[0]);
            loadAudioUrl(data.segments[0]);
          }
        } else {
          throw new Error("Failed to load dialogue segments");
        }
      } catch (error) {
        console.error("Error fetching dialogue segments:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dialogue segments. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDialogueSegments();
  }, [user, config.dialogueId, toast]);

  // Initialize attempt store
  useEffect(() => {
    if (dialogueSegments.length > 0) {
      const attemptId = startAttempt(config.dialogueId);
      console.log("🎯 Started attempt:", attemptId);
    }
  }, [dialogueSegments, config.dialogueId, startAttempt]);

  // Overall timer
  useEffect(() => {
    overallTimerRef.current = setInterval(() => {
      setOverallTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    };
  }, []);

  const loadAudioUrl = async (segment: DialogueSegment) => {
    if (!segment.audio_url) {
      console.warn("No audio URL for segment:", segment);
      return;
    }

    try {
      console.log("🔊 Loading audio URL for segment:", segment.audio_url);
      const { data } = await supabase.storage
        .from("dialogue-audio")
        .createSignedUrl(segment.audio_url, 3600);

      if (data?.signedUrl) {
        const fullUrl = data.signedUrl.startsWith("http")
          ? data.signedUrl
          : `https://mqfcxhlfuqyakkrccmpj.supabase.co${data.signedUrl}`;
        setCurrentAudioUrl(fullUrl);
        console.log("✅ Audio URL loaded:", fullUrl);
      } else {
        throw new Error("Failed to get signed URL");
      }
    } catch (error) {
      console.error("Error loading audio URL:", error);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Failed to load audio file. Please try again.",
      });
    }
  };

  const handleTimeUp = () => {
    toast({
      variant: "destructive",
      title: "Time's Up!",
      description:
        "10-minute time limit reached. Practice session will be completed.",
    });
    handleComplete();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Button state logic
  const getButtonState = () => {
    if (!hasPlayedOnce && !isRecording && !recordingCompleted) {
      return { text: "Start", action: "start" };
    } else if (isPlaying && !audioEnded) {
      return { text: "Playing...", action: "playing" };
    } else if (isRecording) {
      return { text: "Finish Recording", action: "finish" };
    } else if (recordingCompleted && !isSubmitted) {
      return { text: "Submit", action: "submit" };
    } else if (isSubmitted) {
      return { text: "Submitted ✓", action: "submitted" };
    } else {
      return { text: "Start", action: "start" };
    }
  };

  const buttonState = getButtonState();

  const handleButtonClick = () => {
    switch (buttonState.action) {
      case "start":
        handleStart();
        break;
      case "finish":
        handleFinishRecording();
        break;
      case "submit":
        handleSubmitSegment();
        break;
    }
  };

  const handleStart = () => {
    if (!currentAudioUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No audio available for this segment.",
      });
      return;
    }

    setIsPlaying(true);
    setHasPlayedOnce(true);
    setAudioEnded(false);
    setRecordingCompleted(false);
    setIsSubmitted(false);

    setTimeout(() => {
      if (audioWaveformRef.current?.isReady()) {
        audioWaveformRef.current.play();
      }
    }, 500);
  };

  const handleFinishRecording = () => {
    if (audioWaveformRef.current?.isRecording()) {
      audioWaveformRef.current.stopRecording();
      setIsRecording(false);
      setRecordingCompleted(true);

      toast({
        title: "Recording Finished",
        description:
          "Your recording is ready. Click Submit to get AI evaluation.",
      });
    }
  };

  // STEP 2: Submit segment for scoring
  const handleSubmitSegment = async () => {
    if (!recordedBlob || !user || !currentSegmentData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please record your response before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert blobs to base64
      const [referenceAudioBase64, studentAudioBase64] = await Promise.all([
        fetch(currentAudioUrl)
          .then((r) => r.blob())
          .then(blobToBase64),
        blobToBase64(recordedBlob),
      ]);

      const body = {
        userId: user.id,
        mockTestId: config.dialogueId,
        audioFormat: "audio/wav",
        dialogues: [
          {
            dialogueIndex: 1,
            segmentId: currentSegmentData.id,
            language: config.language || "Punjabi",
            referenceText: currentSegmentData.text_content,
            segments: [
              {
                referenceAudio: referenceAudioBase64,
                studentAudio: studentAudioBase64,
              },
            ],
          },
        ],
      };

      console.log("📤 Submitting segment for scoring...", {
        segmentId: currentSegmentData.id,
        segmentOrder: currentSegmentData.segment_order,
      });

      const { data, error } = await supabase.functions.invoke(
        "score-mock-test",
        {
          body,
        }
      );

      if (error) throw new Error(error.message);

      if (data?.success) {
        // Save the answer ID and score for final results computation
        savedAnswerIds.current.push(currentSegmentData.id);
        if (data.dialogues?.[0]) {
          segmentScores.current.set(currentSegmentData.id, data.dialogues[0]);
        }

        setIsSubmitted(true);
        setAttempts((prev) => prev + 1);

        toast({
          title: "Response Submitted Successfully! ✅",
          description: `Segment ${currentSegment + 1} has been scored.`,
        });

        console.log("📊 Segment scored:", data.dialogues[0]?.scores);

        // Auto-advance to next segment if not last
        if (currentSegment < dialogueSegments.length - 1) {
          setTimeout(() => {
            handleNext();
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Error submitting segment:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit your response. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix if present
        resolve(base64.split(",")[1] || base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleNext = () => {
    if (currentSegment < dialogueSegments.length - 1) {
      const nextSegment = currentSegment + 1;
      setCurrentSegment(nextSegment);
      setCurrentSegmentData(dialogueSegments[nextSegment]);
      loadAudioUrl(dialogueSegments[nextSegment]);

      // Reset states for new segment
      resetSegmentStates();
    } else {
      // Last segment - show get results option
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentSegment > 0) {
      const prevSegment = currentSegment - 1;
      setCurrentSegment(prevSegment);
      setCurrentSegmentData(dialogueSegments[prevSegment]);
      loadAudioUrl(dialogueSegments[prevSegment]);
      resetSegmentStates();
    }
  };

  const resetSegmentStates = () => {
    setHasPlayedOnce(false);
    setIsPlaying(false);
    setIsRecording(false);
    setRecordedBlob(null);
    setRecordedUrl("");
    setAudioEnded(false);
    setRecordingCompleted(false);
    setIsSubmitted(false);
    setCurrentRecordingTime(0);
  };

  // STEP 3: Get final results
  const handleGetResults = async () => {
    if (!user || savedAnswerIds.current.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No submitted answers found.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        userId: user.id,
        answerIds: savedAnswerIds.current,
      };

      console.log(
        "📊 Getting final results for answers:",
        savedAnswerIds.current
      );
      const { data, error } = await supabase.functions.invoke(
        "compute-dialogue-result",
        {
          body,
        }
      );

      if (error) throw new Error(error.message);

      if (data?.success) {
        setExamResults(data);
        setShowResults(false);

        toast({
          title: "Results Generated! 🎉",
          description: "Your practice session has been evaluated.",
        });

        console.log("🎯 Final results:", data);
      }
    } catch (error) {
      console.error("Error getting results:", error);
      toast({
        variant: "destructive",
        title: "Results Failed",
        description: "Failed to generate results. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    onComplete(examResults);
  };

  // Audio event handlers
  const handleAudioEnded = () => {
    setAudioEnded(true);
    setIsPlaying(false);

    // Auto-start recording when audio ends
    setTimeout(() => {
      if (audioWaveformRef.current) {
        audioWaveformRef.current.startRecording();
      }
    }, 500);
  };

  const handleRecordingStart = () => {
    setIsRecording(true);
    setRecordingCompleted(false);
    setIsSubmitted(false);
  };

  const handleRecordingComplete = (
    blob: Blob,
    url: string,
    duration: number
  ) => {
    setIsRecording(false);
    setRecordedBlob(blob);
    setRecordedUrl(url);
    setCurrentRecordingTime(duration);
    setRecordingCompleted(true);
  };

  const progress =
    dialogueSegments.length > 0
      ? ((currentSegment + 1) / dialogueSegments.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dialogue segments...</p>
        </div>
      </div>
    );
  }

  if (dialogueSegments.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-foreground font-medium mb-4">
            No dialogue segments found for this practice.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Results view
  if (examResults) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-primary">
                Practice Results
              </h1>
              {config.domain && (
                <Badge
                  style={{ backgroundColor: config.domain.color }}
                  className="text-white"
                >
                  {config.domain.title}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Score</div>
                <div className="text-2xl font-bold text-foreground">
                  {examResults.combined_score || examResults.total_score}/100
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Segments Completed
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {savedAnswerIds.current.length}/{dialogueSegments.length}
                </div>
              </div>
            </div>

            {examResults.overall_feedback && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Overall Feedback
                </h3>
                <p className="text-blue-700">{examResults.overall_feedback}</p>
              </div>
            )}

            {/* Individual segment scores */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Segment-wise Scores</h3>
              <div className="space-y-3">
                {Array.from(segmentScores.current.entries()).map(
                  ([segmentId, scoreData], index) => (
                    <div key={segmentId} className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Segment {index + 1}</span>
                        <Badge variant="secondary">
                          Score: {scoreData.scores?.final_score || 0}
                        </Badge>
                      </div>
                      {scoreData.one_line_feedback && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {scoreData.one_line_feedback}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dialogues
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Complete Practice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Last segment - Get Results view
  if (showResults) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Practice Complete! 🎉
            </h1>
            <p className="text-muted-foreground mb-6">
              You've completed all {dialogueSegments.length} segments. Ready to
              see your results?
            </p>

            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="text-sm text-muted-foreground mb-2">
                Session Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {dialogueSegments.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Segments
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {savedAnswerIds.current.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGetResults}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Results...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Get Results
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main practice interface
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 py-[50px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              CCL Practice dialogue - {config.language || "Punjabi"}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Dialogue</span>
            {config.difficulty && (
              <Badge variant="outline" className="capitalize">
                {config.difficulty}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              {currentSegment + 1}/{dialogueSegments.length}
            </span>
            <Progress value={progress} className="w-24 h-2" />

            {/* Overall Timer */}
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  Overall Time
                </div>
                <Badge
                  variant={
                    overallTimeLeft <= 120
                      ? "destructive"
                      : overallTimeLeft <= 300
                      ? "secondary"
                      : "default"
                  }
                  className="text-sm font-mono px-2 py-1"
                >
                  {formatTime(overallTimeLeft)}
                </Badge>
              </div>
            </div>

            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Dialogue Info Card */}
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {config.title}
                </h1>
                {config.description && (
                  <p className="text-muted-foreground mb-4">
                    {config.description}
                  </p>
                )}
              </div>
              {config.domain && (
                <Badge
                  style={{ backgroundColor: config.domain.color }}
                  className="text-white px-3 py-1"
                >
                  {config.domain.title}
                </Badge>
              )}
            </div>
          </div>

          {/* Segment Card */}
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Segment {currentSegment + 1}
              </h2>
              {currentSegmentData?.speaker && (
                <Badge variant="secondary" className="ml-2">
                  {currentSegmentData.speaker}
                </Badge>
              )}
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Audio Waveform Section */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-4">
                  {/* Volume Control */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      className="p-1 h-auto"
                    >
                      {isMuted || volume[0] === 0 ? (
                        <VolumeX className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Volume2 className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>

                    {showVolumeSlider && (
                      <div
                        onMouseLeave={() => setShowVolumeSlider(false)}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-2xl z-50"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className="relative h-20 w-6 rounded-lg border border-border/50 bg-muted overflow-hidden">
                            <div
                              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-300 ease-out rounded-lg"
                              style={{ height: `${volume[0]}%` }}
                            />
                            <div className="relative h-full flex items-center justify-center">
                              <Slider
                                value={volume}
                                onValueChange={(newValue) => {
                                  setVolume(newValue);
                                  setIsMuted(newValue[0] === 0);
                                  const volumeValue = newValue[0] / 100;
                                  if (audioWaveformRef.current) {
                                    audioWaveformRef.current.setVolume(
                                      volumeValue
                                    );
                                  }
                                }}
                                max={100}
                                step={1}
                                orientation="vertical"
                                className="h-full w-2 relative z-10"
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {volume[0]}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 relative">
                    <AudioWaveform
                      ref={audioWaveformRef}
                      audioUrl={currentAudioUrl}
                      height={96}
                      className="rounded-lg"
                      autoPlay={false}
                      questionId={`segment-${currentSegmentData?.id}`}
                      initialRecordedBlob={recordedBlob}
                      initialRecordingTime={currentRecordingTime}
                      onRecordingStart={handleRecordingStart}
                      onRecordingComplete={handleRecordingComplete}
                      onEnded={handleAudioEnded}
                      onReady={() => {
                        if (audioWaveformRef.current) {
                          audioWaveformRef.current.setVolume(volume[0] / 100);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Attempts: {attempts}
                  </span>

                  {isSubmitted && recordedBlob && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Submitted ✓</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleButtonClick}
                    disabled={
                      buttonState.action === "playing" ||
                      buttonState.action === "submitted" ||
                      isSubmitting
                    }
                    className={`px-8 py-2 rounded-lg font-medium ${
                      buttonState.action === "start"
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : buttonState.action === "finish"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : buttonState.action === "submit"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting && buttonState.action === "submit" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      buttonState.text
                    )}
                  </Button>

                  {isRecording && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>RECORDING</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Segment Text Content */}
          {currentSegmentData?.text_content && (
            <div className="bg-card p-6 rounded-lg">
              <h3 className="font-medium mb-4">Segment Text</h3>
              <p className="text-foreground leading-relaxed">
                {currentSegmentData.text_content}
              </p>
              {currentSegmentData.translation && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                    Translation
                  </h4>
                  <p className="text-foreground text-sm">
                    {currentSegmentData.translation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-card p-6 rounded-lg">
            <h3 className="font-medium mb-4">Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong>To hear the segment:</strong> Click "Start" and speak
                after the chime.
              </div>
              <div>
                <strong>To finish recording:</strong> Click "Finish Recording"
                when done.
              </div>
              <div>
                <strong>To submit:</strong> Click "Submit" to save and get AI
                evaluation.
              </div>
              <div>
                <strong>Navigation:</strong> Use Previous/Next to move between
                segments.
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSegment === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <Button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 flex items-center space-x-2"
              disabled={recordingCompleted && !isSubmitted}
            >
              <span>
                {currentSegment === dialogueSegments.length - 1
                  ? "Get Results"
                  : "Next"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
