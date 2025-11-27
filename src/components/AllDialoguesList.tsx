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
  CheckCircle,
  Volume2,
  SkipBack,
  SkipForward,
  Calendar,
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
import { json } from "node:stream/consumers";

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

interface ExamResult {
  id: string;
  user_id: string;
  dialogue_id: string;
  segment_count: number;
  average_accuracy_score: number;
  average_language_quality_score: number;
  average_fluency_pronunciation_score: number;
  average_delivery_coherence_score: number;
  average_cultural_context_score: number;
  average_response_management_score: number;
  average_final_score: number;
  total_final_score: number;
  overall_feedback: string;
  answer_ids: string[] | null;
  created_at: string;
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

export function AllDialoguesList() {
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
  const [isPlayingUserRecording, setIsPlayingUserRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState<Map<number, Blob>>(
    new Map()
  );
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [answerIds, setAnswerIds] = useState<string[]>([]);
  const [userAudioUrls, setUserAudioUrls] = useState<Map<number, string>>(
    new Map()
  );

  // NEW STATES for improved UX
  const [repeatCounts, setRepeatCounts] = useState<Map<number, number>>(
    new Map()
  );
  const [showRecordingOptions, setShowRecordingOptions] = useState(false);
  const [autoRecordingStarted, setAutoRecordingStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserLanguageAndDialogues();
      fetchCompletedDialogues();
    }
  }, [user]);

