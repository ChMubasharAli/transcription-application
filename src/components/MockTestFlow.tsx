"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------

export type QuestionConfig = {
  id: string; // local ID (for UI)
  segmentId: string; // dialogue_segments.id from DB (uuid)
  audioUrl: string; // reference audio url
  referenceText?: string;
};

type DialogueScore = {
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

type DialogueResult = {
  dialogueIndex: number;
  transcript: string;
  reference_transcript: string;
  student_transcript: string;
  scores: DialogueScore;
  one_line_feedback: string;
};

type ScoreMockTestResponse = {
  success: boolean;
  dialogues: DialogueResult[];
  combined_score: number;
  overall_feedback?: string;
  error?: string;
};

type QuestionResultStatus = "idle" | "processing" | "done" | "error";

type QuestionResult = {
  status: QuestionResultStatus;
  scores?: DialogueScore;
  transcript?: string;
  referenceTranscript?: string;
  studentTranscript?: string;
  oneLineFeedback?: string;
  error?: string;
};

type AnswerState = {
  blob?: Blob;
  url?: string;
};

type NaatiQuestionFlowProps = {
  questions: QuestionConfig[];
  mockTestId?: string;
};

// ---------- Component ----------

export const NaatiQuestionFlow: React.FC<NaatiQuestionFlowProps> = ({
  questions,
  mockTestId = "naati-repetition-mock",
}) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p>No questions configured.</p>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const [language, setLanguage] = useState<"en" | "hi" | "pa" | "es" | "ne">(
    "en"
  );

  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map(() => ({}))
  );

  const [results, setResults] = useState<QuestionResult[]>(() =>
    questions.map(() => ({ status: "idle" }))
  );

  const [combinedScore, setCombinedScore] = useState<number | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const audioFormat: "webm" | "wav" = "webm";

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const safeIndex = Math.min(currentIndex, questions.length - 1);
  const currentQuestion = questions[safeIndex];
  const currentAnswer: AnswerState = answers[safeIndex] ?? {};

  // ---------- Helpers ----------

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function fetchUrlToBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return blobToBase64(blob);
  }

  async function handlePlayReference() {
    const audio = new Audio(currentQuestion.audioUrl);
    await audio.play();
  }

  async function handleStartRecording() {
    try {
      setGlobalError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAnswers((prev) => {
          const copy = [...prev];
          copy[safeIndex] = { blob, url };
          return copy;
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message ?? "Could not start recording");
    }
  }

  function handleStopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }

  // ---------- scoring per question (background) ----------

  async function scoreQuestionInBackground(index: number, studentBlob: Blob) {
    try {
      const q = questions[index];

      setResults((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], status: "processing" };
        return copy;
      });

      // get current user ID from Supabase auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to submit.");
      }

      // base64 audio
      const referenceAudioBase64 = await fetchUrlToBase64(q.audioUrl);
      const studentAudioBase64 = await blobToBase64(studentBlob);

      const body = {
        userId: user.id,
        mockTestId,
        audioFormat,
        dialogues: [
          {
            dialogueIndex: index + 1,
            segmentId: q.segmentId,
            language,
            referenceText: q.referenceText,
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
        { body }
      );

      console.log("score-mock-test question", index + 1, data);

      if (error) {
        throw new Error(error.message ?? "Function call failed");
      }

      const result = data as ScoreMockTestResponse;
      if (!result.success) {
        throw new Error(result.error ?? "AI scoring failed");
      }

      const d = result.dialogues[0];

      setResults((prev) => {
        const copy = [...prev];
        copy[index] = {
          status: "done",
          scores: d.scores,
          transcript: d.transcript,
          referenceTranscript: d.reference_transcript,
          studentTranscript: d.student_transcript,
          oneLineFeedback: d.one_line_feedback,
        };
        return copy;
      });

      // if backend also returns combined_score / overall_feedback with each single-call,
      // we can update them here (last call will contain full numbers if you call with all dialogues).
      setCombinedScore(result.combined_score ?? null);
      if (result.overall_feedback) {
        setOverallFeedback(result.overall_feedback);
      }
    } catch (err: any) {
      console.error(err);
      setResults((prev) => {
        const copy = [...prev];
        copy[index] = {
          status: "error",
          error: err.message ?? "Error scoring this question",
        };
        return copy;
      });
    }
  }

  async function handleSubmitAndNext() {
    if (!currentAnswer.blob) {
      setGlobalError("Please record your repetition before submitting.");
      return;
    }

    setGlobalError(null);
    setIsSubmitting(true);

    const indexToScore = safeIndex;
    const blobToScore = currentAnswer.blob;

    // fire & forget scoring
    scoreQuestionInBackground(indexToScore, blobToScore);

    if (safeIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowSummary(true);
    }

    setIsSubmitting(false);
  }

  function allQuestionsProcessed() {
    return results.every((r) => r.status === "done" || r.status === "error");
  }

  function computeAverages() {
    const completed = results.filter((r) => r.status === "done" && r.scores);
    if (completed.length === 0) return null;

    const sum = {
      accuracy: 0,
      languageQuality: 0,
      fluencyPron: 0,
      delivery: 0,
      cultural: 0,
      response: 0,
      final: 0,
    };

    for (const r of completed) {
      const s = r.scores!;
      sum.accuracy += s.accuracy_score;
      sum.languageQuality += s.language_quality_score;
      sum.fluencyPron += s.fluency_pronunciation_score;
      sum.delivery += s.delivery_coherence_score;
      sum.cultural += s.cultural_context_score;
      sum.response += s.response_management_score;
      sum.final += s.final_score;
    }

    const n = completed.length;
    return {
      accuracy: sum.accuracy / n,
      languageQuality: sum.languageQuality / n,
      fluencyPron: sum.fluencyPron / n,
      delivery: sum.delivery / n,
      cultural: sum.cultural / n,
      response: sum.response / n,
      final: sum.final / n,
    };
  }

  const progress = Math.round(((safeIndex + 1) / questions.length) * 100);
  const averages = computeAverages();

  // ---------- SUMMARY SCREEN ----------

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  NAATI Speaking Practice – Summary
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Per-question repetition scores out of 45 plus overall
                  averages.
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Items: {questions.length}</p>
                <p>Language: {language.toUpperCase()}</p>
                <p>
                  Status:{" "}
                  {allQuestionsProcessed()
                    ? "All questions processed"
                    : "Some still processing..."}
                </p>
              </div>
            </div>

            {/* Overall averages */}
            {averages && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-1">
                <p className="font-semibold text-slate-100">
                  Overall Performance (averages)
                </p>
                <p>
                  <span className="text-slate-400">
                    Accuracy &amp; Meaning:
                  </span>{" "}
                  <span className="font-semibold">
                    {averages.accuracy.toFixed(1)} / 15
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Language Quality:</span>{" "}
                  <span className="font-semibold">
                    {averages.languageQuality.toFixed(1)} / 10
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">
                    Fluency &amp; Pronunciation:
                  </span>{" "}
                  <span className="font-semibold">
                    {averages.fluencyPron.toFixed(1)} / 8
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">
                    Delivery &amp; Coherence:
                  </span>{" "}
                  <span className="font-semibold">
                    {averages.delivery.toFixed(1)} / 5
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">
                    Cultural &amp; Context:
                  </span>{" "}
                  <span className="font-semibold">
                    {averages.cultural.toFixed(1)} / 4
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Response Management:</span>{" "}
                  <span className="font-semibold">
                    {averages.response.toFixed(1)} / 3
                  </span>
                </p>
                <p className="pt-1 border-t border-white/10 mt-1">
                  <span className="text-slate-400">Average Final Score:</span>{" "}
                  <span className="font-semibold">
                    {averages.final.toFixed(1)} / 45
                  </span>
                </p>
                {combinedScore !== null && (
                  <p className="text-xs text-slate-400">
                    Combined score (sum of questions): {combinedScore} /{" "}
                    {questions.length * 45}
                  </p>
                )}
              </div>
            )}

            {/* Overall feedback from backend */}
            {overallFeedback && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-semibold mb-1">Coach Feedback (from AI)</p>
                <p>{overallFeedback}</p>
              </div>
            )}

            {/* Per-question breakdown */}
            <div className="space-y-3 text-sm">
              {questions.map((q, idx) => {
                const r = results[idx];
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-100">
                        Item {idx + 1}
                      </p>
                      <p className="text-xs text-slate-400">
                        Status:{" "}
                        {r.status === "done"
                          ? "Scored"
                          : r.status === "processing"
                          ? "Processing..."
                          : r.status === "error"
                          ? "Error"
                          : "Not processed"}
                      </p>
                    </div>

                    {r.status === "done" && r.scores && (
                      <>
                        {r.oneLineFeedback && (
                          <p className="text-xs text-emerald-300 font-medium">
                            {r.oneLineFeedback}
                          </p>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">
                          {/* Scores */}
                          <div className="space-y-1">
                            <p>
                              <span className="text-slate-400">
                                Accuracy &amp; Meaning:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.accuracy_score} / 15
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">
                                Language Quality:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.language_quality_score} / 10
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">
                                Fluency &amp; Pronunciation:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.fluency_pronunciation_score} / 8
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">
                                Delivery &amp; Coherence:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.delivery_coherence_score} / 5
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">
                                Cultural &amp; Context:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.cultural_context_score} / 4
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">
                                Response Management:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.response_management_score} / 3
                              </span>
                            </p>
                            <p className="pt-1 border-t border-white/10 mt-1">
                              <span className="text-slate-400">
                                Final score:
                              </span>{" "}
                              <span className="font-semibold">
                                {r.scores.final_score} / 45
                              </span>
                            </p>
                          </div>

                          {/* Reference vs Student transcript */}
                          <div className="space-y-2 text-xs text-slate-300">
                            <p className="font-semibold text-slate-100">
                              Transcript (ASR)
                            </p>
                            <div className="rounded-xl border border-white/10 bg-black/60 p-3 max-h-36 overflow-auto whitespace-pre-line">
                              <p className="text-slate-400 mb-1">
                                <span className="font-semibold text-slate-200">
                                  Reference:
                                </span>{" "}
                                {r.referenceTranscript || "Not available."}
                              </p>
                              <p className="text-slate-400">
                                <span className="font-semibold text-slate-200">
                                  Student:
                                </span>{" "}
                                {r.studentTranscript || "Not available."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {r.status === "error" && (
                      <p className="text-xs text-red-300">
                        {r.error ?? "Error scoring this question."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MAIN FLOW SCREEN ----------

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                NAATI Speaking Practice
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Listen to the sentence, repeat it, and submit. AI checks how
                closely you match the reference.
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Language under test
              </p>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value as "en" | "hi" | "pa" | "es" | "ne"
                  )
                }
                className="text-xs bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-400"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="pa">Punjabi</option>
                <option value="es">Spanish</option>
                <option value="ne">Nepali</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Item {safeIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Reference + recording */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Reference side */}
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Reference sentence
              </p>
              <p className="text-sm text-slate-300">
                Click play and listen carefully, then repeat exactly.
              </p>
              <button
                onClick={handlePlayReference}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-slate-100 text-slate-900 hover:bg-white transition-colors"
              >
                ▶ Play Reference
              </button>
              {currentQuestion.referenceText && (
                <p className="mt-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Script:</span>{" "}
                  {currentQuestion.referenceText}
                </p>
              )}
            </div>

            {/* Recording side */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                Your repetition
              </p>
              <p className="text-sm text-slate-300">
                {isRecording
                  ? "Recording... click Stop when you finish repeating."
                  : currentAnswer.blob
                  ? "Recorded. You can listen or re-record if needed."
                  : "Click Record and repeat the sentence as clearly as you can."}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors"
                  >
                    ⏺ Record
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-red-500 text-red-50 hover:bg-red-400 transition-colors"
                  >
                    ⏹ Stop
                  </button>
                )}

                {currentAnswer.url && (
                  <audio
                    controls
                    src={currentAnswer.url}
                    className="w-full md:w-auto"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {globalError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {globalError}
            </div>
          )}

          {/* Bottom controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : i))}
              disabled={safeIndex === 0 || isRecording}
              className="text-xs rounded-full border border-slate-700 px-3 py-1.5 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
            >
              ← Previous
            </button>

            <button
              onClick={handleSubmitAndNext}
              disabled={isSubmitting || isRecording || !currentAnswer.blob}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-indigo-500 text-indigo-50 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {safeIndex === questions.length - 1
                ? "Submit & View Summary"
                : "Submit & Next"}
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            After each submit, AI (Whisper + GPT) checks how closely your
            repetition matches the reference sentence and stores the result in
            your account. At the end you&apos;ll see detailed marks and
            averages.
          </p>
        </div>
      </div>
    </div>
  );
};
