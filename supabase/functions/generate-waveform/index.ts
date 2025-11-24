import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
}

async function generateWaveformFromAudio(audioUrl: string): Promise<WaveformData> {
  try {
    console.log('Fetching audio from:', audioUrl)
    
    // Fetch the audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`)
    }
    
    const audioBuffer = await audioResponse.arrayBuffer()
    console.log('Audio buffer size:', audioBuffer.byteLength)
    
    // For now, we'll simulate waveform generation
    // In a real implementation, you'd use Web Audio API or audio processing library
    const duration = Math.random() * 60 + 10 // 10-70 seconds
    const sampleRate = 44100
    const peakCount = 50 // Number of peaks for visualization
    
    // Generate realistic-looking waveform peaks
    const peaks: number[] = []
    for (let i = 0; i < peakCount; i++) {
      // Create more realistic waveform with varying intensities
      const position = i / peakCount
      let intensity = 1.0
      
      // Simulate speech patterns - more intensity in middle, less at edges
      if (position < 0.1 || position > 0.9) {
        intensity *= 0.3 // Quieter at start/end
      } else if (position > 0.2 && position < 0.8) {
        intensity *= 0.8 + Math.random() * 0.4 // Main speech area
      }
      
      // Add some randomness for natural look
      const peak = (Math.random() * 0.7 + 0.3) * intensity
      peaks.push(Math.max(0.1, Math.min(1.0, peak)))
    }
    
    console.log('Generated waveform:', { peakCount: peaks.length, duration })
    
    return {
      peaks,
      duration,
      sampleRate
    }
    
  } catch (error) {
    console.error('Error generating waveform:', error)
    throw error
  }
}

serve(async (req) => {
  console.log('Waveform generation request received')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioUrl } = await req.json()
    
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing audio URL:', audioUrl)
    
    const waveformData = await generateWaveformFromAudio(audioUrl)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: waveformData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Waveform generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate waveform',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})