  useEffect(() => {
    audioRef.current = new Audio();
    userAudioRef.current = new Audio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (userAudioRef.current) {
        userAudioRef.current.pause();
        userAudioRef.current = null;
      }
      userAudioUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const fetchUserExamResults = async (): Promise<ExamResult[]> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return [];
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "get-user-exam-results",
        {
          body: { userId: user.id },
        }
      );

      if (error) throw new Error(error.message);

      if (data.success) {
        return data.results || [];
      } else {
        throw new Error("Failed to fetch user exam results");
      }
    } catch (error) {
      console.error("Error fetching user exam results:", error);
      toast({
        title: "Error",
        description: "Failed to load your exam history",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchCompletedDialogues = async () => {
    try {
      const { data, error } = await supabase
        .from("user_test_sessions")
        .select("dialogue_id")
        .eq("user_id", user!.id)
        .eq("status", "completed");

      if (error) {
        console.error("Error fetching completed dialogues:", error);
        return;
      }

      const completedIds = new Set(
        data?.map((session) => session.dialogue_id) || []
      );
      setCompletedDialogueIds(completedIds);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "completed" && user) {
      const loadCompletedResults = async () => {
        try {
          const results = await fetchUserExamResults();
          setExamResults(results);
        } catch (error) {
          console.error("Error loading completed results:", error);
        }
      };
      loadCompletedResults();
    }
  }, [activeTab, user]);

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
      setRepeatCounts(new Map());
      setShowRecordingOptions(false);
      setAutoRecordingStarted(false);

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
        setExamResults([]);
        setAnswerIds([]);
        setUserAudioUrls(new Map());
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

  // MODIFIED: Auto-start recording after original audio ends
  const playSegmentAudio = async (segment: DialogueSegment) => {
    if (!segment.audio_url || !audioRef.current) return;

    try {
      setIsPlaying(true);
      setAutoRecordingStarted(false);

      const { data, error } = await supabase.storage
        .from("dialogue-audio")
        .createSignedUrl(segment.audio_url, 60);

      if (error) throw new Error(error.message);
      if (!data?.signedUrl) throw new Error("No signed URL received");

      audioRef.current.src = data.signedUrl;
      audioRef.current.onended = async () => {
        setIsPlaying(false);
        // Auto-start recording after original audio ends
        await startRecording();
      };

      audioRef.current.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };

      await audioRef.current.play();

      toast({
        title: "Playing Audio",
        description: "Recording will start automatically after audio ends",
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  const playUserRecording = async () => {
    const recordedAudio = recordedAudios.get(currentSegmentIndex);
    if (!recordedAudio || !userAudioRef.current) {
      toast({
        title: "No Recording",
        description: "Please record your response first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPlayingUserRecording(true);

      let audioUrl = userAudioUrls.get(currentSegmentIndex);
      if (!audioUrl) {
        audioUrl = URL.createObjectURL(recordedAudio);
        setUserAudioUrls((prev) =>
          new Map(prev).set(currentSegmentIndex, audioUrl!)
        );
      }

      userAudioRef.current.src = audioUrl;
      userAudioRef.current.onended = () => setIsPlayingUserRecording(false);
      userAudioRef.current.onerror = () => {
        setIsPlayingUserRecording(false);
        toast({
          title: "Playback Error",
          description: "Failed to play your recording",
          variant: "destructive",
        });
      };

      await userAudioRef.current.play();
    } catch (error) {
      console.error("Error playing user recording:", error);
      toast({
        title: "Error",
        description: "Failed to play your recording",
        variant: "destructive",
      });
      setIsPlayingUserRecording(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (userAudioRef.current && isPlayingUserRecording) {
      userAudioRef.current.pause();
      setIsPlayingUserRecording(false);
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

        setShowRecordingOptions(true);

        toast({
          title: "Recording Complete",
          description: "Choose to submit or repeat your recording",
        });
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setAutoRecordingStarted(true);

      toast({
        title: "Recording Started",
        description: "Speak your interpretation now",
      });
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
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // NEW: Function to handle repeat
  const handleRepeat = () => {
    const currentRepeatCount = repeatCounts.get(currentSegmentIndex) || 0;
    setRepeatCounts(
      new Map(repeatCounts).set(currentSegmentIndex, currentRepeatCount + 1)
    );

    setRecordedAudios((prev) => {
      const newMap = new Map(prev);
      newMap.delete(currentSegmentIndex);
      return newMap;
    });

    const audioUrl = userAudioUrls.get(currentSegmentIndex);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setUserAudioUrls((prev) => {
        const newUrls = new Map(prev);
        newUrls.delete(currentSegmentIndex);
        return newUrls;
      });
    }

    setShowRecordingOptions(false);
    pauseAudio();

    toast({
      title: "Recording Reset",
      description: `Repeat #${
        currentRepeatCount + 1
      }. Play original audio to record again.`,
    });
  };

  // MODIFIED: Instant segment movement
  const goToNextSegment = () => {
    if (currentSegmentIndex < dialogueSegments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      setShowRecordingOptions(false);
      setAutoRecordingStarted(false);
      pauseAudio();
    }
  };

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
      setShowRecordingOptions(false);
      setAutoRecordingStarted(false);
      pauseAudio();
    }
  };

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

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

  const loadExamResults = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const results = await fetchUserExamResults();
      setExamResults(results);

      toast({
        title: "Practice Complete!",
        description: "Your results have been loaded successfully",
      });

      fetchCompletedDialogues();
    } catch (error) {
      console.error("Error loading exam results:", error);
      toast({
        title: "Error",
        description: "Failed to load your results",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // MODIFIED: Instant submission with background processing
  const scoreCurrentSegment = async () => {
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

    // Instantly move to next segment
    const isLastSegment = currentSegmentIndex === dialogueSegments.length - 1;

    if (!isLastSegment) {
      goToNextSegment();
    } else {
      // For last segment, show loading state but don't block UI
      setIsProcessing(true);
    }

    // Process submission in background
    try {
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const studentAudioBase64 = arrayBufferToBase64(arrayBuffer);

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("dialogue-audio")
          .createSignedUrl(currentSegment.audio_url!, 60);

      if (signedUrlError) {
        throw new Error(
          `Failed to get reference audio: ${signedUrlError.message}`
        );
      }

      const referenceAudioResponse = await fetch(signedUrlData.signedUrl);
      if (!referenceAudioResponse.ok) {
        throw new Error("Failed to fetch reference audio file");
      }

      const referenceAudioBlob = await referenceAudioResponse.blob();
      const referenceAudioArrayBuffer = await referenceAudioBlob.arrayBuffer();
      const referenceAudioBase64 = arrayBufferToBase64(
        referenceAudioArrayBuffer
      );

      const repeatCount = repeatCounts.get(currentSegmentIndex) || 0;

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

        if (result.answerId) {
          setAnswerIds((prev) => [...prev, result.answerId]);
        }

        if (isLastSegment) {
          await loadExamResults();
        }
      } else {
        console.error("Scoring failed - no results returned");
      }
    } catch (error) {
      console.error("Error scoring segment:", error);
      // Don't show error toast to user to maintain smooth experience
      // Errors can be handled in background
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToDialogues = () => {
    setSelectedDialogue(null);
    setDialogueSegments([]);
    setCurrentSegmentIndex(0);
    setExamResults([]);
    setRecordedAudios(new Map());
    setRepeatCounts(new Map());
    userAudioUrls.forEach((url) => URL.revokeObjectURL(url));
    setUserAudioUrls(new Map());
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
      else if (sortBy === "difficulty") {
        const difficultyOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return (
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) -
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        );
      } else if (sortBy === "duration") {
        const getDurationMinutes = (duration: string) => {
          const match = duration.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
      }
      return 0;
    });

    return filtered;
  };

  const toggleBookmark = (dialogueId: string) => {
    setBookmarkedDialogues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dialogueId)) newSet.delete(dialogueId);
      else newSet.add(dialogueId);
      return newSet;
    });
  };

  const resetFilters = () => {
    setSortBy("title");
    setDifficultyFilter("all");
    setDomainFilter("all");
    setActiveTab("all");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Practice Flow UI
  if (selectedDialogue && dialogueSegments.length > 0) {
    const currentSegment = dialogueSegments[currentSegmentIndex];
    const progress =
      ((currentSegmentIndex + 1) / dialogueSegments.length) * 100;
    const hasRecorded = recordedAudios.has(currentSegmentIndex);
    const isLastSegment = currentSegmentIndex === dialogueSegments.length - 1;
    const repeatCount = repeatCounts.get(currentSegmentIndex) || 0;

    if (examResults.length > 0 && isLastSegment) {
      return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold">Practice Results</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Showing {examResults.length} practice session
                {examResults.length > 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sort results by date (newest first) */}
              {examResults
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((result, index) => (
                  <div
                    key={result.id}
                    className="space-y-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        Practice Session {examResults.length - index}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(result.created_at)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500 mb-2">
                        {result.total_final_score}
                      </div>
                      <p className="text-md text-muted-foreground">
                        Final Score
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Overall Feedback:</h3>
                      <p>{result.overall_feedback}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="font-bold text-blue-600">
                          {result.average_accuracy_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-bold text-green-600">
                          {result.average_language_quality_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Language</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="font-bold text-purple-600">
                          {result.average_fluency_pronunciation_score.toFixed(
                            1
                          )}
                        </div>
                        <div className="text-muted-foreground">Fluency</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="font-bold text-orange-600">
                          {result.average_delivery_coherence_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Delivery</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="font-bold text-indigo-600">
                          {result.average_cultural_context_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Cultural</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <div className="font-bold text-pink-600">
                          {result.average_response_management_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Response</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-700">
                          {result.average_final_score.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">
                          Average Score
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-700">
                          {result.segment_count}
                        </div>
                        <div className="text-muted-foreground">Segments</div>
                      </div>
                    </div>
                  </div>
                ))}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleBackToDialogues}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Dialogues
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedDialogue.title}</h2>
              <Badge variant="outline">
                Segment {currentSegmentIndex + 1} of {dialogueSegments.length}
              </Badge>
            </div>
            <Progress value={progress} className="mt-2" />
            {/* Show repeat count */}
            {repeatCount > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Repeats used: {repeatCount}
              </div>
            )}
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
            {/* Audio Visualization */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Original Audio:</h4>
                <Button
                  onClick={() =>
                    isPlaying ? pauseAudio() : playSegmentAudio(currentSegment)
                  }
                  disabled={!currentSegment.audio_url || isProcessing}
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

              <div className="flex justify-center py-2">
                <AudioWaves isPlaying={isPlaying} />
              </div>

              <p className="text-xs text-muted-foreground text-center mt-2">
                {autoRecordingStarted
                  ? "Recording in progress..."
                  : "Listen to the original audio and recording will start automatically"}
              </p>
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium">Recording...</span>
                </div>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}

            {/* Recording Options (Submit/Repeat) */}
            {showRecordingOptions && hasRecorded && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3 text-center">
                  Recording Complete! Choose an option:
                </h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRepeat}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Repeat ({repeatCount + 1})
                  </Button>
                  <Button
                    onClick={scoreCurrentSegment}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}

            {/* Audio Playback Controls */}
            {hasRecorded && !showRecordingOptions && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() =>
                    isPlayingUserRecording ? pauseAudio() : playUserRecording()
                  }
                  disabled={isProcessing}
                  variant="outline"
                >
                  {isPlayingUserRecording ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlayingUserRecording
                    ? "Pause Recording"
                    : "Play Your Recording"}
                </Button>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                onClick={goToPreviousSegment}
                disabled={currentSegmentIndex === 0 || isProcessing}
                variant="outline"
              >
                <SkipBack className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={goToNextSegment}
                disabled={
                  currentSegmentIndex === dialogueSegments.length - 1 ||
                  isProcessing
                }
                variant="outline"
              >
                Next
                <SkipForward className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleBackToDialogues}
          variant="outline"
          disabled={isProcessing}
        >
          Back to Dialogues
        </Button>
      </div>
    );
  }

  // Original Dialogues List UI
  const sortedDialogues = getSortedAndFilteredDialogues();
  const completedCount = completedDialogueIds.size;

  const showExamResultsInCompleteTab =
    activeTab === "completed" && examResults.length > 0;

  return (
    <div className="space-y-6">
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

      {/* Filters and Dialogues List */}
      <div className="flex flex-wrap items-center gap-3">
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
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-8"></div>
              <div className="h-4 bg-muted rounded flex-1"></div>
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
