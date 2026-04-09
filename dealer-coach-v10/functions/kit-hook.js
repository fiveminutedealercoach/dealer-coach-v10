// Cloudflare Pages Function — Kit email hook
// Sends daily morning coaching email to dealer managers via Kit API
// Also handles streak protection alerts

export async function onRequestPost(context) {
  const { request, env } = context
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { action, email, repName, dealerName, data } = await request.json()
    const kitKey = env.KIT_API_KEY

    if (!kitKey) return new Response(
      JSON.stringify({ error: 'KIT_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
    )

    // ── SUBSCRIBE / TAG on registration ──────────────────────
    if (action === 'subscribe') {
      // Add subscriber to Kit with dealer tags
      const res = await fetch('https://api.kit.com/v4/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kit-Api-Key': kitKey,
        },
        body: JSON.stringify({
          email_address: email,
          first_name: repName,
          fields: {
            dealer_name: dealerName,
            dealer_role: data?.role || 'manager',
          },
        })
      })
      const result = await res.json()
      return new Response(JSON.stringify({ success: true, subscriber: result }),
        { headers: { 'Content-Type': 'application/json', ...cors } })
    }

    // ── SEND DAILY COACHING EMAIL ─────────────────────────────
    if (action === 'dailyEmail') {
      const { scriptName, scriptCategory, scriptDept, teamDrills, winRate, streakCount, dealerId } = data

      const subject = `☀️ Today's 5-Minute Huddle — ${scriptName || 'Daily Coaching'}`
      const dept = scriptDept === 'service' ? 'Service' : 'Sales'

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050d1f; color: #ffffff; padding: 24px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #b8ff3c; margin-bottom: 4px;">5-MINUTE DEALER COACH</div>
            <div style="font-size: 24px; font-weight: 900; text-transform: uppercase; color: #ffffff;">Good Morning, ${repName}</div>
            <div style="font-size: 13px; color: #8a9ab5; margin-top: 4px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>

          ${streakCount > 1 ? `<div style="background: rgba(255,159,67,0.1); border: 1px solid rgba(255,159,67,0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
            <span style="font-size: 20px;">🔥</span> <strong style="color: #ff9f43;">${streakCount}-Day Streak</strong> — Don't break it today
          </div>` : ''}

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b8ff3c; margin-bottom: 8px;">☀️ Today's Focus — ${dept}</div>
            <div style="font-size: 20px; font-weight: 900; text-transform: uppercase; color: #ffffff; margin-bottom: 8px;">${scriptName || 'Morning Drill'}</div>
            <div style="font-size: 13px; color: #c8d4e8; line-height: 1.6;">${scriptCategory || 'Run today\'s drill with your team in your morning huddle.'}</div>
          </div>

          ${teamDrills > 0 ? `<div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <div style="flex: 1; background: rgba(26,107,255,0.1); border: 1px solid rgba(26,107,255,0.2); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #3d8bff;">${teamDrills}</div>
              <div style="font-size: 10px; color: #8a9ab5; text-transform: uppercase; letter-spacing: 1px;">Team Drills</div>
            </div>
            <div style="flex: 1; background: rgba(184,255,60,0.08); border: 1px solid rgba(184,255,60,0.2); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #b8ff3c;">${winRate}%</div>
              <div style="font-size: 10px; color: #8a9ab5; text-transform: uppercase; letter-spacing: 1px;">Win Rate</div>
            </div>
          </div>` : ''}

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://5-minute-dealer-coaching.pages.dev" style="background: #b8ff3c; color: #050d1f; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">
              🎙 Start Today's Huddle →
            </a>
          </div>

          <div style="text-align: center; font-size: 11px; color: #8a9ab5; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
            5-Minute Dealer Coaching System · 5minutedealercoach.com<br>
            <a href="#" style="color: #8a9ab5;">Unsubscribe</a>
          </div>
        </div>
      `

      // Send via Kit broadcast or direct email
      const res = await fetch('https://api.kit.com/v4/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kit-Api-Key': kitKey,
        },
        body: JSON.stringify({
          subject,
          content: htmlBody,
          description: `Daily coaching email — ${new Date().toLocaleDateString()}`,
        })
      })

      const result = await res.json()
      return new Response(JSON.stringify({ success: true, broadcast: result }),
        { headers: { 'Content-Type': 'application/json', ...cors } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors } })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } })
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
