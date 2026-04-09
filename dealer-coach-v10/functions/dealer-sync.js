// Cloudflare Pages Function — Dealer KV sync
// Handles dealer registration, rep activity logging, dashboard reads, and master operator index

export async function onRequestPost(context) {
  const { request, env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const body = await request.json()
    const { action, dealerId, repName, data } = body

    if (!env.DEALER_KV) {
      return new Response(JSON.stringify({ error: 'KV not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // ── REGISTER DEALER ───────────────────────────────────────────
    if (action === 'registerDealer') {
      const { dealerName, dept } = data
      const code = dealerId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
      const existing = await env.DEALER_KV.get(`dealer:${code}`)
      if (existing) {
        return new Response(JSON.stringify({ success: true, code, exists: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      const dealer = { code, name: dealerName, dept, created: Date.now(), reps: [] }
      await env.DEALER_KV.put(`dealer:${code}`, JSON.stringify(dealer))

      // ── Write to master operator index ──────────────────────────
      const masterRaw = await env.DEALER_KV.get('master:dealer_index')
      const masterIndex = masterRaw ? JSON.parse(masterRaw) : []
      if (!masterIndex.find(d => d.code === code)) {
        masterIndex.push({ code, name: dealerName, dept, created: Date.now() })
        await env.DEALER_KV.put('master:dealer_index', JSON.stringify(masterIndex))
      }

      return new Response(JSON.stringify({ success: true, code }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // ── JOIN DEALER ───────────────────────────────────────────────
    if (action === 'joinDealer') {
      const code = dealerId.toUpperCase()
      const raw = await env.DEALER_KV.get(`dealer:${code}`)
      if (!raw) {
        return new Response(JSON.stringify({ error: 'Dealer code not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      const dealer = JSON.parse(raw)
      if (!dealer.reps.includes(repName)) {
        dealer.reps.push(repName)
        await env.DEALER_KV.put(`dealer:${code}`, JSON.stringify(dealer))
      }
      return new Response(JSON.stringify({ success: true, dealer }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // ── LOG ACTIVITY ──────────────────────────────────────────────
    if (action === 'logActivity') {
      const code = dealerId.toUpperCase()
      const key = `activity:${code}:${Date.now()}`
      const entry = { repName, ...data, timestamp: Date.now() }
      await env.DEALER_KV.put(key, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 90 }) // 90 days

      // Update last_active for this dealer in the master index
      try {
        const masterRaw = await env.DEALER_KV.get('master:dealer_index')
        if (masterRaw) {
          const masterIndex = JSON.parse(masterRaw)
          const idx = masterIndex.findIndex(d => d.code === code)
          if (idx !== -1) {
            masterIndex[idx].lastActive = Date.now()
            await env.DEALER_KV.put('master:dealer_index', JSON.stringify(masterIndex))
          }
        }
      } catch {}

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // ── GET DASHBOARD ─────────────────────────────────────────────
    if (action === 'getDashboard') {
      const code = dealerId.toUpperCase()
      const dealerRaw = await env.DEALER_KV.get(`dealer:${code}`)
      if (!dealerRaw) {
        return new Response(JSON.stringify({ error: 'Dealer not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      const dealer = JSON.parse(dealerRaw)
      const list = await env.DEALER_KV.list({ prefix: `activity:${code}:`, limit: 100 })
      const activities = await Promise.all(
        list.keys.map(async k => {
          const v = await env.DEALER_KV.get(k.name)
          return v ? JSON.parse(v) : null
        })
      )
      const sorted = activities.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp)
      return new Response(JSON.stringify({ dealer, activities: sorted }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // ── GET MASTER DASHBOARD (operator view) ──────────────────────
    if (action === 'getMasterDashboard') {
      // Verify operator key
      if (data?.adminKey !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const masterRaw = await env.DEALER_KV.get('master:dealer_index')
      const masterIndex = masterRaw ? JSON.parse(masterRaw) : []

      // For each dealer, get their activity stats
      const dealerStats = await Promise.all(masterIndex.map(async (d) => {
        try {
          const dealerRaw = await env.DEALER_KV.get(`dealer:${d.code}`)
          const dealerData = dealerRaw ? JSON.parse(dealerRaw) : {}
          const list = await env.DEALER_KV.list({ prefix: `activity:${d.code}:`, limit: 200 })
          const activities = await Promise.all(
            list.keys.map(async k => {
              const v = await env.DEALER_KV.get(k.name)
              return v ? JSON.parse(v) : null
            })
          )
          const acts = activities.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp)
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
          const weekActs = acts.filter(a => a.timestamp > weekAgo)
          const reps = [...new Set(acts.map(a => a.repName))].filter(Boolean)
          const won = acts.filter(a => a.result === 'won' || a.result?.startsWith('A') || a.result?.startsWith('B')).length
          const lastActive = acts[0]?.timestamp || d.created
          const daysSinceActive = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24))

          // Engagement health score 0-100
          let health = 0
          if (weekActs.length >= 10) health += 40
          else if (weekActs.length >= 5) health += 25
          else if (weekActs.length >= 1) health += 10
          if (daysSinceActive <= 1) health += 25
          else if (daysSinceActive <= 3) health += 15
          else if (daysSinceActive <= 7) health += 5
          if (weekActs.filter(a => a.type === 'huddle').length >= 3) health += 20
          else if (weekActs.filter(a => a.type === 'huddle').length >= 1) health += 10
          if (acts.length > 0) health += Math.min(15, Math.floor((won / acts.length) * 15))

          return {
            code: d.code,
            name: d.name || dealerData.name || d.code,
            dept: d.dept,
            created: d.created,
            reps: reps.length,
            totalDrills: acts.length,
            weekDrills: weekActs.length,
            weekHuddles: weekActs.filter(a => a.type === 'huddle').length,
            voiceDrills: acts.filter(a => a.type === 'voice_drill' || a.type === 'voice').length,
            winRate: acts.length > 0 ? Math.round((won / acts.length) * 100) : 0,
            lastActive,
            daysSinceActive,
            health,
            recentActivity: acts.slice(0, 3),
          }
        } catch {
          return { code: d.code, name: d.name || d.code, error: true, health: 0, totalDrills: 0 }
        }
      }))

      const sorted = dealerStats.sort((a, b) => b.health - a.health)
      return new Response(JSON.stringify({ dealers: sorted, total: sorted.length }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
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
