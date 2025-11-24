export type LanguageCode = "en-pa" | "en-hi" | "en-ne";

export type Segment = {
  id: string;
  promptAudioUrl: string;
  promptTranscript: string;
};

export type DialogueMeta = {
  id: string;
  title: string;
  segmentCount: number;
};

export type Dialogue = {
  id: string;
  title: string;
  language: LanguageCode;
  segments: Segment[];
};

export type Topic = {
  id: string;
  title: string;
  language: LanguageCode;
  difficulty: "Easy" | "Medium" | "Hard";
  dialogues: Dialogue[];
};

export type PerSegmentResult = {
  segmentId: string;
  studentAudioUrl: string;
  studentTranscript: string;
  deductions: {
    accuracy: number;
    languageQuality: number;
    languageRegister: number;
    delivery: number;
    repeatPenalty: number;
  };
  notes?: string;
};

export type DialogueResult = {
  dialogueId: string;
  perSegment: PerSegmentResult[];
  totals: {
    accuracy: number;
    languageQuality: number;
    languageRegister: number;
    delivery: number;
    repeatPenalty: number;
    scoreOutOf45: number;
  };
  feedback: string[];
};