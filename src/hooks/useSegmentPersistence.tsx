import { useState, useEffect, useCallback } from 'react';

export interface SegmentData {
  segmentId: number;
  questionUrl: string;
  questionDuration: number;
  questionEnded: boolean;
  recordedBlob: Blob | null;
  recordedUrl: string;
  recordingTime: number;
  attempts: number;
  hasPlayedOnce: boolean;
  createdAt: string;
  saved: boolean;
}

export interface UseSegmentPersistenceReturn {
  getSegmentData: (segmentId: number) => Promise<SegmentData | null>;
  saveSegmentData: (segmentId: number, data: Partial<SegmentData>) => Promise<void>;
  clearSegmentData: (segmentId: number) => void;
  getAllSegmentIds: () => number[];
  isSegmentSaved: (segmentId: number) => boolean;
  clearAllSegmentData: () => void;
}

const STORAGE_KEY_PREFIX = 'dialogue_segment_';
const BLOB_STORAGE_PREFIX = 'dialogue_blob_';

// Helper to convert Blob to base64 for storage
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to convert base64 back to Blob
const base64ToBlob = (base64: string): Blob => {
  const [header, data] = base64.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'audio/webm';
  
  const bytes = atob(data);
  const uint8Array = new Uint8Array(bytes.length);
  
  for (let i = 0; i < bytes.length; i++) {
    uint8Array[i] = bytes.charCodeAt(i);
  }
  
  return new Blob([uint8Array], { type: mime });
};

export const useSegmentPersistence = (sessionId?: string): UseSegmentPersistenceReturn => {
  const [cache, setCache] = useState<Map<number, SegmentData>>(new Map());
  
  const storageKey = (segmentId: number) => 
    `${STORAGE_KEY_PREFIX}${sessionId || 'default'}_${segmentId}`;
  
  const blobStorageKey = (segmentId: number) => 
    `${BLOB_STORAGE_PREFIX}${sessionId || 'default'}_${segmentId}`;

  // Load segment data from localStorage
  const loadSegmentData = useCallback(async (segmentId: number): Promise<SegmentData | null> => {
    try {
      const stored = localStorage.getItem(storageKey(segmentId));
      if (!stored) return null;

      const data = JSON.parse(stored) as Omit<SegmentData, 'recordedBlob'>;
      
      // Load blob separately if it exists
      let recordedBlob: Blob | null = null;
      const blobData = localStorage.getItem(blobStorageKey(segmentId));
      if (blobData) {
        try {
          recordedBlob = base64ToBlob(blobData);
        } catch (error) {
          console.warn('Failed to restore blob for segment', segmentId, error);
        }
      }

      const segmentData: SegmentData = {
        ...data,
        recordedBlob,
        recordedUrl: recordedBlob ? URL.createObjectURL(recordedBlob) : ''
      };

      return segmentData;
    } catch (error) {
      console.error('Failed to load segment data:', error);
      return null;
    }
  }, [sessionId]);

  // Save segment data to localStorage
  const saveSegmentData = useCallback(async (segmentId: number, updates: Partial<SegmentData>) => {
    try {
      console.log('💾 saveSegmentData called:', { 
        segmentId, 
        hasRecordedBlob: !!updates.recordedBlob,
        blobSize: updates.recordedBlob?.size || 0,
        sessionId 
      });
      
      // Get existing data or create new
      const existing = cache.get(segmentId) || await loadSegmentData(segmentId);
      const newData: SegmentData = {
        segmentId,
        questionUrl: '',
        questionDuration: 0,
        questionEnded: false,
        recordedBlob: null,
        recordedUrl: '',
        recordingTime: 0,
        attempts: 0,
        hasPlayedOnce: false,
        createdAt: new Date().toISOString(),
        saved: true,
        ...existing,
        ...updates,
      };

      // Update cache
      setCache(prev => new Map(prev).set(segmentId, newData));

      // Save to localStorage (without blob)
      const { recordedBlob, ...dataToStore } = newData;
      localStorage.setItem(storageKey(segmentId), JSON.stringify(dataToStore));
      console.log('💾 Metadata saved to localStorage:', storageKey(segmentId));

      // Save blob separately if it exists
      if (recordedBlob) {
        try {
          console.log('💾 Saving blob to localStorage...');
          const base64Data = await blobToBase64(recordedBlob);
          localStorage.setItem(blobStorageKey(segmentId), base64Data);
          console.log('✅ Blob saved successfully to:', blobStorageKey(segmentId));
        } catch (error) {
          console.warn('❌ Failed to save blob for segment', segmentId, error);
        }
      } else {
        console.log('⚠️ No blob to save for segment', segmentId);
      }

      console.log('✅ Segment data saved:', { segmentId, saved: true, hasBlobInStorage: !!recordedBlob });
    } catch (error) {
      console.error('Failed to save segment data:', error);
      throw error;
    }
  }, [cache, loadSegmentData, sessionId]);

  // Get segment data (from cache or load from storage)
  const getSegmentData = useCallback(async (segmentId: number): Promise<SegmentData | null> => {
    if (cache.has(segmentId)) {
      return cache.get(segmentId)!;
    }

    const data = await loadSegmentData(segmentId);
    if (data) {
      setCache(prev => new Map(prev).set(segmentId, data));
    }
    return data;
  }, [cache, loadSegmentData]);

  // Clear segment data
  const clearSegmentData = useCallback((segmentId: number) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(segmentId);
      return newCache;
    });
    
    localStorage.removeItem(storageKey(segmentId));
    localStorage.removeItem(blobStorageKey(segmentId));
    
    console.log('🗑️ Segment data cleared:', { segmentId });
  }, [sessionId]);

  // Get all saved segment IDs
  const getAllSegmentIds = useCallback((): number[] => {
    const prefix = `${STORAGE_KEY_PREFIX}${sessionId || 'default'}_`;
    const segmentIds: number[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const segmentId = parseInt(key.replace(prefix, ''), 10);
        if (!isNaN(segmentId)) {
          segmentIds.push(segmentId);
        }
      }
    }
    
    return segmentIds.sort((a, b) => a - b);
  }, [sessionId]);

  // Check if segment is saved with actual recording
  const isSegmentSaved = useCallback((segmentId: number): boolean => {
    const storageKeyForSegment = storageKey(segmentId);
    const blobKey = blobStorageKey(segmentId);
    
    // Check if there's actual recorded content
    const hasActualRecording = localStorage.getItem(blobKey) !== null;
    const hasStorageData = localStorage.getItem(storageKeyForSegment) !== null;
    
    console.log(`🔍 isSegmentSaved(${segmentId}):`, {
      sessionId,
      hasStorageData,
      hasActualRecording,
      result: hasActualRecording // Only true if there's actual recorded audio
    });
    
    // Only consider it saved if there's actual recorded audio
    return hasActualRecording;
  }, [sessionId]);

  // Clear all segment data for the current session
  const clearAllSegmentData = useCallback(() => {
    const allSegmentIds = getAllSegmentIds();
    allSegmentIds.forEach(segmentId => {
      clearSegmentData(segmentId);
    });
    setCache(new Map());
    console.log('🗑️ All segment data cleared for session:', sessionId);
  }, [sessionId, getAllSegmentIds, clearSegmentData]);

  return {
    getSegmentData,
    saveSegmentData,
    clearSegmentData,
    getAllSegmentIds,
    isSegmentSaved,
    clearAllSegmentData
  };
};