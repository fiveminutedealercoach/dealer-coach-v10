// Cloudflare Pages Function — Dealer data sync via Supabase
// v5 — Operator Console: seat limits, richer payload, per-rooftop notes.
//      • verifyOperator  — lets the console check the admin key WITHOUT the key
//                          ever being written into the console HTML.
//      • updateDealer    — now returns the updated row so the console can patch
//                          its table in place instead of refetching everything.
//      • planned_team / gm_role support on registerDealer + updateDealer.
//      • gm_email/gm_name now fall back to the app's own onboarding fields, so a
//        manager who self-registers in the app no longer shows a blank GM.
//      • seat_limit    - 15 users per rooftop by default, enforced in joinDealer.
//                        The operator can raise it per dealership from the console.
//      • getMasterDashboard now returns seatLimit and the last 10 activities
//                        per rooftop so the console can show an activity feed.
//      • notes         - free-text operator notes per rooftop (who you spoke to,
//                        what they said, when to follow up).
//      Existing app calls are unchanged and still require no admin key.

const SUPABASE_URL = 'https://zthgswndbgekoboknpae.supabase.co'
const SUPABASE_KEY = 'sb_publishable_8siqgy2GXbukkL_F4fUzzg_nX1O0BxX'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const sb = async (path, method='GET', body=null) => {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      // PATCH needs representation too — that is what lets updateDealer hand the
      // refreshed row back to the console for an in-place table update.
      'Prefer': (method === 'POST' || method === 'PATCH') ? 'return=representation' : ''
    }
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(SUPABASE_URL + '/rest/v1' + path, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : []
}

