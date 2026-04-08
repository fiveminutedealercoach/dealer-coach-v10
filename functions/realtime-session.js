// Cloudflare Pages Function — OpenAI Realtime ephemeral token
// Creates a short-lived session token so the browser can connect
// directly to OpenAI Realtime API via WebRTC (no relay needed)

export async function onRequestPost(context) {
  const { request, env } = context
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { personaName, personaDesc, personaTone, personaEscalation, objection, dept, scriptText, voice } = await request.json()

    const apiKey = env.OPENAI_API_KEY
    if (!apiKey) return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
    )

    // Build persona instructions for the AI customer
    const instructions = `You are ${personaName}, a real automotive customer in a dealership conversation. 

WHO YOU ARE: ${personaDesc}
YOUR EMOTIONAL REGISTER: ${personaTone}
WHEN PUSHED: ${personaEscalation}

THE SITUATION: The salesperson or service advisor needs to handle this objection: "${objection}"
DEPARTMENT: ${dept}
MODEL WORD TRACK FOR REFERENCE (what a great response looks like): "${scriptText}"

YOUR RULES:
- Speak naturally in 1-2 sentences at a time — you are a real person, not a character
- Stay completely in character at all times — never break character, never coach
- React specifically to what the salesperson actually says — don't give generic pushback
- Start by stating your objection clearly and naturally
- Exchanges 1-2: Hold your position firmly
- Exchanges 3-4: Show slight cracks only if they addressed your specific concern
- Exchanges 5+: Either soften if they've been strong, or get more frustrated if they've been weak
- If the salesperson gave a strong Acknowledge + specific value + direct close question after exchange 3+, you may indicate you're ready to move forward
- Never say "I understand" — that's what salespeople say
- Sound like a real ${personaTone} person having a real conversation`

    // Create ephemeral session with OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: voice || 'alloy',
        instructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
        },
        max_response_output_tokens: 150, // Keep responses short — 1-2 sentences
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(
        JSON.stringify({ error: err }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...cors } }
      )
    }

    const session = await response.json()
    return new Response(
      JSON.stringify({ 
        clientSecret: session.client_secret,
        sessionId: session.id,
      }),
      { headers: { 'Content-Type': 'application/json', ...cors } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
    )
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
