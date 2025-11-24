import { PerSegmentResult, DialogueResult } from './types';

export function scoreDialogue(perSegment: PerSegmentResult[], repeatCount: number): DialogueResult['totals'] {
  const totals = {
    accuracy: 0,
    languageQuality: 0,
    languageRegister: 0,
    delivery: 0,
    repeatPenalty: 0,
    scoreOutOf45: 0
  };

  // Sum all deductions across segments
  perSegment.forEach(segment => {
    totals.accuracy += segment.deductions.accuracy;
    totals.languageQuality += segment.deductions.languageQuality;
    totals.languageRegister += segment.deductions.languageRegister;
    totals.delivery += segment.deductions.delivery;
    totals.repeatPenalty += segment.deductions.repeatPenalty;
  });

  const totalDeductions = totals.accuracy + totals.languageQuality + 
                         totals.languageRegister + totals.delivery + totals.repeatPenalty;

  totals.scoreOutOf45 = Math.max(0, 45 - totalDeductions);
  
  return totals;
}

export function generateFeedback(totals: DialogueResult['totals']): string[] {
  const feedback: string[] = [];

  if (totals.accuracy > 0) {
    feedback.push("Focus on improving accuracy - ensure all key information is conveyed correctly");
  }
  if (totals.languageQuality > 0) {
    feedback.push("Work on language quality - grammar, vocabulary, and expression can be enhanced");
  }
  if (totals.languageRegister > 0) {
    feedback.push("Pay attention to appropriate language register for the context");
  }
  if (totals.delivery > 0) {
    feedback.push("Improve delivery - work on pace, clarity, and fluency");
  }
  if (totals.repeatPenalty > 0) {
    feedback.push("Minimize use of repeats - listen carefully to avoid penalties");
  }

  return feedback;
}

// This function is deprecated - scoring now handled by edge function
export function generateMockDeductions(): PerSegmentResult['deductions'] {
  console.warn('generateMockDeductions is deprecated - use score-dialogue edge function instead');
  return {
    accuracy: 0,
    languageQuality: 0,
    languageRegister: 0,
    delivery: 0,
    repeatPenalty: 0
  };
}