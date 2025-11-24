import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { segmentId, transcript, expectedAnswer } = await req.json();

    if (!transcript || !expectedAnswer) {
      throw new Error('Missing required fields');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Scoring rapid review response:', { segmentId, transcript: transcript.substring(0, 50) });

    const prompt = `You are an expert language assessor for NAATI CCL (Credentialed Community Language) exams. 

Evaluate the following student response against the expected answer:

EXPECTED ANSWER:
${expectedAnswer}

STUDENT RESPONSE:
${transcript}

Provide detailed feedback in the following JSON format:
{
  "overall_score": (0-100),
  "accuracy_score": (0-100),
  "fluency_score": (0-100),
  "pronunciation_score": (0-100),
  "feedback": "Detailed feedback explaining strengths and areas for improvement",
  "key_points_covered": ["point1", "point2"],
  "missing_points": ["point1", "point2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Scoring criteria:
- Accuracy: How well did the student capture the meaning and key information?
- Fluency: How smooth and natural was the delivery?
- Pronunciation: How clear and understandable was the speech?

Be constructive and specific in your feedback.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert NAATI CCL language assessor. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const feedback = JSON.parse(result.choices[0].message.content);

    console.log('Scoring completed:', feedback);

    return new Response(
      JSON.stringify(feedback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in score-rapid-review function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        overall_score: 0,
        feedback: 'Failed to generate feedback. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
