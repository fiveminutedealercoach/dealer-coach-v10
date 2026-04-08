// Debug endpoint — visit /voice-test in browser to check ElevenLabs config
export async function onRequestGet(context) {
  const { env } = context
  const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  const apiKey = env.ELEVENLABS_API_KEY
  const voiceId = env.ELEVENLABS_VOICE_ID

  // Check what we have
  const config = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
    hasVoiceId: !!voiceId,
    voiceId: voiceId || 'NOT SET',
  }

  // Try a real API call to ElevenLabs
  if (apiKey && voiceId) {
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: 'Test.',
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.8 }
        })
      })

      if (r.ok) {
        config.elevenlabsStatus = 'SUCCESS — voice is working correctly'
        config.contentType = r.headers.get('content-type')
      } else {
        const errText = await r.text()
        config.elevenlabsStatus = `ERROR ${r.status}`
        config.elevenlabsError = errText
      }
    } catch (e) {
      config.elevenlabsStatus = 'FETCH ERROR'
      config.elevenlabsError = e.message
    }
  } else {
    config.elevenlabsStatus = 'SKIPPED — missing API key or voice ID'
  }

  return new Response(JSON.stringify(config, null, 2), { headers: cors })
}
