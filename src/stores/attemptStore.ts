import { create } from 'zustand';
import { AttemptStore, AttemptData, SegmentResult, SegmentSummary } from '@/types/attempt';

const STORAGE_PREFIX = 'naati';

// Generate unique attempt ID
const generateAttemptId = (): string => {
  return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get storage key for an attempt
const getStorageKey = (dialogueId: string, attemptId: string): string => {
  return `${STORAGE_PREFIX}:${dialogueId}:attempt:${attemptId}`;
};

// Get attempt key for internal storage
const getAttemptKey = (dialogueId: string, attemptId: string): string => {
  return `${dialogueId}:${attemptId}`;
};

export const useAttemptStore = create<AttemptStore>((set, get) => ({
  // State
  currentDialogueId: null,
  currentAttemptId: null,
  attempts: {},

  // Start a new attempt
  startAttempt: (dialogueId: string) => {
    const attemptId = generateAttemptId();
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    
    const newAttempt: AttemptData = {
      dialogueId,
      attemptId,
      createdAt: new Date().toISOString(),
      segments: {}
    };

    console.log('🚀 Starting new attempt:', { dialogueId, attemptId });

    set(state => ({
      currentDialogueId: dialogueId,
      currentAttemptId: attemptId,
      attempts: {
        ...state.attempts,
        [attemptKey]: newAttempt
      }
    }));

    // Persist immediately
    get().persist();
    
    return attemptId;
  },

  // Save segment result
  saveSegmentResult: (params) => {
    const { dialogueId, attemptId, segmentId, audioUrl, durationSec } = params;
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    
    console.log('💾 Saving segment result:', params);

    const segmentResult: SegmentResult = {
      segmentId,
      status: "recorded",
      audioUrl,
      durationSec,
      recordedAt: new Date().toISOString()
    };

    set(state => {
      const attempt = state.attempts[attemptKey];
      if (!attempt) {
        console.warn('Attempt not found for saving segment result:', attemptKey);
        return state;
      }

      return {
        ...state,
        attempts: {
          ...state.attempts,
          [attemptKey]: {
            ...attempt,
            segments: {
              ...attempt.segments,
              [segmentId]: segmentResult
            }
          }
        }
      };
    });

    // Persist after save
    get().persist();
    
    console.log('✅ Segment result saved successfully');
  },

  // Get specific segment
  getSegment: (dialogueId: string, attemptId: string, segmentId: string) => {
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    const attempt = get().attempts[attemptKey];
    
    if (!attempt) {
      return null;
    }

    return attempt.segments[segmentId] || null;
  },

  // Get checklist for an attempt
  getChecklist: (dialogueId: string, attemptId: string, totalSegments?: number) => {
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    const attempt = get().attempts[attemptKey];
    
    if (!attempt) {
      console.log('📋 No attempt found for checklist:', attemptKey);
      return [];
    }

    const segments = attempt.segments;
    const checklist: SegmentSummary[] = [];
    
    // Get all segment IDs and sort them
    const segmentIds = Object.keys(segments);
    const allSegmentNumbers = segmentIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    const maxSegment = Math.max(...allSegmentNumbers, 0);
    
    // Use provided totalSegments, or fallback to max recorded segment (minimum 10 for backwards compatibility)
    const maxSegmentToShow = totalSegments || Math.max(maxSegment, 10);
    
    // Create checklist for all segments (including empty ones)
    for (let i = 1; i <= maxSegmentToShow; i++) {
      const segmentId = i.toString();
      const segment = segments[segmentId];
      
      checklist.push({
        segmentId,
        segmentNumber: i,
        status: segment?.status || "empty",
        audioUrl: segment?.audioUrl,
        durationSec: segment?.durationSec
      });
    }

    console.log('📋 Generated checklist:', { attemptKey, totalSegments, maxSegmentToShow, checklist: checklist.map(c => ({ segmentId: c.segmentId, status: c.status })) });
    return checklist;
  },

  // Reset segment (for retake)
  resetSegment: (dialogueId: string, attemptId: string, segmentId: string) => {
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    
    console.log('🔄 Resetting segment:', { dialogueId, attemptId, segmentId });

    set(state => {
      const attempt = state.attempts[attemptKey];
      if (!attempt) {
        return state;
      }

      const newSegments = { ...attempt.segments };
      delete newSegments[segmentId];

      return {
        ...state,
        attempts: {
          ...state.attempts,
          [attemptKey]: {
            ...attempt,
            segments: newSegments
          }
        }
      };
    });

    // Persist after reset
    get().persist();
  },

  // Persist to localStorage
  persist: () => {
    const { currentDialogueId, currentAttemptId, attempts } = get();
    
    if (!currentDialogueId || !currentAttemptId) {
      return;
    }

    const attemptKey = getAttemptKey(currentDialogueId, currentAttemptId);
    const attempt = attempts[attemptKey];
    
    if (attempt) {
      const storageKey = getStorageKey(currentDialogueId, currentAttemptId);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(attempt));
        console.log('💾 Persisted attempt to localStorage:', storageKey);
      } catch (error) {
        console.error('❌ Failed to persist attempt:', error);
      }
    }
  },

  // Hydrate from localStorage
  hydrate: (dialogueId: string, attemptId: string) => {
    const storageKey = getStorageKey(dialogueId, attemptId);
    const attemptKey = getAttemptKey(dialogueId, attemptId);
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const attempt: AttemptData = JSON.parse(stored);
        
        console.log('💧 Hydrating attempt from localStorage:', { dialogueId, attemptId, segmentCount: Object.keys(attempt.segments).length });
        
        set(state => ({
          currentDialogueId: dialogueId,
          currentAttemptId: attemptId,
          attempts: {
            ...state.attempts,
            [attemptKey]: attempt
          }
        }));
        
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to hydrate attempt:', error);
    }
    
    return false;
  },

  // Get current attempt key
  getCurrentAttemptKey: () => {
    const { currentDialogueId, currentAttemptId } = get();
    if (!currentDialogueId || !currentAttemptId) {
      return null;
    }
    return getAttemptKey(currentDialogueId, currentAttemptId);
  }
}));

// Export hook for easier access to current attempt data
export const useCurrentAttempt = () => {
  const store = useAttemptStore();
  const { currentDialogueId, currentAttemptId } = store;
  
  if (!currentDialogueId || !currentAttemptId) {
    return null;
  }
  
  return {
    dialogueId: currentDialogueId,
    attemptId: currentAttemptId,
    getSegment: (segmentId: string) => store.getSegment(currentDialogueId, currentAttemptId, segmentId),
    saveSegment: (segmentId: string, audioUrl: string, durationSec: number) => 
      store.saveSegmentResult({ dialogueId: currentDialogueId, attemptId: currentAttemptId, segmentId, audioUrl, durationSec }),
    resetSegment: (segmentId: string) => store.resetSegment(currentDialogueId, currentAttemptId, segmentId),
    getChecklist: (totalSegments?: number) => store.getChecklist(currentDialogueId, currentAttemptId, totalSegments)
  };
};