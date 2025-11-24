export interface SegmentResult {
  segmentId: string;
  status: "empty" | "recorded";
  audioUrl: string;        // blob: or uploaded URL
  durationSec: number;
  recordedAt: string;      // ISO timestamp
}

export interface AttemptData {
  dialogueId: string;
  attemptId: string;
  createdAt: string;
  segments: Record<string, SegmentResult>;
}

export interface SegmentSummary {
  segmentId: string;
  segmentNumber: number;
  status: "empty" | "recorded";
  audioUrl?: string;
  durationSec?: number;
}

export interface AttemptStore {
  // Current attempt state
  currentDialogueId: string | null;
  currentAttemptId: string | null;
  
  // Store data
  attempts: Record<string, AttemptData>; // key: `${dialogueId}:${attemptId}`
  
  // Actions
  startAttempt: (dialogueId: string) => string; // returns attemptId
  saveSegmentResult: (params: {
    dialogueId: string;
    attemptId: string;
    segmentId: string;
    audioUrl: string;
    durationSec: number;
  }) => void;
  getSegment: (dialogueId: string, attemptId: string, segmentId: string) => SegmentResult | null;
  getChecklist: (dialogueId: string, attemptId: string, totalSegments?: number) => SegmentSummary[];
  resetSegment: (dialogueId: string, attemptId: string, segmentId: string) => void;
  
  // Persistence
  persist: () => void;
  hydrate: (dialogueId: string, attemptId: string) => void;
  
  // Utility
  getCurrentAttemptKey: () => string | null;
}