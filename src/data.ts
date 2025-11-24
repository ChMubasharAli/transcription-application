import { Topic } from './types';

// Simple beep audio data URL (tiny WAV file)
const BEEP_AUDIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=";

export const topics: Topic[] = [
  {
    id: "topic-1",
    title: "VicRoads – License Renewal",
    language: "en-pa",
    difficulty: "Easy",
    dialogues: [
      {
        id: "dialogue-1a",
        title: "License Renewal - Part A",
        language: "en-pa",
        segments: [
          {
            id: "seg-1a-1",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Good morning, I'd like to renew my driver's license today."
          },
          {
            id: "seg-1a-2", 
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Can you please provide your current license and proof of address?"
          },
          {
            id: "seg-1a-3",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Here's my license. For proof of address, will a utility bill work?"
          },
          {
            id: "seg-1a-4",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Yes, that's perfect. The renewal fee is $89. How would you like to pay?"
          },
          {
            id: "seg-1a-5",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I'll pay by card please. Also, I've moved recently - do I need to update my address?"
          },
          {
            id: "seg-1a-6",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Yes, we can update that now. Your new license will arrive in 7-10 business days."
          }
        ]
      },
      {
        id: "dialogue-1b",
        title: "License Renewal - Part B", 
        language: "en-pa",
        segments: [
          {
            id: "seg-1b-1",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I received a letter saying my license expires next month. What do I need to do?"
          },
          {
            id: "seg-1b-2",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "You can renew online, by mail, or visit us in person. Which option suits you best?"
          },
          {
            id: "seg-1b-3",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I prefer to come in person. Do I need to bring anything specific?"
          },
          {
            id: "seg-1b-4",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Bring your current license, proof of identity, and proof of address dated within 6 months."
          },
          {
            id: "seg-1b-5",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "What about an eye test? I wear glasses now."
          },
          {
            id: "seg-1b-6",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "We'll do a basic vision screening. If you have concerns, bring an optometrist's report."
          }
        ]
      }
    ]
  },
  {
    id: "topic-2",
    title: "Immigration – Address Update",
    language: "en-hi", 
    difficulty: "Medium",
    dialogues: [
      {
        id: "dialogue-2a",
        title: "Address Update - Part A",
        language: "en-hi",
        segments: [
          {
            id: "seg-2a-1",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Hello, I need to update my address with the immigration department."
          },
          {
            id: "seg-2a-2",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Certainly. Can you provide your visa grant number and current residential address?"
          },
          {
            id: "seg-2a-3",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "My grant number is 12345678. I've moved from Melbourne to Sydney for work."
          },
          {
            id: "seg-2a-4",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I need to see a lease agreement or utility bill as proof of your new address."
          },
          {
            id: "seg-2a-5",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I have my lease here. How long does it take to process the address change?"
          },
          {
            id: "seg-2a-6",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Usually 2-3 business days. You'll receive confirmation via email and post."
          }
        ]
      },
      {
        id: "dialogue-2b",
        title: "Address Update - Part B",
        language: "en-hi", 
        segments: [
          {
            id: "seg-2b-1",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I submitted an address change form online but haven't received confirmation. Can you help?"
          },
          {
            id: "seg-2b-2",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "Let me check your application status. What's your client ID number?"
          },
          {
            id: "seg-2b-3",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "It's ABC123456. I submitted it two weeks ago but my records still show the old address."
          },
          {
            id: "seg-2b-4",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "I see the issue - your proof of address document wasn't clear enough. Please resubmit."
          },
          {
            id: "seg-2b-5",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "What documents do you accept? I only have a bank statement and mobile phone bill."
          },
          {
            id: "seg-2b-6",
            promptAudioUrl: BEEP_AUDIO,
            promptTranscript: "A bank statement is fine if it's dated within 3 months and shows your full name and new address."
          }
        ]
      }
    ]
  }
];