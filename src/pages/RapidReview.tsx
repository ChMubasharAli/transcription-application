import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Bookmark,
  ArrowUpDown,
  RotateCcw,
  Mic,
  MicOff,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  User,
  Target,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Dialogue {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  participants: string;
  language_id?: string;
  domain_id: string;
  domains?: {
    title: string;
    color: string;
  };
}

interface DialogueSegment {
  id: string;
  segment_order: number;
  text_content: string;
  translation?: string;
  audio_url?: string;
  speaker?: string;
  start_time?: number;
  end_time?: number;
}

interface ScoringResult {
  dialogueIndex: number;
  answer_id: string;
  transcript: string;
  reference_transcript: string;
  student_transcript: string;
  repeatCount: number;
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
  overall_feedback: string;
}

// Audio Waves Component
const AudioWaves = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = 12;
  const waveHeights = [6, 10, 14, 18, 22, 18, 14, 10, 6, 10, 14, 18];

  return (
    <div className="flex items-center justify-center space-x-1 h-6">
      {isPlaying ? (
        <img
          src={
            "https://cdn.pixabay.com/animation/2023/10/10/13/26/13-26-45-476_512.gif"
          }
          alt="sound"
          width={120}
          className="object-contain"
        />
      ) : (
        <div className="flex items-end justify-center space-x-1">
          {Array.from({ length: bars }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gray-400 transition-all duration-300"
              style={{
                height: `${waveHeights[i % waveHeights.length]}px`,
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export function RapidReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "difficulty" | "duration">(
    "title"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "pending">(
    "all"
  );
  const [bookmarkedDialogues, setBookmarkedDialogues] = useState<Set<string>>(
    new Set()
  );
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(
    null
  );
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [completedDialogueIds, setCompletedDialogueIds] = useState<Set<string>>(
    new Set()
  );

  // Practice Flow States
  const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>(
    []
  );
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState<Map<number, Blob>>(
    new Map()
  );
  const [scoringResults, setScoringResults] = useState<ScoringResult[]>([]);
  const [userAudioUrls, setUserAudioUrls] = useState<Map<number, string>>(
    new Map()
  );
  const [canStartRecording, setCanStartRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [showPostRecordingOptions, setShowPostRecordingOptions] =
    useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserLanguageAndDialogues();
      fetchCompletedDialogues();
    }
  }, [user]);

  useEffect(() => {
    audioRef.current = new Audio();

    return () => {
      audioRef.current?.pause();
      userAudioUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const fetchCompletedDialogues = async () => {
    try {
      const { data } = await supabase
        .from("user_test_sessions")
        .select("dialogue_id")
        .eq("user_id", user!.id)
        .eq("status", "completed");

      const completedIds = new Set(
        data?.map((session) => session.dialogue_id) || []
      );
      setCompletedDialogueIds(completedIds);
    } catch (error) {
      console.error("Error fetching completed dialogues:", error);
    }
  };

  const fetchUserLanguageAndDialogues = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("language_id, languages(name)")
        .eq("id", user!.id)
        .maybeSingle();

      if (!profile?.language_id) {
        setUserLanguage(null);
        setDialogues([]);
        setLoading(false);
        return;
      }

      setUserLanguage(profile.languages?.name || null);

      const { data: dialogueData, error } = await supabase
        .from("dialogues")
        .select(`*, domains (title, color)`)
        .eq("language_id", profile.language_id)
        .order("title");

      if (error) {
        console.error("Error fetching dialogues:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dialogues",
        });
        setDialogues([]);
      } else {
        setDialogues(dialogueData || []);
        const domains = Array.from(
          new Set(dialogueData?.map((d) => d.domains?.title).filter(Boolean))
        ) as string[];
        setAvailableDomains(domains);
      }
    } catch (error) {
      console.error("Error:", error);
      setDialogues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async (dialogue: Dialogue) => {
    try {
      setSelectedDialogue(dialogue);
      setLoading(true);
      setRepeatCount(0);
      setShowPostRecordingOptions(false);

      const { data, error } = await supabase.functions.invoke(
        "get-dialogue-segments",
        {
          body: { dialogueId: dialogue.id },
        }
      );

      if (error) throw new Error(error.message);

      if (data.success) {
        setDialogueSegments(data.segments);
        setCurrentSegmentIndex(0);
        setRecordedAudios(new Map());
        setScoringResults([]);
        setUserAudioUrls(new Map());
        setCanStartRecording(false);
        setIsPlaying(false);
      } else {
        throw new Error("Failed to fetch dialogue segments");
      }
    } catch (error) {
      console.error("Error starting practice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start practice session",
      });
    } finally {
      setLoading(false);
    }
  };

  const playSegmentAudio = async (segment: DialogueSegment) => {
    if (!segment.audio_url || !audioRef.current) return;

    try {
      setIsPlaying(true);
      setCanStartRecording(false);
      setShowPostRecordingOptions(false);

      const { data } = await supabase.storage
        .from("dialogue-audio")
        .createSignedUrl(segment.audio_url, 60);

      if (!data?.signedUrl) throw new Error("No signed URL received");

      audioRef.current.src = data.signedUrl;
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCanStartRecording(true);
        // Automatically start recording when original audio ends
        startRecording();
      };

      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setCanStartRecording(false);
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };

      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
      setIsPlaying(false);
      setCanStartRecording(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedAudios((prev) =>
          new Map(prev).set(currentSegmentIndex, audioBlob)
        );

        const previousUrl = userAudioUrls.get(currentSegmentIndex);
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        setUserAudioUrls((prev) => new Map(prev).set(currentSegmentIndex, ""));

        stream.getTracks().forEach((track) => track.stop());

        // Show post-recording options after recording stops
        setShowPostRecordingOptions(true);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description:
          "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const recordingDuration = Date.now() - recordingStartTime;

      if (recordingDuration < 1000) {
        toast({
          title: "Recording Too Short",
          description: "Please record for at least 1 second",
          variant: "destructive",
        });
        return;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRepeat = () => {
    setRepeatCount((prev) => prev + 1);
    setShowPostRecordingOptions(false);
    setRecordedAudios((prev) => {
      const newMap = new Map(prev);
      newMap.delete(currentSegmentIndex);
      return newMap;
    });

    const audioUrl = userAudioUrls.get(currentSegmentIndex);
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setUserAudioUrls((prev) => {
      const newUrls = new Map(prev);
      newUrls.delete(currentSegmentIndex);
      return newUrls;
    });

    setScoringResults((prev) =>
      prev.filter((_, index) => index !== currentSegmentIndex)
    );
    setCanStartRecording(false);
    pauseAudio();
  };

  const handleSubmit = async () => {
    await scoreCurrentSegment();
    setShowPostRecordingOptions(false);
  };

  const goToNextSegment = () => {
    if (currentSegmentIndex < dialogueSegments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      setCanStartRecording(false);
      setShowPostRecordingOptions(false);
      setRepeatCount(0);
      pauseAudio();
    }
  };

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
      setCanStartRecording(false);
      setShowPostRecordingOptions(false);
      setRepeatCount(0);
      pauseAudio();
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const getLanguageCode = (language: string | null) => {
    if (!language) return null;
    switch (language.trim().toLowerCase()) {
      case "english":
        return "en";
      case "hindi":
        return "hi";
      case "punjabi":
        return "pa";
      case "spanish":
        return "es";
      case "nepali":
        return "ne";
      default:
        return null;
    }
  };

  const scoreCurrentSegment = async () => {
    if (isProcessing) return;

    const currentSegment = dialogueSegments[currentSegmentIndex];
    const recordedAudio = recordedAudios.get(currentSegmentIndex);

    if (!recordedAudio || !user || !selectedDialogue) {
      toast({
        title: "Error",
        description: "Please record your response first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const studentAudioBase64 = arrayBufferToBase64(
        await recordedAudio.arrayBuffer()
      );

      const { data: signedUrlData } = await supabase.storage
        .from("dialogue-audio")
        .createSignedUrl(currentSegment.audio_url!, 60);

      if (!signedUrlData?.signedUrl)
        throw new Error("Failed to get reference audio");

      const referenceAudioResponse = await fetch(signedUrlData.signedUrl);
      const referenceAudioBlob = await referenceAudioResponse.blob();
      const referenceAudioBase64 = arrayBufferToBase64(
        await referenceAudioBlob.arrayBuffer()
      );

      const requestBody = {
        userId: user.id,
        mockTestId: selectedDialogue.id,
        audioFormat: "webm",
        repeatCount: repeatCount, // Send repeat count to backend
        dialogues: [
          {
            dialogueIndex: currentSegmentIndex + 1,
            segmentId: currentSegment.id,
            language: getLanguageCode(userLanguage),
            referenceText: currentSegment.text_content,
            segments: [
              {
                referenceAudio: referenceAudioBase64,
                studentAudio: studentAudioBase64,
              },
            ],
          },
        ],
      };

      const { data, error } = await supabase.functions.invoke(
        "score-mock-test",
        {
          body: requestBody,
        }
      );

      if (error) throw new Error(error.message);

      if (data.success && data.dialogues && data.dialogues.length > 0) {
        const result = data.dialogues[0];
        // Add overall_feedback from root level to segment result
        const resultWithOverallFeedback = {
          ...result,
          overall_feedback: data.overall_feedback,
        };

        setScoringResults((prev) => {
          const newResults = [...prev];
          newResults[currentSegmentIndex] = resultWithOverallFeedback;
          return newResults;
        });

        toast({
          title: "Segment Scored!",
          description: `Score: ${result.scores.final_score}`,
        });
      } else {
        throw new Error("Scoring failed - no results returned");
      }
    } catch (error) {
      console.error("Error scoring segment:", error);
      toast({
        title: "Scoring Error",
        description:
          error instanceof Error ? error.message : "Failed to score segment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToDialogues = () => {
    setSelectedDialogue(null);
    setDialogueSegments([]);
    setCurrentSegmentIndex(0);
    setScoringResults([]);
    setRecordedAudios(new Map());
    userAudioUrls.forEach((url) => URL.revokeObjectURL(url));
    setUserAudioUrls(new Map());
    setRepeatCount(0);
    setShowPostRecordingOptions(false);
    pauseAudio();
  };

  const getSortedAndFilteredDialogues = () => {
    let filtered = [...dialogues];

    if (activeTab === "completed") {
      filtered = filtered.filter((d) => completedDialogueIds.has(d.id));
    } else if (activeTab === "pending") {
      filtered = filtered.filter((d) => !completedDialogueIds.has(d.id));
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((d) => d.difficulty === difficultyFilter);
    }

    if (domainFilter !== "all") {
      filtered = filtered.filter((d) => d.domains?.title === domainFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "difficulty") {
        const difficultyOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return (
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) -
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        );
      }
      if (sortBy === "duration") {
        const getDurationMinutes = (duration: string) =>
          parseInt(duration.match(/(\d+)/)?.[1] || "0");
        return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
      }
      return 0;
    });

    return filtered;
  };

  const toggleBookmark = (dialogueId: string) => {
    setBookmarkedDialogues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dialogueId)) {
        newSet.delete(dialogueId);
      } else {
        newSet.add(dialogueId);
      }
      return newSet;
    });
  };

  const resetFilters = () => {
    setSortBy("title");
    setDifficultyFilter("all");
    setDomainFilter("all");
    setActiveTab("all");
  };

  // Practice Flow UI
  if (selectedDialogue && dialogueSegments.length > 0) {
    const currentSegment = dialogueSegments[currentSegmentIndex];
    const progress =
      ((currentSegmentIndex + 1) / dialogueSegments.length) * 100;
    const currentScore = scoringResults[currentSegmentIndex];
    const hasRecorded = recordedAudios.has(currentSegmentIndex);
    const isLastSegment = currentSegmentIndex === dialogueSegments.length - 1;
    const allSegmentsScored = scoringResults.length === dialogueSegments.length;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 py-28">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedDialogue.title}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Segment {currentSegmentIndex + 1} of {dialogueSegments.length}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        </Card>

        {/* Current Segment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Listen & Interpret</span>
              {currentSegment.speaker && (
                <Badge variant="secondary">{currentSegment.speaker}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Waves Visualization */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Original Audio</h4>
                <Button
                  onClick={() =>
                    isPlaying ? pauseAudio() : playSegmentAudio(currentSegment)
                  }
                  disabled={
                    !currentSegment.audio_url || isProcessing || isRecording
                  }
                  variant="default"
                  size="sm"
                >
                  {isPlaying ? (
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4" /> <span>Pause</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" /> <span>Play</span>
                    </div>
                  )}
                </Button>
              </div>

              <AudioWaves isPlaying={isPlaying} />
            </div>

            {/* Translation */}
            {currentSegment.translation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                  Translation:
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {currentSegment.translation}
                </p>
              </div>
            )}

            {/* Recording Status */}
            {isRecording && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-red-900 dark:text-red-100">
                      Recording in progress...
                    </span>
                  </div>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              </div>
            )}

            {/* Post-Recording Options */}
            {showPostRecordingOptions && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">
                  Recording Complete
                </h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRepeat}
                    variant="outline"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Repeat ({repeatCount + 1})
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isProcessing ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}

            {/* Retry Button - Show when user has recorded but not submitted yet */}
            {hasRecorded &&
              !currentScore &&
              !showPostRecordingOptions &&
              !isRecording && (
                <Button
                  onClick={handleRepeat}
                  variant="outline"
                  disabled={isProcessing}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Recording
                </Button>
              )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                onClick={goToPreviousSegment}
                disabled={
                  currentSegmentIndex === 0 || isProcessing || isRecording
                }
                variant="outline"
              >
                <SkipBack className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {isLastSegment && allSegmentsScored && (
                <Button
                  onClick={handleBackToDialogues}
                  disabled={isProcessing || isRecording}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Practice Completed
                </Button>
              )}

              <Button
                onClick={goToNextSegment}
                disabled={
                  currentSegmentIndex === dialogueSegments.length - 1 ||
                  !currentScore ||
                  isProcessing ||
                  isRecording
                }
                variant="outline"
              >
                Next
                <SkipForward className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Current Score Display - UPDATED WITH NEW DESIGN */}
            {currentScore && (
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Segment {currentSegmentIndex + 1}
                    </CardTitle>
                    <Badge className="bg-[#2FE7D1]">
                      Repeat Count : {currentScore.repeatCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Question:
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      {currentScore.reference_transcript ||
                        currentSegment.text_content}
                    </p>
                  </div>

                  {/* Your Answer */}
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Answer:
                    </h4>
                    <p className="text-green-700 dark:text-green-300">
                      {currentScore.student_transcript ||
                        "No transcript available"}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Overall Feedback:
                    </h4>
                    <p className="text-purple-700 dark:text-purple-300">
                      {currentScore.overall_feedback || "No feedback available"}
                    </p>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Accuracy & Meaning
                      </div>
                      <div>{currentScore.scores.accuracy_score}/15</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Language Quality
                      </div>
                      <div>
                        {currentScore.scores.fluency_pronunciation_score}/10
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Fluency & Pronunciation
                      </div>
                      <div>{currentScore.scores.language_quality_score}/8</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Delivery & Coherence
                      </div>
                      <div>
                        {currentScore.scores.delivery_coherence_score}/5
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Cultural & Contextual
                      </div>
                      <div>{currentScore.scores.cultural_context_score}/4</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Response Management
                      </div>
                      <div>
                        {currentScore.scores.response_management_score}/3
                      </div>
                    </div>

                    <div className="text-center col-span-2 md:col-span-3 p-2 bg-gray-50 rounded border">
                      <div className="font-bold text-gray-700">
                        Total Final Score{" "}
                      </div>
                      <div>45</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original Dialogues List UI
  const sortedDialogues = getSortedAndFilteredDialogues();
  const completedCount = completedDialogueIds.size;

  return (
    <div className="space-y-6 container mx-auto py-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            Dialogue Practice
          </h3>
          <p className="text-sm text-muted-foreground">
            Practice dialogues in {userLanguage || "your selected language"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortBy(sortBy === "title" ? "difficulty" : "title")}
          className="gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          New
        </Button>

        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {availableDomains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Done {completedCount}, Found {sortedDialogues.length} Dialogues
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-primary hover:text-primary/80"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Dialogues List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-8"></div>
              <div className="h-4 bg-muted rounded flex-1"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
              <div className="h-9 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : sortedDialogues.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium mb-4">
            No dialogues available
          </p>
          <p className="text-muted-foreground">
            Please ensure you have selected a language in your profile and that
            dialogues have been added by your administrator.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedDialogues.map((dialogue, index) => (
            <div
              key={dialogue.id}
              className="flex items-center gap-3 p-4 bg-card hover:bg-accent/50 border border-border rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-semibold text-muted-foreground w-8">
                  #{index + 1}
                </span>
                <span className="text-base font-medium text-foreground truncate">
                  {dialogue.title}
                </span>
              </div>

              <Badge
                variant="secondary"
                className="flex-shrink-0"
                style={{
                  backgroundColor: dialogue.domains?.color
                    ? `${dialogue.domains.color}20`
                    : undefined,
                  borderColor: dialogue.domains?.color || undefined,
                }}
              >
                {dialogue.domains?.title || "General"}
              </Badge>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  {dialogue.duration}
                </Badge>

                <Badge
                  variant="outline"
                  className={`${
                    dialogue.difficulty === "Beginner"
                      ? "border-green-500 text-green-600 bg-green-50"
                      : dialogue.difficulty === "Intermediate"
                      ? "border-yellow-500 text-yellow-600 bg-yellow-50"
                      : "border-red-500 text-red-600 bg-red-50"
                  }`}
                >
                  {dialogue.difficulty}
                </Badge>

                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-600 bg-blue-50"
                >
                  {dialogue.participants}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleStartPractice(dialogue)}
                >
                  Practice
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleBookmark(dialogue.id)}
                  className="h-9 w-9"
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      bookmarkedDialogues.has(dialogue.id)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
