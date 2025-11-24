import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringRequest {
  userTranscript: string;
  referenceTranscript: string;
  referenceTranslation: string;
  segmentId: string;
  userId: string;
  audioUrl?: string;
}

interface AIScores {
  accuracy: number;
  register: number;
  contentQuality: number;
  fluency: number;
  pronunciation: number;
  overall: number;
  feedback: string;
  detailedScores: {
    accuracy: { score: number; feedback: string; };
    register: { score: number; feedback: string; };
    contentQuality: { score: number; feedback: string; };
    fluency: { score: number; feedback: string; };
    pronunciation: { score: number; feedback: string; };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Score dialogue function called');
    
    const scoringData: ScoringRequest = await req.json();
    
    const { userTranscript, referenceTranscript, referenceTranslation, segmentId, userId, audioUrl } = scoringData;
    
    if (!userTranscript || !referenceTranscript || !referenceTranslation || !segmentId || !userId) {
      throw new Error('Missing required fields');
    }

    console.log('Scoring data:', { userTranscript, referenceTranscript, referenceTranslation, segmentId, userId });

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Create the scoring prompt
    const scoringPrompt = `
You are an expert language assessment AI for NAATI (National Accreditation Authority for Translators and Interpreters) dialogue interpreting practice. 

Your task is to evaluate a user's interpreting performance based on the following criteria:

**Reference Information:**
- Original text: "${referenceTranscript}"
- Expected translation: "${referenceTranslation}"
- User's interpretation: "${userTranscript}"

**Scoring Criteria (each out of 10):**

1. **ACCURACY (10 points)**: How accurately did the user convey the meaning and content?
   - Completeness of information transfer
   - Factual correctness
   - No omissions or additions

2. **REGISTER (10 points)**: How appropriately did the user match the tone and register?
   - Formal vs informal language use
   - Cultural appropriateness
   - Professional terminology usage

3. **CONTENT QUALITY (10 points)**: Overall quality of interpretation
   - Coherence and clarity
   - Logical flow
   - Message integrity

4. **FLUENCY (10 points)**: How smoothly and naturally did the user speak?
   - Natural speech flow
   - Appropriate pacing
   - Minimal hesitations

5. **PRONUNCIATION (10 points)**: How clear and accurate was the pronunciation?
   - Clarity of speech
   - Correct pronunciation of key terms
   - Intelligibility

**Instructions:**
- Provide a score from 0-10 for each criterion
- Give constructive feedback for each area
- Provide an overall score (average of all criteria)
- Give specific suggestions for improvement
- Be encouraging but honest about areas needing work

Please respond with a JSON object in this exact format:
{
  "accuracy": <score>,
  "register": <score>,
  "contentQuality": <score>,
  "fluency": <score>,
  "pronunciation": <score>,
  "overall": <calculated_average>,
  "feedback": "Overall encouraging feedback with specific suggestions",
  "detailedScores": {
    "accuracy": { "score": <score>, "feedback": "Specific feedback" },
    "register": { "score": <score>, "feedback": "Specific feedback" },
    "contentQuality": { "score": <score>, "feedback": "Specific feedback" },
    "fluency": { "score": <score>, "feedback": "Specific feedback" },
    "pronunciation": { "score": <score>, "feedback": "Specific feedback" }
  }
}
`;

    console.log('Sending request to OpenAI for scoring');

    // Send to OpenAI GPT for scoring
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert NAATI interpreter assessor. Always respond with valid JSON in the exact format requested.' },
          { role: 'user', content: scoringPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('GPT scoring result:', result);

    // Parse the AI response
    let aiScores: AIScores;
    try {
      aiScores = JSON.parse(result.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback scoring if JSON parsing fails
      aiScores = {
        accuracy: 5.0,
        register: 5.0,
        contentQuality: 5.0,
        fluency: 5.0,
        pronunciation: 5.0,
        overall: 5.0,
        feedback: "Unable to process detailed scoring. Please try again.",
        detailedScores: {
          accuracy: { score: 5.0, feedback: "Error in assessment" },
          register: { score: 5.0, feedback: "Error in assessment" },
          contentQuality: { score: 5.0, feedback: "Error in assessment" },
          fluency: { score: 5.0, feedback: "Error in assessment" },
          pronunciation: { score: 5.0, feedback: "Error in assessment" }
        }
      };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the results in the database
    const { error: insertError } = await supabase
      .from('user_audio_responses')
      .insert({
        user_id: userId,
        segment_id: segmentId,
        audio_url: audioUrl,
        user_transcript: userTranscript,
        ai_scores: aiScores,
        accuracy_score: aiScores.accuracy,
        register_score: aiScores.register,
        content_quality_score: aiScores.contentQuality,
        fluency_score: aiScores.fluency,
        pronunciation_score: aiScores.pronunciation,
        overall_score: aiScores.overall,
        feedback: aiScores.feedback
      });

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log('Successfully stored scoring results');

    return new Response(
      JSON.stringify({
        success: true,
        scores: aiScores
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in score-dialogue function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});