export async function onRequest(context) {
  const { request, env } = context

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...cors }
    })
  }

  const ok = (data) => new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...cors }
  })
  const err = (msg, status=500) => new Response(JSON.stringify({ error: msg }), {
    status, headers: { 'Content-Type': 'application/json', ...cors }
  })

  try {
    const body = await request.json()
    const { action, dealerId, repName, data } = body

    // Shared operator gate. env.ADMIN_KEY is set in Cloudflare → Settings →
    // Environment variables. If it is missing, everything operator-only fails
    // closed rather than silently allowing access.
    const isOperator = () => !!env.ADMIN_KEY && data?.adminKey === env.ADMIN_KEY

    // ── VERIFY OPERATOR ───────────────────────────────────────
    // The console posts the key you typed at the gate. Nothing is stored and
    // nothing is returned except pass/fail, so the console file itself can ship
    // with no secret inside it.
    if (action === 'verifyOperator') {
      if (!env.ADMIN_KEY) return err('ADMIN_KEY is not configured on the server', 500)
      if (!isOperator()) return err('Invalid access key', 401)
      return ok({ success: true })
    }

    // ── REGISTER DEALER ──────────────────────────────────────
    // Intentionally NOT operator-gated: the app's own onboarding screen calls
    // this when a manager creates a rooftop themselves.
    if (action === 'registerDealer') {
      const { dealerName, dept, gmName, gmEmail, email, gmRole, mrr, status, plannedTeam, seatLimit } = data
      const code = dealerId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

      const existing = await sb(`/dealers?code=eq.${code}&select=code`)
      if (existing.length > 0) {
        return ok({ success: true, code, exists: true })
      }

      // Fall back to the app's onboarding fields so self-registered dealers
      // still get a usable GM name/email in the operator console.
      const contactName  = gmName  || repName || ''
      const contactEmail = gmEmail || email   || ''

      await sb('/dealers', 'POST', {
        code,
        name: dealerName,
        dept,
        gm_name: contactName,
        gm_email: contactEmail,
        gm_role: gmRole || 'gm',
        mrr: mrr == null ? 997 : mrr,
        status: status || 'active',
        planned_team: Array.isArray(plannedTeam) ? plannedTeam : [],
        seat_limit: seatLimit == null ? 15 : seatLimit,
        created_at: Date.now(),
        reps: []
      })

      await sb('/dealer_index', 'POST', {
        code,
        name: dealerName,
        dept,
        gm_name: contactName,
        gm_email: contactEmail,
        mrr: mrr == null ? 997 : mrr,
        status: status || 'active',
        created_at: Date.now(),
        last_active: Date.now()
      })

      return ok({ success: true, code })
    }

    // ── JOIN DEALER ───────────────────────────────────────────
    if (action === 'joinDealer') {
      const code = dealerId.toUpperCase()
      const rows = await sb(`/dealers?code=eq.${code}&select=*`)
      if (!rows.length) return err('Dealer code not found', 404)

      const dealer = rows[0]
      // Block suspended dealerships from adding new users
      if (dealer.status === 'suspended') {
        return err('This dealership account is suspended. Please contact your administrator.', 403)
      }
      const reps = dealer.reps || []
      if (!reps.includes(repName)) {
        // Seat cap. Existing users can always get back in; only NEW joins are
        // blocked, so nobody gets locked out of an account they already use.
        const cap = dealer.seat_limit == null ? 15 : dealer.seat_limit
        if (reps.length >= cap) {
          return err('This dealership has reached its user limit of ' + cap + '. Please contact your manager.', 403)
        }
        reps.push(repName)
        await sb(`/dealers?code=eq.${code}`, 'PATCH', { reps })
      }

      return ok({ success: true, dealer })
    }

    // ── LOG ACTIVITY ──────────────────────────────────────────
    if (action === 'logActivity') {
      const code = dealerId.toUpperCase()
      await sb('/activity', 'POST', {
        dealer_code: code,
        rep_name: repName,
        type: data.type || 'drill',
        script: data.script || '',
        result: data.result || '',
        dept: data.dept || 'sales',
        timestamp: Date.now(),
        data: data
      })

      await sb(`/dealer_index?code=eq.${code}`, 'PATCH', {
        last_active: Date.now()
      })

      return ok({ success: true })
    }

    // ── GET DASHBOARD ─────────────────────────────────────────
    if (action === 'getDashboard') {
      const code = dealerId.toUpperCase()
      const dealers = await sb(`/dealers?code=eq.${code}&select=*`)
      if (!dealers.length) return err('Dealer not found', 404)

      const activities = await sb(
        `/activity?dealer_code=eq.${code}&select=*&order=timestamp.desc&limit=100`
      )

      return ok({ dealer: dealers[0], activities })
    }

    // ── UPDATE DEALER (operator only) ─────────────────────────
    if (action === 'updateDealer') {
      if (!isOperator()) return err('Unauthorized', 401)
      const code = dealerId.toUpperCase()
      const patch = data.patch || {}

      // Map friendly names → column names, only allow known fields
      const colMap = {
        name: 'name', gmName: 'gm_name', gmEmail: 'gm_email', gmRole: 'gm_role',
        mrr: 'mrr', status: 'status', dept: 'dept', plannedTeam: 'planned_team',
        seatLimit: 'seat_limit', notes: 'notes'
      }
      const dbPatch = {}
      Object.keys(colMap).forEach(k => {
        if (patch[k] !== undefined) dbPatch[colMap[k]] = patch[k]
      })
      if (Object.keys(dbPatch).length === 0) return err('No valid fields to update', 400)

      const updated = await sb(`/dealers?code=eq.${code}`, 'PATCH', dbPatch)

      // Mirror only the columns the index actually has. planned_team and gm_role
      // live on `dealers` alone, so they are stripped out here.
      const idxPatch = { ...dbPatch }
      delete idxPatch.planned_team
      delete idxPatch.gm_role
      delete idxPatch.seat_limit
      delete idxPatch.notes
      if (Object.keys(idxPatch).length > 0) {
        await sb(`/dealer_index?code=eq.${code}`, 'PATCH', idxPatch)
      }

      // Hand the fresh row back so the console can update one table row in place
      // instead of re-running the whole master dashboard query.
      return ok({ success: true, dealer: updated[0] || null })
    }

    // ── DELETE DEALER (operator only) ─────────────────────────
    if (action === 'deleteDealer') {
      if (!isOperator()) return err('Unauthorized', 401)
      const code = dealerId.toUpperCase()

      // Delete activity, dealer record, and index row
      try { await sb(`/activity?dealer_code=eq.${code}`, 'DELETE') } catch {}
      try { await sb(`/dealers?code=eq.${code}`, 'DELETE') } catch {}
      try { await sb(`/dealer_index?code=eq.${code}`, 'DELETE') } catch {}

      return ok({ success: true })
    }

    // ── GET MASTER DASHBOARD ──────────────────────────────────
    if (action === 'getMasterDashboard') {
      if (!isOperator()) return err('Unauthorized', 401)

      const index = await sb('/dealer_index?select=*&order=last_active.desc')

      const dealerStats = await Promise.all(index.map(async (d) => {
        try {
          const dealerRows = await sb(`/dealers?code=eq.${d.code}&select=*`)
          const dealerData = dealerRows[0] || {}
          const acts = await sb(
            `/activity?dealer_code=eq.${d.code}&select=*&order=timestamp.desc&limit=200`
          )
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
          const weekActs = acts.filter(a => a.timestamp > weekAgo)
          const reps = [...new Set(acts.map(a => a.rep_name))].filter(Boolean)
          const won = acts.filter(a => a.result === 'won' || a.result?.startsWith('A') || a.result?.startsWith('B')).length
          const lastActive = acts[0]?.timestamp || d.created_at
          const daysSinceActive = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24))

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
            gmName: d.gm_name || dealerData.gm_name || '',
            gmEmail: d.gm_email || dealerData.gm_email || '',
            gmRole: dealerData.gm_role || 'gm',
            mrr: d.mrr == null ? (dealerData.mrr == null ? 997 : dealerData.mrr) : d.mrr,
            status: d.status || dealerData.status || 'active',
            created: d.created_at,
            reps: reps.length,
            teamMembers: dealerData.reps || [],
            plannedTeam: dealerData.planned_team || [],
            seatLimit: dealerData.seat_limit == null ? 15 : dealerData.seat_limit,
            notes: dealerData.notes || '',
            totalDrills: acts.length,
            weekDrills: weekActs.length,
            weekHuddles: weekActs.filter(a => a.type === 'huddle').length,
            voiceDrills: acts.filter(a => a.type === 'voice_drill' || a.type === 'voice').length,
            winRate: acts.length > 0 ? Math.round((won / acts.length) * 100) : 0,
            lastActive,
            daysSinceActive,
            health,
            recentActivity: acts.slice(0, 10),
            hasLoggedIn: (dealerData.reps || []).length > 0,
            hasActivity: acts.length > 0,
            hasHuddle: acts.some(a => a.type === 'huddle'),
            hasDrill: acts.some(a => a.type === 'voice_drill' || a.type === 'voice'),
          }
        } catch {
          return { code: d.code, name: d.name || d.code, error: true, health: 0, totalDrills: 0, status: d.status || 'active', plannedTeam: [], teamMembers: [], seatLimit: 15, recentActivity: [], notes: '' }
        }
      }))

      const sorted = dealerStats.sort((a, b) => b.health - a.health)
      return ok({ dealers: sorted, total: sorted.length })
    }

    return err('Unknown action', 400)

  } catch (e) {
    return err(e.message)
  }
}

