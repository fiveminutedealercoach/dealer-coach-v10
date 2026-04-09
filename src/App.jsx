import { useState, useEffect, useRef } from 'react'
import { SCRIPTS } from './data/scripts'

const C = { navy:'#050d1f',navyMid:'#0a1930',navyLight:'#0f2448',blue:'#1a6bff',blueBright:'#3d8bff',green:'#b8ff3c',white:'#ffffff',gray:'#8a9ab5',lightText:'#c8d4e8',card:'rgba(255,255,255,0.05)',border:'rgba(255,255,255,0.08)',red:'#ff6b6b',yellow:'#ffc947',orange:'#ff9f43' }
const fH = "'Barlow Condensed', sans-serif"
const fB = "'Barlow', sans-serif"
const inp = { background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,color:C.white,fontFamily:fB,fontSize:14,padding:'8px 12px',outline:'none',width:'100%',boxSizing:'border-box' }

const ROLES = {
  gm:       { label:'General Manager',    icon:'⭐', dept:'both',    isManager:true  },
  sales_mgr:{ label:'Sales Manager',      icon:'🏆', dept:'sales',   isManager:true  },
  svc_mgr:  { label:'Service Manager',    icon:'🔧', dept:'service', isManager:true  },
  sales_rep:{ label:'Sales Consultant',   icon:'🚗', dept:'sales',   isManager:false },
  svc_rep:  { label:'Service Consultant', icon:'🔩', dept:'service', isManager:false },
  bdc:      { label:'BDC',                icon:'📞', dept:'both',    isManager:false },
}
const isManager = role => ROLES[role]?.isManager || false
const roleDept  = role => ROLES[role]?.dept || 'both'

const SCORES = [
  {val:'won',     label:'✓ Won',       color:C.green},
  {val:'progress',label:'◑ Progress',  color:C.yellow},
  {val:'practice',label:'↺ Practice',  color:C.orange},
]
const scoreColor = r => r==='won'?C.green:r==='progress'?C.yellow:C.orange
const scoreLabel = r => r==='won'?'✓ Won':r==='progress'?'◑ Progress':'↺ Practice'

const SCOLS = [C.green,C.blue,C.yellow,'#ff6bbb',C.blueBright]
const STEPS = [
  {icon:'🏆',label:'Win From Yesterday',desc:'Open with one specific win from yesterday. Name the rep, the script, the result.',time:30},
  {icon:'📋',label:'Script of the Day',desc:"Read today's script aloud  -  fully, with energy. Every rep follows along.",time:60},
  {icon:'🎭',label:'Live Drill',desc:'Manager plays the customer. One rep handles it live. No notes. Real pressure.',time:90},
  {icon:'🎯',label:'One Coaching Note',desc:'One specific thing to improve. Not a lecture. One clear, actionable note.',time:60},
  {icon:'🔒',label:'Commit & Close',desc:'Each rep commits out loud to using this script today.',time:60},
]
const TOTAL_H = 300
const STEP_STARTS = [0,30,90,180,240]

const SALES_SCHED=[{day:'MON',label:'Sales  -  Price / Discount Objection',id:6},{day:'TUE',label:'Sales  -  Payment or Commitment Objection',id:9},{day:'WED',label:'Sales  -  Trade-In & Used Car Objections',id:19},{day:'THU',label:'Sales  -  Finance & Add-On Objections',id:14},{day:'FRI',label:'Weekly Review  -  What Worked?',id:null}]
const SVC_SCHED=[{day:'MON',label:'Service  -  Deferred Maintenance Objections',id:42},{day:'TUE',label:'Service  -  Price & Estimate Pushback',id:44},{day:'WED',label:'Service  -  MPI Conversion',id:52},{day:'THU',label:'Service  -  Competitive / Outside Shop',id:43},{day:'FRI',label:'Weekly Review  -  What Worked?',id:null}]
const BOTH_SCHED=[{day:'MON',label:'Sales  -  Price / Discount Objection',id:6},{day:'TUE',label:'Service  -  Deferred Maintenance',id:42},{day:'WED',label:'Sales  -  Payment Objection',id:9},{day:'THU',label:'Service  -  Price Pushback',id:44},{day:'FRI',label:'Weekly Review  -  What Worked?',id:null}]
const getSched = dept => dept==='sales'?SALES_SCHED:dept==='service'?SVC_SCHED:BOTH_SCHED

// ── Hip welcome messages ──────────────────────────────────────
const WELCOME_NEW = [
  "Welcome to the system, [N]. Your competition just fell further behind. 🎯",
  "You're in, [N]. Let's build something they can't touch. 🔥",
  "[N] is in the building. Time to get to work. ⚡",
  "Welcome aboard, [N]. The team just got stronger. 💪",
]
const WELCOME_BACK = [
  "Back at it, [N]. Let's get some reps in. 🔥",
  "Good to see you, [N]. Time to sharpen the edge. 🎯",
  "You're back, [N]. Let's make today count. 💪",
  "[N] is in the building. Ready to work? 🚀",
  "Welcome back, [N]. The grind doesn't stop. ⚡",
]
const pickWelcome = (name, isNew) => {
  const pool = isNew ? WELCOME_NEW : WELCOME_BACK
  return pool[Math.floor(Math.random()*pool.length)].replace('[N]', name)
}

const AI_OPENERS = {
  1:"My team keeps saying we have to discount to close. What's your response to that?",2:"I've already decided this customer won't pay sticker. There's no point trying.",3:"We never set gross goals in morning meetings. Is that really necessary?",4:"I don't see why we need to celebrate gross wins publicly. It creates competition.",5:"We use a one-price model so I just tell customers the price is the price.",6:"I just checked online and found this exact car for two thousand dollars less. Match that price.",7:"Look, I don't have time for a presentation. Just give me your absolute best price right now.",8:"I really like the car but I need to run it by my wife before I make any decisions.",9:"That monthly payment is way too high. There is absolutely no way I can do that number.",10:"I'm not ready to buy today. I'm just here to gather some information.",11:"I want to think about it and come back sometime next week when I've decided.",12:"I found this exact same car at another dealership and they're five hundred dollars cheaper.",13:"I'm honestly just browsing today and not looking to purchase anything.",14:"I don't need the extended warranty. I'll just take my chances if something breaks.",15:"GAP insurance sounds like a total ripoff to me. Why would I need that?",16:"I never buy warranties on anything. I'll deal with it if something goes wrong.",17:"I just want to know the payment with nothing added. Skip all the extras.",18:"Can you just show me the base payment without any of those add-ons?",19:"My trade-in is worth way more than what you're offering me for it.",20:"Why does reconditioning cost so much? That seems really inflated to me.",21:"I found the exact same used car at another lot for less money.",22:"The CarFax shows this car had an accident. I don't want to buy it.",23:"I can get a newer model for basically the same price somewhere else.",24:"I don't need the paint protection package. I'll take my chances with the finish.",25:"Those accessories seem really overpriced. I can get them cheaper online.",26:"Do I really need all of this? It feels like you're just adding stuff I don't want.",27:"I'll add the accessories later after I've had the car for a little while.",28:"I'm paying cash so I should be getting a much better deal than this.",29:"I need to see all my options laid out before I can decide on anything.",30:"Let me talk to your manager. I want to see what else you can do on this deal.",31:"Your prices are way too high compared to other shops I've called around.",32:"My advisors just write orders. They don't try to sell anything extra at all.",33:"I already know what I need done so just write up the order for that.",34:"Nobody told me what my target for customer-pay is today. I have no idea.",35:"I didn't present that recommendation because I knew they wouldn't buy it.",36:"I'll just skip the maintenance package presentation for this customer today.",37:"We don't have time to do a full inspection for every quick-lube customer.",38:"Just do whatever the car needs. I trust you guys to figure it out.",39:"How do I know this inspection is even real? Did you actually check everything?",40:"I'll approve just the oil change but skip everything else on that list.",41:"Can you just email me the inspection results? I don't really want to go over it.",42:"The car has been running fine for two years. I'll wait until it actually breaks to fix it.",43:"My brother-in-law is a mechanic and he can do it for half the price you're quoting.",44:"Seven hundred and eighty dollars? I thought this was only going to be around two hundred.",45:"I just had that exact service done somewhere else just three months ago.",46:"My other dealership charges significantly less than you for the same labor.",47:"If that's really the price you're quoting me, I'll just take it somewhere else.",48:"How much does a basic oil change cost? Just give me a number right now.",49:"I'm calling around to compare prices. What's your cheapest oil change option?",50:"I need to bring my car in urgently today. Can you fit me in without an appointment?",51:"Can I just drop it off without scheduling? I'm pretty flexible on timing.",52:"Just do the oil change please. Skip everything else on that list today.",53:"I need to call my husband first before I approve any of these repairs.",54:"I'll take care of that recommendation next time I come in for service.",55:"Which of these items is actually urgent versus which ones can wait a while?",56:"The car is twelve years old. I really don't want to put any more money into it.",57:"My tires look perfectly fine to me. I don't think I need new ones right now.",58:"The brakes seem completely fine to me. I don't understand why you're recommending this.",59:"I don't think I need a coolant flush. The car runs perfectly fine without it.",60:"I've never done a transmission service in ten years and the car has been totally fine.",
}
const getOpener = id => AI_OPENERS[id] || "Tell me why I should trust your recommendation here."

const loadJSON = (k,d) => { try { return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)) } catch { return d } }
const saveJSON = (k,v) => localStorage.setItem(k,JSON.stringify(v))

// ── ElevenLabs TTS with browser fallback ─────────────────────
let elAudio = null
const speakEL = async (text, onDone, voiceOpts={}) => {
  try {
    if (elAudio) { elAudio.pause(); elAudio = null }
    const res = await fetch('/elevenlabs-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,...voiceOpts})})
    if (!res.ok) throw new Error('EL failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    elAudio = new Audio(url)
    elAudio.onended = () => { URL.revokeObjectURL(url); onDone && onDone() }
    elAudio.onerror  = () => { speakBrowser(text, onDone) }
    await elAudio.play()
  } catch { speakBrowser(text, onDone) }
}
const speakBrowser = (text, onDone) => {
  if (!window.speechSynthesis) { onDone && onDone(); return }
  window.speechSynthesis.cancel()
  setTimeout(()=>{
    const u = new SpeechSynthesisUtterance(text)
    u.rate=0.88; u.pitch=0.82; u.volume=1
    const v = window.speechSynthesis.getVoices()
    const pref = v.find(v=>/samantha|karen|victoria|google us english/i.test(v.name))
    if (pref) u.voice=pref
    u.onend = () => onDone && onDone()
    window.speechSynthesis.speak(u)
  },150)
}
const stopSpeaking = () => {
  if (elAudio) { try { elAudio.pause() } catch {} elAudio = null }
  try { window.speechSynthesis?.cancel() } catch {}
}
// speak with optional persona voice options
const speak = (text, onDone, voiceOpts={}) => speakEL(text, onDone, voiceOpts)

// Get voice options for a persona  -  adjusts stability/style to vary personality
const getPersonaVoiceOpts = (persona) => {
  // Each persona has a unique ElevenLabs voice ID + tuned voice settings
  const profiles = {
    dave:    {voiceId:'vSjOBQp24DUB2COr2xI9', stability:0.25, similarity_boost:0.90, style:0.65},  // aggressive, confident male
    mike:    {voiceId:'Lt5FXOzLdO40mAK9bVsS', stability:0.20, similarity_boost:0.85, style:0.70},  // impatient, clipped male
    gary:    {voiceId:'7WggD3IoWTIPT19PNyrW', stability:0.55, similarity_boost:0.80, style:0.45},  // stubborn, deliberate male
    frank:   {voiceId:'Myb1gsDenT3mlMlj7vib', stability:0.60, similarity_boost:0.80, style:0.30},  // skeptical, flat male
    ray:     {voiceId:'lAqElvydqyTzitpwAdj6', stability:0.65, similarity_boost:0.75, style:0.35},  // loyal, matter-of-fact male
    tom:     {voiceId:'8IbUB2LiiCZ85IJAHNnZ', stability:0.50, similarity_boost:0.75, style:0.25},  // casual, dismissive male
    linda:   {voiceId:'mxRkC2FpSMZCYPLKtwQF', stability:0.70, similarity_boost:0.75, style:0.20},  // guarded, measured female
    carol:   {voiceId:'l4Coq6695JDX9xtLqXDE', stability:0.75, similarity_boost:0.70, style:0.25},  // warm but firm female
    barbara: {voiceId:'QI7MqdLSOT7Xq48Th0oc', stability:0.30, similarity_boost:0.85, style:0.60},  // shocked, reactive female
    susan:   {voiceId:'wewocdDkjSLm9ZwjO7TD', stability:0.80, similarity_boost:0.70, style:0.15},  // polite, hesitant female
  }
  const p = profiles[persona?.id]
  if (!p) return { voiceId: null, voiceSettings: {stability:0.45, similarity_boost:0.82, style:0.35, use_speaker_boost:true} }
  const { voiceId, ...settings } = p
  return { voiceId, voiceSettings: {...settings, use_speaker_boost:true} }
}

// ── Dealer KV sync ───────────────────────────────────────────
const dealerSync = async (action, dealerId, repName, data={}) => {
  try {
    const res = await fetch('/dealer-sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,dealerId,repName,data})})
    return await res.json()
  } catch { return {error:'Network error'} }
}

const getTodayKey  = () => new Date().toISOString().split('T')[0]
const updateStreak = sd => {
  const today = getTodayKey()
  const yest  = new Date(Date.now()-86400000).toISOString().split('T')[0]
  if (sd.lastDay===today) return sd
  if (sd.lastDay===yest)  return {...sd,count:sd.count+1,lastDay:today}
  return {count:1,lastDay:today}
}

const MILESTONES = [
  {count:1,   icon:'🎯',label:'First Drill',    msg:"You ran your first drill. The journey starts here."},
  {count:5,   icon:'🔥',label:'On Fire',         msg:"5 drills in. You're building real habits."},
  {count:10,  icon:'⚡',label:'Getting Sharp',   msg:"10 drills. Your responses are getting sharper."},
  {count:25,  icon:'🏆',label:'Top Performer',   msg:"25 drills. You're in the top tier of your team."},
  {count:50,  icon:'💎',label:'Elite Closer',    msg:"50 drills. You've put in the work. It shows."},
  {count:100, icon:'👑',label:'Coaching Legend', msg:"100 drills. You ARE the standard on your team."},
]
const getNewMilestone = (prev, next) => MILESTONES.find(m=>m.count>prev&&m.count<=next)||null

// ── PDF ──────────────────────────────────────────────────────
const printPDF = (title, body) => {
  const w = window.open('','_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;color:#1a1a1a;background:#fff;padding:40px;max-width:760px;margin:0 auto;}
h1{font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;color:#050d1f;}
h2{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:24px 0 10px;color:#1a6bff;border-bottom:2px solid #1a6bff;padding-bottom:4px;}
h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;color:#333;}
.sub{font-size:13px;color:#666;margin-bottom:6px;}.date{font-size:11px;color:#999;margin-bottom:20px;}.divider{height:1px;background:#e0e0e0;margin:16px 0;}
.card{border:1px solid #e0e0e0;border-radius:6px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid;}
.card.blue{border-left:4px solid #1a6bff;}.card.green{border-left:4px solid #5ca800;}.card.red{border-left:4px solid #e85d4a;}.card.yellow{border-left:4px solid #f0a500;}
.label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:5px;}
.val{font-size:13px;color:#1a1a1a;line-height:1.6;}
.score-badge{display:inline-block;font-size:28px;font-weight:900;padding:8px 16px;border-radius:8px;margin-bottom:8px;}
.word-track{background:#f0f8e8;border:1px solid #b8e088;border-left:4px solid #5ca800;padding:14px 16px;font-style:italic;font-size:14px;color:#1a1a1a;margin:10px 0;line-height:1.8;border-radius:0 6px 6px 0;}
.action-item{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;padding:8px 10px;background:#f8f8f8;border-radius:4px;}
.action-num{background:#1a6bff;color:#fff;font-weight:700;font-size:12px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.no-print{background:#f0f4ff;border:1px solid #c0d0ff;border-radius:6px;padding:10px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;}
.grade-a{background:#e8ffe8;color:#2d8a2d;}.grade-b{background:#e8f0ff;color:#1a6bff;}.grade-c{background:#fff8e8;color:#a07000;}.grade-d{background:#ffe8e8;color:#c03030;}
.cb-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:7px;}.cb{width:14px;height:14px;border:2px solid #ccc;border-radius:3px;flex-shrink:0;margin-top:2px;}
@media print{.no-print{display:none!important;}}
</style></head><body>
<div class="no-print"><span>Ready to print or save as PDF</span><button onclick="window.print()" style="background:#1a6bff;color:#fff;border:none;padding:8px 18px;border-radius:4px;font-weight:700;cursor:pointer;font-size:13px;">Print / Save PDF</button></div>
${body}
<div class="divider"></div><div style="font-size:11px;color:#999;text-align:center;margin-top:12px;">5-Minute Dealer Coaching System · 5minutedealercoach.com · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
</body></html>`)
  w.document.close()
}

// ── Shared UI components ─────────────────────────────────────
const Tag = ({children,color=C.blue}) => (
  <span style={{background:`${color}20`,border:`1px solid ${color}44`,color,fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'3px 10px',borderRadius:100}}>{children}</span>
)
const PDFBtn = ({onClick,label='📄 Download PDF'}) => (
  <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.06)',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:'uppercase',padding:'8px 14px',borderRadius:6,cursor:'pointer',marginBottom:16}}>{label}</button>
)

function ScriptFilterBar({dept,setDept,cat,setCat,search,setSearch,lockDept=null}) {
  const cats = [...new Set(SCRIPTS.map(s=>s.category))]
  const ed = lockDept||dept
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:14}}>
      {!lockDept&&(
        <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
          {[['all','All'],['sales','🏆 Sales'],['service','🔧 Service']].map(([v,l])=>(
            <button key={v} onClick={()=>{setDept(v);setCat&&setCat('all')}} style={{background:dept===v?(v==='sales'?C.blue:v==='service'?C.green:'rgba(255,255,255,0.15)'):'rgba(255,255,255,0.05)',color:dept===v&&v==='service'?C.navy:C.white,fontFamily:fH,fontWeight:700,fontSize:12,letterSpacing:1.5,textTransform:'uppercase',padding:'6px 14px',borderRadius:100,border:'none',cursor:'pointer'}}>{l}</button>
          ))}
        </div>
      )}
      {setCat&&(
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
          <button onClick={()=>setCat('all')} style={{background:cat==='all'?'rgba(255,255,255,0.12)':'transparent',color:cat==='all'?C.white:C.gray,fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'4px 10px',borderRadius:6,border:`1px solid ${C.border}`,cursor:'pointer'}}>All</button>
          {cats.filter(c=>ed==='all'||SCRIPTS.find(s=>s.category===c&&s.dept===ed)).map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?'rgba(255,255,255,0.12)':'transparent',color:cat===c?C.white:C.gray,fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'4px 10px',borderRadius:6,border:`1px solid ${C.border}`,cursor:'pointer'}}>{c}</button>
          ))}
        </div>
      )}
      <input style={inp} placeholder="Search objections..." value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
  )
}

function ScriptCard({script,mode='full',defaultOpen=false}) {
  const [open,setOpen] = useState(defaultOpen)
  if (!script) return null
  return (
    <div style={{background:'rgba(184,255,60,0.04)',border:'1px solid rgba(184,255,60,0.2)',borderRadius:10,overflow:'hidden',marginBottom:10}}>
      <div onClick={()=>setOpen(o=>!o)} style={{background:`linear-gradient(135deg,${C.navyLight},#0c1f40)`,padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:2}}>Script Reference</div>
          <div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1}}>{script.objection.replace(/"/g,'')}</div>
        </div>
        <div style={{color:C.green,fontSize:14}}>{open?'▲':'▼'}</div>
      </div>
      {open&&(
        <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:10}}>
          {mode==='full'&&<div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.red,marginBottom:4}}>The Mistake</div><div style={{fontSize:12,color:C.lightText,lineHeight:1.6,background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:6,padding:'8px 10px'}}>{script.mistake}</div></div>}
          <div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:4}}>The Script</div><div style={{fontSize:13,color:C.white,fontStyle:'italic',lineHeight:1.75,background:'rgba(184,255,60,0.05)',border:'1px solid rgba(184,255,60,0.2)',borderLeft:`3px solid ${C.green}`,borderRadius:'0 6px 6px 0',padding:'10px 12px'}}>{script.script}</div></div>
          {mode==='full'&&<div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.yellow,marginBottom:4}}>The Follow-Up</div><div style={{fontSize:12,color:'#ffe08a',fontStyle:'italic',lineHeight:1.6,background:'rgba(255,201,71,0.05)',border:'1px solid rgba(255,201,71,0.15)',borderRadius:6,padding:'8px 10px'}}>{script.followup}</div></div>}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ONBOARDING  -  All 6 roles on BOTH create AND join screens
// ══════════════════════════════════════════════════════════════
const ALL_ROLES = [
  {id:'gm',      icon:'⭐',label:'General Manager'},
  {id:'sales_mgr',icon:'🏆',label:'Sales Manager'},
  {id:'svc_mgr', icon:'🔧',label:'Service Manager'},
  {id:'sales_rep',icon:'🚗',label:'Sales Consultant'},
  {id:'svc_rep', icon:'🔩',label:'Service Consultant'},
  {id:'bdc',     icon:'📞',label:'BDC'},
]

function RoleGrid({selected,onSelect}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
      {ALL_ROLES.map(r=>(
        <div key={r.id} onClick={()=>onSelect(r.id)} style={{border:`2px solid ${selected===r.id?C.green:C.border}`,background:selected===r.id?'rgba(184,255,60,0.08)':'transparent',borderRadius:10,padding:'12px 8px',textAlign:'center',cursor:'pointer',transition:'border-color 0.15s'}}>
          <div style={{fontSize:22,marginBottom:5}}>{r.icon}</div>
          <div style={{fontFamily:fH,fontSize:10,fontWeight:900,textTransform:'uppercase',color:selected===r.id?C.green:C.gray,lineHeight:1.2}}>{r.label}</div>
        </div>
      ))}
    </div>
  )
}

function Onboarding({onDone}) {
  const [step,setStep]           = useState('choose')
  const [dealerName,setDealerName] = useState('')
  const [repName,setRepName]     = useState('')
  const [repTitle,setRepTitle]   = useState('')
  const [role,setRole]           = useState('')
  const [dealerCode,setDealerCode] = useState('')
  const [loading,setLoading]     = useState(false)
  const [error,setError]         = useState('')

  const btnPrimary = {background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:14,letterSpacing:1,textTransform:'uppercase',padding:'13px 20px',borderRadius:8,border:'none',cursor:'pointer',width:'100%',marginBottom:12}
  const btnSecondary = {background:'rgba(26,107,255,0.2)',color:C.white,fontFamily:fH,fontWeight:900,fontSize:14,letterSpacing:1,textTransform:'uppercase',padding:'13px 20px',borderRadius:8,border:'1px solid rgba(26,107,255,0.4)',cursor:'pointer',width:'100%'}

  const createDealer = async () => {
    if (!dealerName.trim()||!repName.trim()||!role) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const code = dealerName.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)+Math.floor(Math.random()*100)
    const res = await dealerSync('registerDealer',code,repName.trim(),{dealerName:dealerName.trim(),dept:roleDept(role)})
    if (res.error&&!res.code) { setError('Setup failed. Try again.'); setLoading(false); return }
    const finalCode = res.code||code
    onDone({dealerId:finalCode,repName:repName.trim(),repTitle:repTitle.trim(),dealerName:dealerName.trim(),role,isManager:isManager(role)},true)
    setLoading(false)
  }

  const joinDealer = async () => {
    if (!dealerCode.trim()||!repName.trim()||!role) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const res = await dealerSync('joinDealer',dealerCode.trim().toUpperCase(),repName.trim(),{role})
    if (res.error) { setError('Dealer code not found. Check with your manager.'); setLoading(false); return }
    onDone({dealerId:dealerCode.trim().toUpperCase(),repName:repName.trim(),repTitle:repTitle.trim(),dealerName:res.dealer?.name||'',role,isManager:isManager(role)},true)
    setLoading(false)
  }

  const wrap = {position:'fixed',inset:0,background:`linear-gradient(135deg,${C.navy},#0b1f4a)`,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:24,overflowY:'auto'}
  const card = {background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:16,padding:'24px',width:'100%',maxWidth:420}

  if (step==='choose') return (
    <div style={wrap}>
      <div style={card}>
        <div style={{fontFamily:fH,fontSize:26,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>5-Minute <span style={{color:C.green}}>Dealer Coach</span></div>
        <div style={{width:40,height:2,background:`linear-gradient(90deg,${C.blue},${C.green})`,margin:'10px 0 20px',borderRadius:2}}/>
        <div style={{fontFamily:fH,fontSize:18,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:6}}>Get Started</div>
        <div style={{fontSize:13,color:C.gray,lineHeight:1.6,marginBottom:24}}>Setting up a new dealership or joining your team?</div>
        <button onClick={()=>setStep('create')} style={btnPrimary}>🏢 Set Up My Dealership</button>
        <button onClick={()=>setStep('join')} style={btnSecondary}>🔑 Join with Dealer Code</button>
      </div>
    </div>
  )

  if (step==='create') return (
    <div style={wrap}>
      <div style={card}>
        <button onClick={()=>setStep('choose')} style={{background:'none',border:'none',color:C.gray,cursor:'pointer',fontFamily:fH,fontSize:12,letterSpacing:1,textTransform:'uppercase',marginBottom:16}}>← Back</button>
        <div style={{fontFamily:fH,fontSize:20,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:16}}>Set Up Dealership</div>
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Dealership Name</div><input style={inp} placeholder="e.g. Sunset Auto Group" value={dealerName} onChange={e=>setDealerName(e.target.value)}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Your Name</div><input style={inp} placeholder="Your name" value={repName} onChange={e=>setRepName(e.target.value)}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Your Title <span style={{color:'rgba(255,255,255,0.3)',fontSize:9,letterSpacing:1}}>(optional)</span></div><input style={inp} placeholder="e.g. General Manager, Sales Manager" value={repTitle} onChange={e=>setRepTitle(e.target.value)}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:8}}>Your Role</div><RoleGrid selected={role} onSelect={setRole}/></div>
        </div>
        {error&&<div style={{fontSize:13,color:C.red,marginBottom:12}}>{error}</div>}
        <div style={{fontSize:11,color:C.gray,lineHeight:1.6,marginBottom:12,padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:6,border:`1px solid ${C.border}`}}>
          By creating an account you agree that all content, scripts, word tracks, and coaching methodologies are the proprietary property of <span style={{color:C.lightText}}>Retail Performance Solutions LLC</span> and are licensed for internal dealership use only.
        </div>
        <button onClick={createDealer} disabled={loading||!role} style={{...btnPrimary,marginBottom:0,background:role?C.green:'rgba(255,255,255,0.08)',color:role?C.navy:C.gray,cursor:role?'pointer':'default',opacity:loading?0.6:1}}>{loading?'Setting up...':'Create Dealership →'}</button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={card}>
        <button onClick={()=>setStep('choose')} style={{background:'none',border:'none',color:C.gray,cursor:'pointer',fontFamily:fH,fontSize:12,letterSpacing:1,textTransform:'uppercase',marginBottom:16}}>← Back</button>
        <div style={{fontFamily:fH,fontSize:20,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:16}}>Join Dealership</div>
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Dealer Code</div><input style={{...inp,textTransform:'uppercase',letterSpacing:3,fontFamily:fH,fontSize:18,fontWeight:900}} placeholder="e.g. SUNSET42" value={dealerCode} onChange={e=>setDealerCode(e.target.value.toUpperCase())}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Your Name</div><input style={inp} placeholder="Your name" value={repName} onChange={e=>setRepName(e.target.value)}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:5}}>Your Title <span style={{color:'rgba(255,255,255,0.3)',fontSize:9,letterSpacing:1}}>(optional)</span></div><input style={inp} placeholder="e.g. Sales Consultant, Service Advisor" value={repTitle} onChange={e=>setRepTitle(e.target.value)}/></div>
          <div><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:8}}>Your Role</div><RoleGrid selected={role} onSelect={setRole}/></div>
        </div>
        {error&&<div style={{fontSize:13,color:C.red,marginBottom:12}}>{error}</div>}
        <div style={{fontSize:11,color:C.gray,lineHeight:1.6,marginBottom:12,padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:6,border:`1px solid ${C.border}`}}>
          By joining you agree that all content, scripts, word tracks, and coaching methodologies are the proprietary property of <span style={{color:C.lightText}}>Retail Performance Solutions LLC</span> and are licensed for internal dealership use only. Unauthorized reproduction or redistribution is prohibited.
        </div>
        <button onClick={joinDealer} disabled={loading||!role} style={{...btnPrimary,marginBottom:0,background:role?C.green:'rgba(255,255,255,0.08)',color:role?C.navy:C.gray,cursor:role?'pointer':'default',opacity:loading?0.6:1}}>{loading?'Joining...':'Join Dealership →'}</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// HOME  -  Live calendar date, name in header, huddle preload
// ══════════════════════════════════════════════════════════════
function Home({onNav,dealer,stats,results,streak,milestone,onDrillNow,onHuddleNow,schedule,onScheduleChange,welcomeMsg}) {
  const role   = dealer?.role||'sales_rep'
  const dept   = roleDept(role)
  const isMgr  = isManager(role)
  const [teamKPI,setTeamKPI] = useState(null)

  // Managers: fetch live dealership KPIs + team activity for AI recommendations
  const [teamActs,setTeamActs] = useState([])
  useEffect(()=>{
    if(isMgr&&dealer?.dealerId){
      dealerSync('getDashboard',dealer.dealerId,'').then(res=>{
        if(res&&!res.error){
          const acts=res.activities||[]
          setTeamActs(acts)
          const reps=[...new Set(acts.map(a=>a.repName))].filter(Boolean)
          const weekAgo=Date.now()-7*24*60*60*1000
          const weekActs=acts.filter(a=>a.timestamp>weekAgo)
          const won=acts.filter(a=>a.result==='won').length
          setTeamKPI({
            activeReps:reps.length,
            totalDrills:acts.length,
            weekHuddles:weekActs.filter(a=>a.type==='huddle').length,
            winRate:acts.length>0?Math.round((won/acts.length)*100):0,
            salesDrills:acts.filter(a=>a.dept==='sales').length,
            svcDrills:acts.filter(a=>a.dept==='service').length,
            voiceDrills:acts.filter(a=>a.type==='voice_drill'||a.type==='voice').length,
          })
        }
      })
    }
  },[dealer?.dealerId,isMgr])

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const days     = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const now      = new Date()
  const todayDay = days[now.getDay()]
  const sched    = getSched(dept)
  const schedIdx = Math.max(0,Math.min(now.getDay()-1,4))
  const todayRow = sched[schedIdx]
  const todayScript = todayRow?.id ? SCRIPTS.find(s=>s.id===todayRow.id) : null

  // AI Recommendations  -  managers use KV team data, reps use personal results
  const recSource = isMgr ? teamActs : results
  const objScores = {}
  recSource.forEach(r=>{
    const key = r.script||(r.script||'')
    if(!key) return
    if(!objScores[key])objScores[key]={won:0,total:0,reps:new Set()}
    objScores[key].total++
    if(r.result==='won'||r.result?.startsWith('A')||r.result?.startsWith('B'))objScores[key].won++
    if(r.repName||r.rep) objScores[key].reps.add(r.repName||r.rep)
  })
  const weakObjs = Object.entries(objScores)
    .filter(([,v])=>v.total>=2)
    .map(([k,v])=>({label:k,pct:Math.round((v.won/v.total)*100),total:v.total,reps:v.reps.size}))
    .sort((a,b)=>a.pct-b.pct).slice(0,3)

  const todayDrills = results.filter(r=>r.date===new Date().toLocaleDateString('en-US')).length
  const dailyGoal   = 3
  const progressPct = Math.min((todayDrills/dailyGoal)*100,100)

  return (
    <div style={{paddingBottom:80}}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{background:`linear-gradient(135deg,${C.navyMid},#0b1f4a)`,padding:'14px 16px 12px',borderBottom:`1px solid ${C.border}`,marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontFamily:fH,fontSize:20,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1}}>5-MINUTE <span style={{color:C.green}}>DEALER COACH</span></div>
            <div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginTop:2}}>COMMAND CENTER</div>
            {dealer?.dealerName&&<div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blueBright,marginTop:2}}>{dealer.dealerName}</div>}
            {/* ── Team Momentum Interpreter ── */}
            {(()=>{
              // Read signals and produce ONE sentence of meaning
              const drills   = teamKPI?.voiceDrills || results.length || 0
              const winRate  = teamKPI?.winRate || 0
              const huddles  = teamKPI?.weekHuddles || 0
              const streakN  = streak?.count || 0
              const prevWR   = teamKPI?.prevWinRate || 0  // optional if tracked
              const daysSinceAny = 0  // placeholder

              let msg = ''
              let color = C.gray
              let icon  = '📊'

              if(isMgr){
                if(!teamKPI || drills===0){
                  msg   = 'No activity yet this week  -  run a huddle to get your team started.'
                  color = C.gray; icon = '💤'
                } else if(winRate>=70){
                  msg   = `Team is closing at ${winRate}%  -  elite territory. Keep the pressure on and don't let the habit slip.`
                  color = C.green; icon = '🚀'
                } else if(winRate>=55 && drills>=5){
                  msg   = `Solid week  -  ${drills} drills and a ${winRate}% win rate. One more focused huddle could push this team over 60%.`
                  color = C.green; icon = '📈'
                } else if(winRate>=40 && drills>=3){
                  msg   = `Win rate is at ${winRate}%  -  your team is working but not converting. Focus today's drill on the Advance step.`
                  color = C.yellow; icon = '⚠️'
                } else if(drills>0 && winRate<40){
                  msg   = `Activity is up but win rate is ${winRate}%. More drills alone won't fix this  -  the team needs to hear the model script out loud.`
                  color = C.orange; icon = '🔧'
                } else if(huddles===0 && drills>0){
                  msg   = `Reps are drilling but no huddles this week. Run one today  -  the group rep is what makes individual practice stick.`
                  color = C.yellow; icon = '📋'
                } else {
                  msg   = `${drills} drills this week  -  ${winRate}% win rate  -  ${huddles} huddle${huddles===1?'':'s'}. Keep building the habit.`
                  color = C.lightText; icon = '✅'
                }
              } else {
                // Rep view
                if(streakN>=7){
                  msg   = `${streakN}-day streak  -  you're building something. This is where habits become instincts.`
                  color = C.green; icon = '🔥'
                } else if(streakN>=3){
                  msg   = `${streakN} days in a row. The reps who make this a daily habit are the ones who close more.`
                  color = C.yellow; icon = '🔥'
                } else if(results.length>=10){
                  msg   = `${results.length} drills completed. You know these objections  -  now focus on earning the close on every one.`
                  color = C.blueBright; icon = '🎯'
                } else if(results.length>0){
                  msg   = `${results.length} drill${results.length===1?'':'s'} so far. The floor is where you'll hear these  -  practice here first.`
                  color = C.lightText; icon = '💪'
                } else {
                  msg   = 'Start your first drill. Every rep you compete against has already been practicing.'
                  color = C.gray; icon = '▶'
                }
              }

              return(
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'flex-start',gap:8}}>
                  <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{icon}</span>
                  <div style={{fontSize:12,color,lineHeight:1.55,fontWeight:500}}>{msg}</div>
                </div>
              )
            })()}
          </div>
          <div style={{textAlign:'right'}}>
            {/* Live calendar date widget */}
            <div style={{background:'rgba(26,107,255,0.15)',border:'1px solid rgba(26,107,255,0.3)',borderRadius:8,padding:'5px 10px',marginBottom:6,textAlign:'center',minWidth:52}}>
              <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blueBright}}>{dayNames[now.getDay()].slice(0,3).toUpperCase()}</div>
              <div style={{fontFamily:fH,fontSize:24,fontWeight:900,color:C.white,lineHeight:1.1}}>{now.getDate()}</div>
              <div style={{fontFamily:fH,fontSize:9,fontWeight:700,color:C.gray}}>{months[now.getMonth()].toUpperCase()}</div>
            </div>
            {/* Name + role badge */}
            <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(184,255,60,0.1)',border:'1px solid rgba(184,255,60,0.25)',color:C.green,fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'3px 8px',borderRadius:100,maxWidth:150,overflow:'hidden'}}>
              <span>{ROLES[role]?.icon}</span>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dealer?.repName||ROLES[role]?.label}{dealer?.repTitle?`  -  ${dealer.repTitle}`:''}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:'0 16px'}}>
        {/* Welcome message */}
        {welcomeMsg&&(
          <div style={{background:'linear-gradient(135deg,rgba(26,107,255,0.15),rgba(26,107,255,0.05))',border:'1px solid rgba(26,107,255,0.3)',borderRadius:12,padding:'12px 16px',marginBottom:12}}>
            <div style={{fontSize:13,color:C.white,lineHeight:1.5}}>{welcomeMsg}</div>
          </div>
        )}

        {/* Milestone banner */}
        {milestone&&(
          <div style={{background:'linear-gradient(135deg,rgba(184,255,60,0.15),rgba(184,255,60,0.05))',border:'1px solid rgba(184,255,60,0.4)',borderRadius:12,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:32}}>{milestone.icon}</div>
            <div>
              <div style={{fontFamily:fH,fontSize:14,fontWeight:900,textTransform:'uppercase',color:C.green}}>🎉 {milestone.label}</div>
              <div style={{fontSize:12,color:C.lightText,marginTop:2}}>{milestone.msg}</div>
            </div>
          </div>
        )}

        {/* Live Drills  -  reps only show personal progress bar */}
        {!isMgr && (
          <div style={{background:'linear-gradient(135deg,rgba(26,107,255,0.12),rgba(26,107,255,0.05))',border:'1px solid rgba(26,107,255,0.3)',borderRadius:12,padding:'14px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:14}}>
            <div style={{background:'rgba(26,107,255,0.2)',borderRadius:10,padding:'10px 14px',textAlign:'center',minWidth:64}}>
              <div style={{fontFamily:fH,fontSize:38,fontWeight:900,color:C.blueBright,lineHeight:1}}>{todayDrills}</div>
              <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.blueBright,marginTop:2}}>Today</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:2}}>Live Drills</div>
              <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:100,overflow:'hidden',margin:'6px 0'}}>
                <div style={{height:'100%',width:`${progressPct}%`,background:todayDrills>=dailyGoal?C.green:C.blue,borderRadius:100,transition:'width 0.4s'}}/>
              </div>
              <div style={{fontSize:11,color:todayDrills>=dailyGoal?C.green:C.gray}}>{todayDrills>=dailyGoal?'✓ Daily goal complete!':` ${todayDrills} of ${dailyGoal}  -  ${dailyGoal-todayDrills} more to hit goal`}</div>
            </div>
          </div>
        )}

        {/* Streak + daily goal */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><span style={{fontSize:20}}>🔥</span><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.orange}}>Drill Streak</div></div>
            <div style={{fontFamily:fH,fontSize:36,fontWeight:900,color:C.orange,lineHeight:1}}>{streak?.count||0}</div>
            <div style={{fontSize:11,color:C.gray,marginTop:2}}>consecutive days</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.blue}}>Today's Goal</div>
              <div style={{fontFamily:fH,fontSize:12,fontWeight:900,color:todayDrills>=dailyGoal?C.green:C.gray}}>{todayDrills}/{dailyGoal}</div>
            </div>
            <div style={{height:8,background:'rgba(255,255,255,0.08)',borderRadius:100,overflow:'hidden',marginBottom:6}}>
              <div style={{height:'100%',width:`${progressPct}%`,background:todayDrills>=dailyGoal?C.green:C.blue,borderRadius:100,transition:'width 0.4s'}}/>
            </div>
            {todayDrills>=dailyGoal?<div style={{fontSize:11,color:C.green}}>✓ Goal complete!</div>:<div style={{fontSize:11,color:C.gray}}>{dailyGoal-todayDrills} more to hit your goal</div>}
          </div>
        </div>

        {/* Stats row  -  managers: clean 4-KPI row, reps: personal 3-stat row */}
        {isMgr ? (
          <div style={{marginBottom:12}}>
            {/* 4 essential KPIs in one row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
              {[
                {val:teamKPI?.activeReps??' - ',     label:'Active Reps',  color:C.blue,   icon:'👥'},
                {val:teamKPI?.voiceDrills??' - ',    label:'Voice Drills', color:C.yellow, icon:'🎙'},
                {val:teamKPI?.weekHuddles??' - ',    label:'Huddles/Wk',   color:C.green,  icon:'⏱'},
                {val:teamKPI?`${teamKPI.winRate}%`:' - ', label:'Win Rate', color:teamKPI?.winRate>=60?C.green:teamKPI?.winRate>=40?C.yellow:C.orange, icon:'🏆'},
              ].map(({val,label,color,icon})=>(
                <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:14,marginBottom:2}}>{icon}</div>
                  <div style={{fontFamily:fH,fontSize:22,fontWeight:900,color,lineHeight:1}}>{val}</div>
                  <div style={{fontFamily:fH,fontSize:7,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color,marginTop:3,lineHeight:1.2}}>{label}</div>
                </div>
              ))}
            </div>
            {/* Thin sales/service split strip */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13}}>🏆</span>
                <span style={{fontFamily:fH,fontSize:12,fontWeight:900,color:C.blue}}>{teamKPI?.salesDrills??0}</span>
                <span style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blue}}>Sales</span>
              </div>
              <div style={{width:1,height:20,background:C.border}}/>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13}}>🔧</span>
                <span style={{fontFamily:fH,fontSize:12,fontWeight:900,color:C.green}}>{teamKPI?.svcDrills??0}</span>
                <span style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green}}>Service</span>
              </div>
              <div style={{width:1,height:20,background:C.border}}/>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13}}>📊</span>
                <span style={{fontFamily:fH,fontSize:12,fontWeight:900,color:C.gray}}>{teamKPI?.totalDrills??0}</span>
                <span style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.gray}}>Total</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
            {[{val:stats.drills||0,label:'Total Drills',color:C.blue},{val:stats.huddles||0,label:'Huddles',color:C.green},{val:stats.voices||0,label:'Voice Drills',color:C.yellow}].map(({val,label,color})=>(
              <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontFamily:fH,fontSize:30,fontWeight:900,color,lineHeight:1}}>{val}</div>
                <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color,marginTop:3}}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Today's Focus  -  huddle button now preloads script */}
        <div style={{background:'linear-gradient(135deg,#0f2a5c,#1a3a7a)',border:'1px solid rgba(26,107,255,0.4)',borderRadius:12,padding:'16px',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{background:'rgba(26,107,255,0.3)',borderRadius:6,padding:'3px 8px',fontFamily:fH,fontSize:9,fontWeight:900,color:C.white,letterSpacing:1,textTransform:'uppercase'}}>{dayNames[now.getDay()]} · {months[now.getMonth()]} {now.getDate()}</div>
            <span style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green}}>Today's Focus</span>
          </div>
          <div style={{fontFamily:fH,fontSize:18,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1,marginBottom:4}}>{schedule[todayRow?.day]||todayRow?.label}</div>
          {todayScript&&<div style={{fontSize:12,color:C.gray,marginBottom:12,fontStyle:'italic'}}>"{getOpener(todayScript.id).substring(0,65)}..."</div>}
          <div style={{display:'grid',gridTemplateColumns:isMgr?'1fr 1fr':'1fr',gap:10}}>
            <button onClick={()=>onDrillNow(todayScript)} style={{background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:13,letterSpacing:1,textTransform:'uppercase',padding:11,borderRadius:8,border:'none',cursor:'pointer'}}>🎙 Drill This Now</button>
            {isMgr&&<button onClick={()=>onHuddleNow(todayScript)} style={{background:'rgba(26,107,255,0.2)',color:C.white,fontFamily:fH,fontWeight:900,fontSize:13,letterSpacing:1,textTransform:'uppercase',padding:11,borderRadius:8,border:'1px solid rgba(26,107,255,0.4)',cursor:'pointer'}}>⏱ Team Huddle</button>}
          </div>
        </div>

        {/* Quick Drill */}
        <div onClick={()=>onDrillNow(null)} style={{background:'linear-gradient(135deg,rgba(26,107,255,0.12),rgba(26,107,255,0.06))',border:'1px solid rgba(26,107,255,0.3)',borderRadius:12,padding:'12px 16px',marginBottom:12,cursor:'pointer',display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:28}}>⚡</div>
          <div style={{flex:1}}><div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:C.blueBright,marginBottom:1}}>Quick Drill</div><div style={{fontSize:12,color:C.lightText}}>Random objection  -  tap and go</div></div>
          <div style={{color:C.blueBright,fontSize:18}}>→</div>
        </div>

        {/* Weekly Schedule */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>🗓</span><span style={{fontFamily:fH,fontSize:13,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.white}}>This Week</span></div>
            {isMgr&&<div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blueBright}}>🧠 AI Insights ↓</div>}
          </div>
          {sched.map((d,i)=>{
            const isToday = d.day===todayDay&&now.getDay()>=1&&now.getDay()<=5
            const label   = schedule[d.day]||d.label
            return <div key={d.day} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
              <div style={{fontFamily:fH,fontSize:12,fontWeight:900,color:isToday?C.green:C.gray,minWidth:32}}>{d.day}</div>
              <div style={{flex:1,fontSize:12,color:isToday?C.white:C.lightText}}>{label}</div>
              {isToday&&<div style={{background:C.green,color:C.navy,fontFamily:fH,fontSize:9,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'2px 7px',borderRadius:100}}>Today</div>}
            </div>
          })}
          {isMgr&&(
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.blueBright,marginBottom:8}}>🧠 AI Objection Recommendations</div>
              {weakObjs.length>0 ? weakObjs.map((w,i)=>{
                const d2=['MON','TUE','WED','THU','FRI']
                const ti=d2.indexOf(todayDay); const nd=d2[(ti+1)%5]||'TUE'
                const added=Object.values(schedule).some(v=>v.includes(w.label))
                return <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<weakObjs.length-1?8:0,background:w.pct<30?'rgba(255,107,107,0.08)':'rgba(26,107,255,0.06)',border:`1px solid ${w.pct<30?'rgba(255,107,107,0.2)':'rgba(26,107,255,0.15)'}`,borderRadius:8,padding:'8px 10px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.white,fontWeight:600,marginBottom:2}}>{w.label}</div>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                      <span style={{fontFamily:fH,fontSize:10,fontWeight:700,color:w.pct<30?C.red:w.pct<50?C.yellow:C.orange}}>{w.pct}% win rate</span>
                      <span style={{fontSize:10,color:C.gray}}>{w.total} drills{isMgr&&w.reps>1?`  -  ${w.reps} reps`:''}</span>
                    </div>
                  </div>
                  <button onClick={()=>onScheduleChange({...schedule,[nd]:`🧠 Focus: ${w.label}`})} disabled={added} style={{background:added?'rgba(184,255,60,0.15)':'rgba(184,255,60,0.08)',border:'1px solid rgba(184,255,60,0.3)',color:C.green,fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'5px 10px',borderRadius:6,cursor:added?'default':'pointer',flexShrink:0}}>{added?'✓ Added':'+ Add'}</button>
                </div>
              }) : (
                <div style={{fontSize:11,color:C.gray,fontStyle:'italic',padding:'4px 0'}}>Complete 2+ drills on the same objection to get AI recommendations.</div>
              )}
            </div>
          )}
        </div>

        {isMgr&&(
          <div onClick={()=>onNav('hub')} style={{background:'linear-gradient(135deg,rgba(184,255,60,0.08),rgba(184,255,60,0.03))',border:'1px solid rgba(184,255,60,0.3)',borderRadius:12,padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:14}}>
            <div style={{fontSize:26}}>🏢</div>
            <div style={{flex:1}}><div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:C.green,marginBottom:1}}>Manager Hub</div><div style={{fontSize:12,color:C.lightText}}>Shop Time · Leadership Grid · Ownership Lifecycle</div></div>
            <div style={{color:C.green,fontSize:18}}>→</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SCRIPT LIBRARY
// ══════════════════════════════════════════════════════════════
function ScriptLibrary({dealer}) {
  const dept     = roleDept(dealer?.role||'both')
  const lockDept = dept==='both'?null:dept
  const [filterDept,setFilterDept] = useState(lockDept||'all')
  const [cat,setCat]   = useState('all')
  const [search,setSearch] = useState('')
  const [openId,setOpenId] = useState(null)

  const filtered = SCRIPTS.filter(s=>{
    if(filterDept!=='all'&&s.dept!==filterDept) return false
    if(cat!=='all'&&s.category!==cat) return false
    if(search&&!s.objection.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{padding:'16px 16px 80px'}}>
      <div style={{fontFamily:fH,fontSize:28,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Script Library</div>
      <div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>60 Word Tracks  -  Sales & Service</div>
      <ScriptFilterBar dept={filterDept} setDept={setFilterDept} cat={cat} setCat={setCat} search={search} setSearch={setSearch} lockDept={lockDept}/>
      <div style={{fontSize:12,color:C.gray,marginBottom:12}}>{filtered.length} scripts</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map(s=>(
          <div key={s.id} style={{background:C.card,border:`1px solid ${openId===s.id?(s.dept==='sales'?'rgba(26,107,255,0.4)':'rgba(184,255,60,0.3)'):C.border}`,borderRadius:10,overflow:'hidden'}}>
            <div onClick={()=>setOpenId(openId===s.id?null:s.id)} style={{padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,background:openId===s.id?`linear-gradient(135deg,${C.navyLight},#0c1f40)`:'transparent'}}>
              <div style={{fontFamily:fH,fontSize:24,fontWeight:900,color:s.dept==='sales'?'rgba(26,107,255,0.3)':'rgba(184,255,60,0.3)',lineHeight:1,minWidth:32}}>{String(s.id).padStart(2,'0')}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:5,marginBottom:3,flexWrap:'wrap'}}><Tag color={s.dept==='sales'?C.blue:C.green}>{s.dept}</Tag><Tag color={C.gray}>{s.category}</Tag></div>
                <div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1}}>{s.objection.replace(/"/g,'')}</div>
              </div>
              <div style={{color:C.gray,fontSize:12}}>{openId===s.id?'▲':'▼'}</div>
            </div>
            {openId===s.id&&(
              <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:10}}>
                {[{label:'The Situation',color:C.gray,content:s.situation,bg:'rgba(255,255,255,0.03)'},{label:'The Mistake',color:C.red,content:s.mistake,bg:'rgba(255,107,107,0.06)'}].map(({label,color,content,bg})=>(
                  <div key={label}><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color,marginBottom:4}}>{label}</div><div style={{background:bg,border:`1px solid ${color}22`,borderRadius:6,padding:'8px 10px',fontSize:12,color:C.lightText,lineHeight:1.65}}>{content}</div></div>
                ))}
                <div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:4}}>The Script</div><div style={{background:'rgba(184,255,60,0.05)',border:'1px solid rgba(184,255,60,0.2)',borderLeft:`3px solid ${C.green}`,borderRadius:'0 6px 6px 0',padding:'10px 12px',fontSize:13,color:C.white,fontStyle:'italic',lineHeight:1.75}}>{s.script}</div></div>
                <div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.blueBright,marginBottom:4}}>Why It Works</div><div style={{background:'rgba(26,107,255,0.07)',border:'1px solid rgba(26,107,255,0.18)',borderRadius:6,padding:'8px 10px',fontSize:12,color:C.lightText,lineHeight:1.65}}>{s.why}</div></div>
                <div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.yellow,marginBottom:4}}>The Follow-Up</div><div style={{background:'rgba(255,201,71,0.05)',border:'1px solid rgba(255,201,71,0.15)',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#ffe08a',fontStyle:'italic',lineHeight:1.65}}>{s.followup}</div></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// VOICE DRILL  -  Rebuilt AI coaching with strict ACRA grading
// Grading calibrated to script library. D/F grades for bad responses.
// ══════════════════════════════════════════════════════════════
function VoiceDrill({onLog,dealer,preloadScript,onClearPreload}) {
  const dept     = roleDept(dealer?.role||'both')
  const lockDept = dept==='both'?null:dept
  const [filterDept,setFilterDept] = useState(lockDept||'all')
  const [cat,setCat]         = useState('all')
  const [search,setSearch]   = useState('')
  const [phase,setPhase]     = useState('list')
  const [activeS,setActiveS] = useState(null)
  const [activePersId,setActivePersId] = useState(null)
  const [exchange,setExchange]   = useState(0)
  const [transcript,setTranscript] = useState('')
  const [allTranscripts,setAllTranscripts] = useState([])
  const [feedback,setFeedback]   = useState(null)
  const [silentCoach,setSilentCoach] = useState(null)
  const [loading,setLoading]     = useState(false)
  const [silentLoading,setSilentLoading] = useState(false)
  const [confidenceFlags,setConfidenceFlags] = useState([])  // hesitation word counts per exchange
  const [closeEarnedFlag,setCloseEarnedFlag] = useState(false) // rep earned the close
  // ── Live AI Simulation state ─────────────────────────────
  const [livePhase,setLivePhase]       = useState('idle') // idle | connecting | live | ended
  const [liveTranscript,setLiveTranscript] = useState([]) // [{role,text}]
  const [liveStatus,setLiveStatus]     = useState('')
  const [liveError,setLiveError]       = useState('')
  const [exchangeCount,setExchangeCount]   = useState(0)
  const [liveRecording,setLiveRecording]   = useState(false) // true = rep's turn, show Send button
  const pcRef              = useRef(null)  // RTCPeerConnection
  const dcRef              = useRef(null)  // RTCDataChannel
  const streamRef          = useRef(null)  // local mic stream
  const liveTranscriptRef  = useRef([])    // always-current transcript for closures
  const sendResponseRef    = useRef(null)  // stable ref to send function
  const [error,setError]         = useState('')
  const [recording,setRecording] = useState(false)
  const [aiText,setAiText]       = useState('')
  const [speaking,setSpeaking]   = useState(false)
  const [showScript,setShowScript] = useState(false)
  const [showPersonas,setShowPersonas] = useState(false)
  const recRef         = useRef(null)
  const accumulatedRef = useRef('')   // tracks speech across browser restarts
  const recordingRef   = useRef(false) // ref so closures read current value
  const autoSubmitRef  = useRef(false) // triggers auto-submit after stop
  const supported = typeof window!=='undefined'&&('SpeechRecognition' in window||'webkitSpeechRecognition' in window)

  useEffect(()=>{
    if(preloadScript){
      const persona = getPersonaForScript(preloadScript)
      setActiveS(preloadScript)
      setActivePersId(persona.id)
      setFeedback(null)
      setConfidenceFlags([])
      setCloseEarnedFlag(false)
      setLivePhase('connecting') // switch screen FIRST
      onClearPreload&&onClearPreload()
      // Small delay so React renders live screen before async call starts
      setTimeout(() => startLiveDrill(preloadScript, persona), 100)
    }
  },[preloadScript])

  const filtered = SCRIPTS.filter(s=>{
    const ed = lockDept||filterDept
    if(ed!=='all'&&s.dept!==ed) return false
    if(cat!=='all'&&s.category!==cat) return false
    if(search&&!s.objection.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── PERSONA LIBRARY ─────────────────────────────────────────
  // 10 named characters with distinct personalities mapped to dept/category
  // ── PERSONA LIBRARY mapped to actual script categories ─────────
  const PERSONAS = [
    // SALES
    // SALES  -  5 personas covering all 6 sales categories
    {id:'dave', name:'Dave', emoji:'📱', dept:'sales', gender:'male',
     cats:['Handling Objections & Value Selling','Sales Tactics for Higher Gross','Mindset & Gross Awareness','Add-Ons & After-Sale'],
     desc:"Did 3 hours on TrueCar last night. Has screenshots.",
     tone:'aggressive', escalation:"Cites exact competing prices. Gets louder when challenged.",
     opener:()=>`I spent three hours on TrueCar last night and I found this exact car listed for two thousand two hundred less at Riverside Auto. I have the screenshot right here.`},
    {id:'linda', name:'Linda', emoji:'🛡', dept:'sales', gender:'female',
     cats:['Handling Objections & Value Selling','Mindset & Gross Awareness'],
     desc:"Got burned at her last dealership. Polite but a wall.",
     tone:'guarded', escalation:"Becomes more withdrawn if pushed. Responds to empathy.",
     opener:()=>`I want to be upfront  -  the last time I bought a car I felt really pressured and I ended up regretting it. I need to take my time on this.`},
    {id:'mike', name:'Mike', emoji:'💰', dept:'sales', gender:'male',
     cats:['Menu Selling & Finance','Sales Tactics for Higher Gross'],
     desc:"Only cares about the monthly number. Ignores total cost.",
     tone:'impatient', escalation:"Repeats his payment number louder. Dismisses value talk.",
     opener:()=>`Look, I don't care about the sticker price or any of that. All I want to know is my monthly payment. Keep it under four-fifty and we have a deal.`},
    {id:'gary', name:'Gary', emoji:'🚛', dept:'sales', gender:'male',
     cats:['Used Car Gross & Reconditioning','Sales Tactics for Higher Gross'],
     desc:"Convinced his trade is worth more than it is. Has a firm number.",
     tone:'stubborn', escalation:"Brings up sentimental value and what he paid originally.",
     opener:()=>`I've had this truck for six years and taken great care of it. My neighbor sold his for twelve thousand last month. I'm not taking less than ten for mine.`},
    {id:'carol', name:'Carol', emoji:'👥', dept:'sales', gender:'female',
     cats:['Add-Ons & After-Sale','Menu Selling & Finance','Used Car Gross & Reconditioning','Sales Tactics for Higher Gross'],
     desc:"Questions every add-on. Thinks she can get it cheaper elsewhere.",
     tone:"warm but skeptical", escalation:"Compares each item to online prices.",
     opener:()=>`I love the car but I think a lot of these extras are things I could add later or honestly get cheaper somewhere else.`},
    // SERVICE  -  5 personas covering all 6 service categories
    {id:'frank', name:'Frank', emoji:'⏳', dept:'service', gender:'male',
     cats:['Selling the Menu & Recommended Services','MPI Conversion','Mindset & Customer-Pay Focus'],
     desc:"Car has been fine for years. Skeptical of every recommendation.",
     tone:'skeptical', escalation:"Questions whether the work is really necessary right now.",
     opener:()=>`That car has a hundred and forty thousand miles on it and I have never had a problem. Every time I come in here you find something new that supposedly needs fixing.`},
    {id:'barbara', name:'Barbara', emoji:'💸', dept:'service', gender:'female',
     cats:['Handling Objections & Price Pushback','Selling Specific Services'],
     desc:"Sticker shock every visit. Compares to her cousin's shop.",
     tone:'shocked', escalation:"Calls her cousin mid-conversation for a second opinion.",
     opener:()=>`Seven hundred and forty dollars? I called my cousin's shop this morning and he said he could do the same job for three hundred and fifty. How do you justify that kind of difference?`},
    {id:'ray', name:'Ray', emoji:'🏪', dept:'service', gender:'male',
     cats:['Handling Objections & Price Pushback','Selling Specific Services','Mindset & Customer-Pay Focus'],
     desc:"Loyal to his independent mechanic for fifteen years.",
     tone:'loyal', escalation:"Defends his mechanic personally. Responds to warranty/OEM argument.",
     opener:()=>`My guy Tony at the shop on Fifth has been doing my cars for fifteen years. He has never done me wrong and his prices are always better.`},
    {id:'susan', name:'Susan', emoji:'📞', dept:'service', gender:'female',
     cats:['Phone Ups & Appointment Setting','MPI Conversion','Selling the Menu & Recommended Services','Mindset & Customer-Pay Focus'],
     desc:"Will not approve anything without calling her husband.",
     tone:'polite but hesitant', escalation:"Goes quiet and reaches for her phone.",
     opener:()=>`Before I approve any of this I really need to call my husband. He handles everything mechanical and I do not want to agree to something he would have questions about.`},
    {id:'tom', name:'Tom', emoji:'⌛', dept:'service', gender:'male',
     cats:['Mindset & Customer-Pay Focus','Selling the Menu & Recommended Services','MPI Conversion','Selling Specific Services','Phone Ups & Appointment Setting'],
     desc:"Always defers. Nothing is ever urgent enough today.",
     tone:'casual dismissive', escalation:"Has a reason why now is never the right time.",
     opener:()=>`The car is driving just fine right now. Money is tight this month. I will bring it back in a few weeks when things settle down.`},
  ]

  // Match persona  -  category aligned + gender alternates by script ID
  // Odd script IDs → male persona, Even script IDs → female persona
  const getPersonaForScript = (script) => {
    if(!script) return PERSONAS[0]
    const preferMale = (script.id % 2 !== 0)
    const preferredGender = preferMale ? 'male' : 'female'
    const fallbackGender  = preferMale ? 'female' : 'male'

    // 1. Exact category + preferred gender
    const exactGender = PERSONAS.filter(p=>
      p.dept===script.dept &&
      p.cats.includes(script.category) &&
      p.gender===preferredGender
    )
    if(exactGender.length) return exactGender[Math.floor(Math.random()*exactGender.length)]

    // 2. Exact category + any gender
    const exact = PERSONAS.filter(p=>
      p.dept===script.dept &&
      p.cats.includes(script.category)
    )
    if(exact.length) return exact[Math.floor(Math.random()*exact.length)]

    // 3. Same dept + preferred gender
    const deptGender = PERSONAS.filter(p=>
      p.dept===script.dept &&
      p.gender===preferredGender
    )
    if(deptGender.length) return deptGender[Math.floor(Math.random()*deptGender.length)]

    // 4. Same dept any gender
    const deptMatch = PERSONAS.filter(p=>p.dept===script.dept)
    if(deptMatch.length) return deptMatch[Math.floor(Math.random()*deptMatch.length)]

    return PERSONAS[0]
  }

  const getPersonaOpener = (persona, script) => {
    // Always use the script-specific objection as the opener
    // Persona character is delivered via their unique voice + AI pushback responses
    return getOpener(script.id)
  }

  const launch = (script, personaId=null) => {
    setLivePhase('idle')  // ensure live screen never blocks regular drill
    if (!script) {
      const pool = SCRIPTS.filter(s=>dept==='both'||s.dept===dept)
      script = pool[Math.floor(Math.random()*pool.length)]
    }
    const persona = personaId ? PERSONAS.find(p=>p.id===personaId)||getPersonaForScript(script) : getPersonaForScript(script)
    setActiveS(script); setActivePersId(persona.id)
    setPhase('drill'); setExchange(0)
    setLivePhase('idle')  // always reset live phase so regular drill shows correctly
    setLiveTranscript([]); setLiveStatus(''); setLiveError('')
    // Clean up any live AI audio elements
    document.querySelectorAll('audio[data-realtime]').forEach(el=>{ el.srcObject=null; el.remove() })
    // Stop any open WebRTC connections
    if(pcRef.current){ try{ pcRef.current.close() }catch{} pcRef.current=null }
    if(dcRef.current){ try{ dcRef.current.close() }catch{} dcRef.current=null }
    if(streamRef.current){ streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null }
    setTranscript(''); setAllTranscripts([]); setFeedback(null)
    setError(''); setShowScript(false); setSilentCoach(null); setSilentLoading(false); setConfidenceFlags([]); setCloseEarnedFlag(false)
    const opener = getPersonaOpener(persona, script)
    setAiText(opener)
    const vOpts = getPersonaVoiceOpts(persona)
    setSpeaking(true); speak(opener,()=>setSpeaking(false), vOpts)
  }

  const startRec = () => {
    if(!supported){setError('Use Chrome or Edge for voice. Type below.');return}
    stopSpeaking(); setSpeaking(false)
    accumulatedRef.current = ''   // reset accumulator for fresh recording
    setTimeout(()=>{
      const SR = window.SpeechRecognition||window.webkitSpeechRecognition
      const rec = new SR()
      rec.continuous    = true    // keeps recording through natural pauses
      rec.interimResults = true
      rec.lang = 'en-US'
      let lastResultIndex = 0
      rec.onresult = e => {
        // Only process NEW final results to prevent repetition loops
        let newFinal = ''
        for(let i=lastResultIndex; i<e.results.length; i++){
          if(e.results[i].isFinal){
            newFinal += e.results[i][0].transcript + ' '
            lastResultIndex = i + 1
          }
        }
        if(newFinal) {
          accumulatedRef.current += newFinal
          setTranscript(accumulatedRef.current.trim())
        }
      }
      rec.onend = () => {
        // Auto-restart only if user hasn't stopped manually
        if(recRef.current === rec && recordingRef.current){
          try { rec.start() } catch {}
        } else {
          setRecording(false)
          recordingRef.current = false
        }
      }
      rec.onerror = e => {
        if(e.error === 'no-speech') return  // ignore pauses
        setRecording(false)
        recordingRef.current = false
        setError('Mic error  -  type your response below.')
      }
      recRef.current = rec
      recordingRef.current = true
      setRecording(true); setTranscript(''); setError('')
      rec.start()
    },400)
  }
  const stopRec = (autoSubmit=false) => {
    recordingRef.current = false
    if(recRef.current){ try { recRef.current.stop() } catch {} recRef.current=null }
    setRecording(false)
    // Auto-submit after a short delay to let final transcript settle
    if(autoSubmit){
      setTimeout(()=>{
        if(submitRef.current) submitRef.current()
      }, 500)
    }
  }

  // ── SILENT COACH ─────────────────────────────────────────────
  // After each rep response (except the last), whisper one coaching line
  // before the customer pushes back. Tells rep exactly what step to hit next.
  // submitRef  -  stable reference to submit so stopRec can call it directly
  const submitRef = useRef(null)

  const getSilentCoach = async (repResponse, exchangeNum, script) => {
    // ACRA fallback tips by exchange  -  always show something useful
    const fallbacks = [
      `Did you acknowledge their concern before pitching? Mirror their words first.`,
      `Ask one clarifying question  -  find out WHY before you respond.`,
      `Close with a direct yes or no question  -  don't leave it open ended.`,
    ]
    const fallback = fallbacks[Math.min(exchangeNum, fallbacks.length-1)]
    try {
      const res = await fetch('/ai-proxy',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          system:`You are an expert automotive sales coach. A salesperson just responded to a customer objection. Give ONE specific coaching line under 15 words. Tell them exactly what ACRA step to use next: Acknowledge, Clarify, Respond, or Advance. Be direct. No labels. No preamble. Just the coaching tip.`,
          messages:[{role:'user',content:`Objection: "${script.objection}"
Rep said: "${repResponse}"
Exchange ${exchangeNum+1} of 3. Model answer: "${script.script?.substring(0,120)}"
One coaching whisper:`}],
          max_tokens:60
        })
      })
      const data = await res.json()
      const tip = data.content?.[0]?.text?.trim()
      setSilentCoach(tip && tip.length>5 ? tip : fallback)
    } catch {
      setSilentCoach(fallback)
    }
    setSilentLoading(false)
  }

  const submit = async () => {
    if(!transcript.trim()){return}
    stopRec()

    // ── LIVE DRILL MODE ──────────────────────────────────────
    if(livePhase === 'live' && activeS) {
      const repText = transcript.trim()
      if (!repText) { setLiveRecording(true); startRec(); return }

      stopRec()
      setTranscript('')
      accumulatedRef.current = ''
      setLiveRecording(false)
      setLiveStatus('Thinking...')

      // Add rep turn to live transcript
      const updatedLive = [...liveTranscriptRef.current, { role: 'rep', text: repText }]
      setLiveTranscript(updatedLive)
      liveTranscriptRef.current = updatedLive
      const newExCount = updatedLive.filter(t => t.role === 'rep').length
      setExchangeCount(newExCount)
      getSilentCoach(repText, newExCount - 1, activeS)

      if (newExCount >= 5) {
        setTimeout(() => endLiveDrill(activeS, liveTranscriptRef.current), 800)
        return
      }

      const persona = PERSONAS.find(p => p.id === activePersId) || getPersonaForScript(activeS)

      // ── Build proper messages array — NOT a concatenated string ──
      // This is how the Claude API is designed to work for conversation
      const systemPrompt = `You are ${persona.name}, a real customer at a car dealership.

YOUR CHARACTER:
- Personality: ${persona.tone}
- Backstory: ${persona.desc}
- When pushed: ${persona.escalation}

THE OBJECTION YOU HAVE: ${activeS.objection.replace(/"/g,"")}

HOW TO RESPOND:
- Exchange 1-2: Hold your position firmly. You have heard sales pitches before.
- Exchange 3: Acknowledge if they said something genuinely good, but stay cautious.
- Exchange 4: Soften IF they directly addressed your concern with something specific.
- Exchange 5: Either agree or firmly disengage.

CRITICAL RULES:
- React to what was SPECIFICALLY just said. Never repeat yourself word for word.
- Sound like a real person. Use contractions. Show emotion. Vary your tone.
- 2-3 sentences max. Spoken language only.
- Never use the salesperson name.
- Only add [CLOSE_EARNED] after exchange 2 if the rep gave genuine empathy + specific value + direct ask.\`

      const convoMessages = []
      let isFirst = true
      for (const turn of updatedLive) {
        if (turn.role === 'customer') {
          if (isFirst) {
            // First customer turn is the setup for the conversation
            convoMessages.push({ role: 'user', content: 'Start the conversation by stating your concern.' })
            convoMessages.push({ role: 'assistant', content: turn.text })
            isFirst = false
          } else {
            convoMessages.push({ role: 'assistant', content: turn.text })
          }
        } else {
          // Rep turn
          convoMessages.push({ role: 'user', content: turn.text })
        }
      }
      // Final instruction — tell Claude to respond as the customer
      convoMessages.push({ role: 'user', content: 'Respond naturally as ' + persona.name + '. React to exactly what was just said. Do not repeat what you already said.' })

      const speakReply = (reply) => {
        const closeEarned = reply.includes('[CLOSE_EARNED]')
        const clean = reply.replace('[CLOSE_EARNED]','').trim()
        const withReply = [...liveTranscriptRef.current, { role: 'customer', text: clean }]
        setLiveTranscript(withReply)
        liveTranscriptRef.current = withReply
        setAiText(clean)
        setLiveStatus('Listen...')
        const pVoice = getPersonaVoiceOpts(persona)
        setSpeaking(true)
        speak(clean, () => {
          setSpeaking(false)
          if (closeEarned) {
            endLiveDrill(activeS, liveTranscriptRef.current)
          } else {
            setLiveStatus('Your turn  -  speak your response')
            setTimeout(() => { setLiveRecording(true); startRec() }, 600)
          }
        }, pVoice)
      }

      try {
        const res = await fetch('/ai-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: systemPrompt,
            messages: convoMessages,
            max_tokens: 150
          })
        })
        const data = await res.json()
        const rawReply = data?.content?.[0]?.text?.trim()
        if (!rawReply || rawReply.length < 5) throw new Error('Empty response')
        speakReply(rawReply)
      } catch(e) {
        // Persona-specific fallbacks that advance the conversation
        const fallbacks = [
          'Look, I hear you, but I am still not convinced this is the right move for me right now.',
          'You are going to have to do better than that if you want my business.',
          'I have heard that before. What makes your situation actually different?',
          'I appreciate it but I still have my concerns.',
          'Let me think about that for a second... okay but what about the price though?'
        ]
        speakReply(fallbacks[newExCount % fallbacks.length])
      }
      return
    }
    // ── REGULAR (non-live) PATH  -  kept for fallback ─────────
    const newEx = exchange+1; setExchange(newEx)
    const updatedTranscripts = [...allTranscripts, transcript]
    setAllTranscripts(updatedTranscripts)
    const MAX_EXCHANGES = 5  // max before auto-coaching

    setLoading(true)
    const persona = PERSONAS.find(p=>p.id===activePersId)||getPersonaForScript(activeS)

    // Detect confidence markers in rep response
    const hesitationWords = ['i think','maybe','possibly','im not sure','i guess','kind of','sort of','probably','might']
    const repLower = transcript.toLowerCase()
    const hesitationCount = hesitationWords.filter(w=>repLower.includes(w)).length
    setConfidenceFlags(prev=>[...prev, hesitationCount])

    try{
      const savedTranscript = transcript
      const res = await fetch('/ai-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        system:'You are '+persona.name+'. '+persona.tone+'. Backstory: '+persona.desc+'. When pushed: '+persona.escalation+'. Exchange '+newEx+' of 5 about: '+activeS.objection.replace(/"/g,'')+'. Rules: Hold firm exchanges 1-2. Show cracks exchange 3-4 only if they addressed your concern. Resolve exchange 5. React to EXACTLY what was just said - never repeat yourself. Sound human - contractions, emotion, 1-2 sentences max. Add [CLOSE_EARNED] only if rep earned it after exchange 2.',
        messages:[{role:'user',content:'Exchange '+newEx+'. Rep said: "'+transcript+'". Full convo: '+updatedTranscripts.map((t,i)=>i%2===0?'Rep: '+t:'You: '+t).join(' | ')+'. Your last response was: "'+aiText+'". Respond as '+persona.name+' - react specifically to what they just said, do NOT repeat your last response:'}]
      })})
      const data = await res.json()
      // Handle both direct text and error responses
      const rawReply = data.content?.[0]?.text || data.content?.[0]?.message || null
      // Per-persona fallbacks  -  never generic
      const personaFallbacks = {
        dave:    "Look, I already showed you the TrueCar price. Are you going to match it or not?",
        linda:   "I appreciate that but I really need more time to think this through.",
        mike:    "I hear what you're saying but I still need that payment under four-fifty.",
        gary:    "My truck is worth more than what you're telling me. I know what I paid for it.",
        carol:   "That sounds reasonable but I'd still want to check online before I decide.",
        frank:   "Every time I come in here there's something new that needs fixing. How do I know this is real?",
        barbara: "I still don't understand why your price is so much higher than my cousin's shop.",
        ray:     "I hear you but Tony has been doing my cars for fifteen years. That's hard to walk away from.",
        susan:   "I really do need to call my husband before I can approve anything.",
        tom:     "I get it but honestly right now just isn't the right time for me.",
      }
      let reply = rawReply || personaFallbacks[persona?.id] || "I hear what you're saying but I'm going to need more than that."

      // Check if persona signals close earned
      const closeEarned = reply.includes('[CLOSE_EARNED]')
      reply = reply.replace('[CLOSE_EARNED]','').trim()

      setAiText(reply); setTranscript(''); setError('')
      setSilentCoach(null); setSilentLoading(true)
      getSilentCoach(savedTranscript, newEx-1, activeS)
      const pVoice = getPersonaVoiceOpts(persona)

      if(closeEarned || newEx>=MAX_EXCHANGES){
        // Rep earned the close or hit max  -  go to coaching
        setSpeaking(true)
        speak(reply, async ()=>{
          setSpeaking(false)
          await getFeedback(savedTranscript, updatedTranscripts, closeEarned)
        }, pVoice)
      } else {
        setSpeaking(true); speak(reply,()=>setSpeaking(false), pVoice)
      }
    }catch{setError('AI issue  -  type your next response.')}
    setLoading(false)
  }
  submitRef.current = submit  // keep ref current for auto-submit from stopRec

  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // VOICE DRILL ENGINE  -  proven components, clean flow
  // Uses existing startRec/stopRec + ElevenLabs + Claude
  // Persona speaks fully → mic auto-opens → silence auto-submits
  // ══════════════════════════════════════════════════════════

  const startLiveDrill = async (script, persona) => {
    setLiveError('')
    setLiveTranscript([])
    setExchangeCount(0)
    setLiveRecording(false)
    liveTranscriptRef.current = []
    setTranscript('')
    accumulatedRef.current = ''
    setLiveStatus('Getting into character...')

    // Use persona's pre-written opener — rich, natural, character-specific
    const fallbackOpener = (typeof persona.opener === 'function')
      ? persona.opener()
      : script.objection.replace(/"/g, '')
    
    // Show screen immediately with fallback - no waiting on API
    const first = [{ role: 'customer', text: fallbackOpener }]
    setLiveTranscript(first)
    liveTranscriptRef.current = first
    setAiText(fallbackOpener)
    setLivePhase('live')
    setLiveStatus('Listen to the customer...')

    // Speak fallback opener immediately
    const pVoice = getPersonaVoiceOpts(persona)
    setSpeaking(true)
    speak(fallbackOpener, () => {
      setSpeaking(false)
      setLiveStatus('Your turn  -  speak your response')
      setTimeout(() => { setLiveRecording(true); startRec() }, 600)
    }, pVoice)

    // Simultaneously try to get AI opener (will be used for exchange 2+ if opener already spoken)
    try {
      const res = await fetch('/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are ' + persona.name + '. ' + persona.tone + '. You just walked into a dealership and you have something on your mind.\n\nYour concern: ' + script.objection.replace(/"/g,'') + '\n\nSay what is on your mind naturally - like a real person walking in, not an actor. 1-2 sentences spoken out loud.',
          messages: [{ role: 'user', content: 'Walk in and say what is on your mind:' }],
          max_tokens: 80
        })
      })
      const data = await res.json()
      const aiOpener = data?.content?.[0]?.text?.trim()
      // Only use AI opener if it came back before speaking finished
      // (otherwise fallback is already playing - that is fine)
      if (aiOpener && aiOpener.length > 5 && liveTranscriptRef.current.length === 1 && speaking) {
        // Still on first exchange, update transcript with better opener
        const better = [{ role: 'customer', text: aiOpener }]
        liveTranscriptRef.current = better
      }
    } catch(e) {
      // Fallback already playing - no action needed
    }
  }

  const endLiveDrill = async (script, transcriptSnapshot) => {
    if (livePhase === 'ended') return
    try { stopRec() } catch {}
    stopSpeaking()
    setLivePhase('ended')
    setLiveRecording(false)
    setLiveStatus('Generating your coaching report...')

    const transcript = (transcriptSnapshot && transcriptSnapshot.length > 0)
      ? transcriptSnapshot
      : liveTranscriptRef.current

    if (!transcript || transcript.length === 0) {
      setLivePhase('idle')
      setLiveError('Not enough conversation captured. Try again.')
      setTimeout(() => setLiveError(''), 4000)
      return
    }

    const repLines = transcript.filter(t => t.role === 'rep').map(t => t.text)
    if (repLines.length === 0) {
      setLivePhase('idle')
      setLiveError('No rep responses captured. Speak clearly and try again.')
      setTimeout(() => setLiveError(''), 4000)
      return
    }

    const persona   = PERSONAS.find(p => p.id === activePersId) || getPersonaForScript(script)
    const lastRep   = repLines[repLines.length - 1]
    const fullConvo = transcript.map(t =>
      (t.role === 'rep' ? 'Rep' : (persona?.name || 'Customer')) + ': "' + t.text + '"'
    ).join(' | ')

    try {
      await getFeedback(lastRep, [fullConvo])
    } catch(e) {
      setLivePhase('idle')
      setLiveError('Report failed  -  try again.')
      setPhase('list')
    }
  }

  const stopLiveDrill = () => {
    try { stopRec() } catch {}
    stopSpeaking()
    setLivePhase('idle')
    setLiveTranscript([])
    setLiveRecording(false)
    setLiveStatus('')
    setLiveError('')
    setTranscript('')
    setExchangeCount(0)
    liveTranscriptRef.current = []
  }

    // ── REBUILT GRADING ENGINE  -  Mathematical ACRA scoring ───────
  const getFeedback = async (lastResp, allResps, earnedClose=false) => {
    setLoading(true); setError(''); stopSpeaking(); setSilentCoach(null)
    setCloseEarnedFlag(earnedClose)
    const fullConversation = allResps.join(' | ')
    const persona = PERSONAS.find(p=>p.id===activePersId)||getPersonaForScript(activeS)
    // Confidence score  -  lower hesitation = higher confidence
    const totalHesitations = confidenceFlags.reduce((a,b)=>a+b,0)
    const avgHesitation = confidenceFlags.length>0?(totalHesitations/confidenceFlags.length):0
    const confidenceScore = Math.max(0,Math.round(10-(avgHesitation*3)))

    const systemPrompt = [
      "You are a brutally honest automotive sales coach. Grade this manager's objection handling using mathematical ACRA scoring.",
      "",
      "CUSTOMER PERSONA: " + persona.name + "  -  " + persona.desc + " Tone: " + persona.tone + ".",
      "OBJECTION: \"" + activeS.objection + "\"",
      "DEPT: " + activeS.dept + " | CATEGORY: " + activeS.category,
      "",
      "SITUATION: " + activeS.situation,
      "COMMON MISTAKE (earns D or F): " + activeS.mistake,
      "MODEL WORD TRACK (what A looks like): \"" + activeS.script + "\"",
      "FOLLOW-UP CLOSE: \"" + activeS.followup + "\"",
      "",
      "MATHEMATICAL SCORING  -  score each step 0 to 4:",
      "- ACKNOWLEDGE (0-4): 0=ignored, 1=rushed past, 2=generic, 3=good mirror, 4=exact words + validated emotion",
      "- CLARIFY (0-4): 0=none, 1=vague, 2=attempted but weak, 3=one clear diagnostic question, 4=precise diagnosis that reframes the objection",
      "- RESPOND (0-4): 0=generic/defensive, 1=some value, 2=decent pivot, 3=specific dealership advantage, 4=connects directly to customer's stated concern",
      "- ADVANCE (0-4): 0=no close, 1=weak/open ended, 2=soft close, 3=direct yes/no question, 4=decisive commitment question that requires an answer",
      "",
      "GRADE FROM MATH:",
      "- 14-16 = A+, 12-13 = A, 10-11 = B+, 8-9 = B, 6-7 = C+, 4-5 = C, 2-3 = D, 0-1 = F",
      "",
      "IMPORTANT: If they made the common mistake (" + activeS.mistake.substring(0,60) + "...)  -  cap the grade at D regardless of other scores.",
      "",
      "RETURN ONLY valid JSON:",
      "{\"ack_score\":3,\"clar_score\":2,\"resp_score\":3,\"adv_score\":1,\"total\":9,\"score\":\"B\",\"score_detail\":\"B  -  [one sharp sentence]\",\"acknowledge\":\"[specific feedback]\",\"clarify\":\"[diagnosis feedback]\",\"respond\":\"[pivot feedback]\",\"advance\":\"[close feedback]\",\"improvement\":\"[word-for-word script tailored to " + persona.name + " - min 3 sentences, all 4 ACRA steps]\"}"
    ].join("\n")

    try {
      const res = await fetch('/ai-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        system: systemPrompt,
        messages:[{role:'user',content:"Salesperson responses across 3 exchanges: \"" + fullConversation + "\"\nFinal response: \"" + lastResp + "\"\nReturn ONLY the JSON:"}]
      })})
      const data = await res.json()
      const raw  = data.content?.[0]?.text||''
      try {
        const p = JSON.parse(raw.replace(/\x60\x60\x60json|\x60\x60\x60/g,'').trim())
        if (p.score&&p.improvement) {
          setFeedback(p); setPhase('feedback')
          setTimeout(()=>setLivePhase('idle'), 100)
          // Spoken feedback  -  short and punchy
          const spoken = "Grade " + p.score + ". " + p.acknowledge + " " + p.advance
          setSpeaking(true); speak(spoken,()=>setSpeaking(false))
          setLoading(false); return
        }
      } catch {}
    } catch {}

    // Fallback
    setFeedback({
      ack_score:'-',clar_score:'-',resp_score:'-',adv_score:'-',total:'-',
      score:'C', score_detail:'C  -  Evaluation incomplete. Review the model word track.',
      acknowledge:'Compare your opening to the model  -  did you mirror the customer?',
      clarify:'Did you ask a clarifying question before pitching?',
      respond:'Review the model word track for the specific value pivot.',
      advance:'Did you end with a direct yes/no commitment question?',
      improvement: activeS.script + ' ' + activeS.followup
    })
    setPhase('feedback')
    setTimeout(()=>setLivePhase('idle'), 100)
    setLoading(false)
  }

  const exportFeedbackPDF = () => {
    if(!feedback||!activeS) return
    const persona = PERSONAS.find(p=>p.id===activePersId)
    const gClass = s=>s?.startsWith('A')?'grade-a':s?.startsWith('B')?'grade-b':(s?.startsWith('D')||s==='F')?'grade-d':'grade-c'
    const scoreBar = (val) => val==='-'?' - ':`${val}/4 ${'#'.repeat(Math.max(0,val))}${'░'.repeat(Math.max(0,4-val))}`
    printPDF(`Coaching Report  -  ${activeS.objection.replace(/"/g,'').substring(0,40)}`,`
      <h1>Voice Drill Coaching Report</h1>
      <div class="sub">${dealer?.repName||'Team Member'} · ${dealer?.dealerName||'Dealership'}</div>
      <div class="date">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      <div class="divider"></div>
      <h2>Performance Summary</h2>
      <div class="card">
        <div class="score-badge ${gClass(feedback.score)}">${feedback.score}</div>
        <div style="font-size:14px;color:#333;margin-bottom:8px;">${feedback.score_detail}</div>
        ${persona?`<div style="font-size:12px;color:#666;margin-bottom:4px;"><strong>Customer:</strong> ${persona.emoji} ${persona.name}  -  ${persona.desc}</div>`:''}
        <div style="font-size:13px;color:#666;"><strong>Objection:</strong> ${activeS.objection.replace(/"/g,'')}</div>
      </div>
      <h2>ACRA Mathematical Scores</h2>
      <div class="card" style="font-family:monospace;">
        <table style="width:100%;border-collapse:collapse;">
          ${[['Acknowledge',feedback.ack_score],['Clarify',feedback.clar_score],['Respond',feedback.resp_score],['Advance',feedback.adv_score]].map(([l,v])=>`
          <tr><td style="padding:5px 10px;font-weight:700;">${l}</td><td style="padding:5px 10px;color:#1a6bff;font-size:18px;font-weight:900;">${v}/4</td><td style="padding:5px 10px;color:#ccc;font-size:16px;">${'#'.repeat(Math.max(0,v))}${'░'.repeat(Math.max(0,4-v))}</td></tr>`).join('')}
          <tr style="border-top:2px solid #eee;"><td style="padding:8px 10px;font-weight:900;">TOTAL</td><td style="padding:8px 10px;font-size:20px;font-weight:900;color:#050d1f;" colspan="2">${feedback.total}/16</td></tr>
        </table>
      </div>
      <h2>Model Word Track</h2>
      <div class="word-track">${activeS.script} ${activeS.followup}</div>
      <h2>ACRA Coaching Breakdown</h2>
      ${[{label:'Acknowledge',content:feedback.acknowledge,cls:'blue'},{label:'Clarify',cls:'yellow',content:feedback.clarify},{label:'Respond',cls:'green',content:feedback.respond},{label:'Advance',cls:'red',content:feedback.advance}].map(({label,content,cls})=>`<div class="card ${cls}"><h3>${label}</h3><div class="val">${content}</div></div>`).join('')}
      <h2>Your Improvement Script</h2>
      <div class="card green"><h3>Use This Word Track Next Time${persona?`  -  Written for ${persona.name}`:''}</h3><div class="word-track">${feedback.improvement}</div></div>
      <div class="card red"><h3>Mistake to Avoid</h3><div class="val">${activeS.mistake}</div></div>
    `)
  }

  const logResult = result => {
    setLivePhase('idle')  // ensure live screen doesn't block list
    // Save best score per script for streak mode
    if(activeS&&feedback?.score){
      const bestKey = `5md-best-${activeS.id}`
      const prev = loadJSON(bestKey, null)
      const gradeOrder = ['A+','A','B+','B','C+','C','D','F']
      const prevIdx = prev ? gradeOrder.indexOf(prev) : 99
      const newIdx  = gradeOrder.indexOf(feedback.score)
      if(newIdx < prevIdx) saveJSON(bestKey, feedback.score)  // lower index = better grade
    }
    onLog({dept:activeS.dept,script:activeS.objection.replace(/"/g,''),result,notes:'Voice drill  -  AI coached',type:'voice'})
    setPhase('list'); setActiveS(null); stopSpeaking()
  }

  const gradeColor = s => s?.startsWith('A')?C.green:s?.startsWith('B')?C.blueBright:(s?.startsWith('D')||s==='F')?C.red:C.yellow

  // ── FEEDBACK SCREEN ──────────────────────────────────────────
  if(phase==='feedback'&&activeS&&feedback) {
    const persona = PERSONAS.find(p=>p.id===activePersId)
    return(
      <div style={{padding:'16px 16px 80px'}}>
        <button onClick={()=>{setPhase('list');setActiveS(null);stopSpeaking()}} style={{background:'none',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:'uppercase',padding:'6px 14px',borderRadius:6,cursor:'pointer',marginBottom:14}}>← Back</button>
        <PDFBtn onClick={exportFeedbackPDF} label="📄 Save Coaching Report PDF"/>

        {/* Grade + persona */}
        <div style={{background:'linear-gradient(135deg,rgba(184,255,60,0.08),rgba(184,255,60,0.03))',border:'1px solid rgba(184,255,60,0.25)',borderRadius:12,padding:16,marginBottom:14}}>
          {/* Close earned banner */}
          {closeEarnedFlag&&(
            <div style={{background:'linear-gradient(135deg,rgba(184,255,60,0.2),rgba(184,255,60,0.08))',border:'1px solid rgba(184,255,60,0.5)',borderRadius:8,padding:'8px 14px',marginBottom:12,textAlign:'center'}}>
              <div style={{fontFamily:fH,fontSize:13,fontWeight:900,color:C.green,letterSpacing:1}}>🏆 YOU EARNED THE CLOSE</div>
              <div style={{fontSize:11,color:C.lightText,marginTop:2}}>{persona?.name} was ready to move forward</div>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:64,height:64,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:`${gradeColor(feedback.score)}20`,border:`3px solid ${gradeColor(feedback.score)}`,fontFamily:fH,fontSize:26,fontWeight:900,color:gradeColor(feedback.score)}}>{feedback.score}</div>
              {activeS&&(()=>{
                const prev=loadJSON(`5md-best-${activeS.id}`,null)
                const gradeOrder=['A+','A','B+','B','C+','C','D','F']
                const prevIdx=prev?gradeOrder.indexOf(prev):99
                const newIdx=gradeOrder.indexOf(feedback.score)
                if(prev&&newIdx<prevIdx) return <div style={{position:'absolute',top:-6,right:-6,background:C.green,color:C.navy,fontFamily:fH,fontSize:8,fontWeight:900,padding:'2px 5px',borderRadius:100}}>NEW BEST</div>
                if(prev&&newIdx===prevIdx) return <div style={{position:'absolute',top:-6,right:-6,background:C.yellow,color:C.navy,fontFamily:fH,fontSize:8,fontWeight:900,padding:'2px 5px',borderRadius:100}}>MATCHED</div>
                return null
              })()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:fH,fontSize:13,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:2}}>🎯 Coaching Report</div>
              <div style={{fontSize:12,color:C.white,fontWeight:600,marginBottom:2}}>{activeS.objection.replace(/"/g,'')}</div>
              {feedback.score_detail&&<div style={{fontSize:11,color:C.gray}}>{feedback.score_detail}</div>}
              {persona&&<div style={{fontSize:11,color:C.yellow,marginTop:3}}>{persona.emoji} vs {persona.name}  -  {persona.desc}</div>}
              <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                <div style={{fontSize:10,color:C.gray}}>{allTranscripts.length} exchanges</div>
                {confidenceFlags.length>0&&(()=>{
                  const total=confidenceFlags.reduce((a,b)=>a+b,0)
                  const score=Math.max(0,Math.round(10-(total*2)))
                  const color=score>=8?C.green:score>=5?C.yellow:C.orange
                  return <div style={{fontFamily:fH,fontSize:10,fontWeight:700,color}}> · Confidence {score}/10</div>
                })()}
              </div>
            </div>
          </div>

          {/* Mathematical ACRA score bar */}
          <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'10px 12px',marginBottom:12}}>
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>ACRA Scores</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6}}>
              {[['A',feedback.ack_score,C.blueBright],['C',feedback.clar_score,C.yellow],['R',feedback.resp_score,C.green],['Adv',feedback.adv_score,'#ff6bbb']].map(([label,val,color])=>(
                <div key={label} style={{textAlign:'center'}}>
                  <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color,marginBottom:2}}>{label}</div>
                  <div style={{fontFamily:fH,fontSize:22,fontWeight:900,color,lineHeight:1}}>{val}</div>
                  <div style={{fontSize:9,color:C.gray}}>/4</div>
                  <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:100,marginTop:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.max(0,(val/4)*100)}%`,background:color,borderRadius:100}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:8,fontFamily:fH,fontSize:11,fontWeight:700,color:gradeColor(feedback.score)}}>
              Total: {feedback.total}/16
            </div>
          </div>

          {/* Model word track */}
          <div style={{background:'rgba(184,255,60,0.06)',border:'1px solid rgba(184,255,60,0.2)',borderLeft:`3px solid ${C.green}`,borderRadius:'0 8px 8px 0',padding:'10px 12px',marginBottom:12}}>
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:4}}>📋 Model Word Track</div>
            <div style={{fontSize:12,color:C.lightText,lineHeight:1.65,fontStyle:'italic'}}>{activeS.script}</div>
          </div>

          {/* ACRA breakdown */}
          {[{key:'acknowledge',label:'Acknowledge',icon:'👂',color:C.blueBright},{key:'clarify',label:'Clarify',icon:'🔍',color:C.yellow},{key:'respond',label:'Respond',icon:'💬',color:C.green},{key:'advance',label:'Advance',icon:'🎯',color:'#ff6bbb'}].map(({key,label,icon,color})=>(
            feedback[key]&&<div key={key} style={{background:`${color}08`,border:`1px solid ${color}22`,borderRadius:8,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color,marginBottom:4}}>{icon} {label}</div>
              <div style={{fontSize:12,color:C.lightText,lineHeight:1.65}}>{feedback[key]}</div>
            </div>
          ))}

          {/* Improvement script */}
          {feedback.improvement&&(
            <div style={{background:'rgba(26,107,255,0.1)',border:'1px solid rgba(26,107,255,0.2)',borderLeft:`3px solid ${C.blue}`,borderRadius:'0 8px 8px 0',padding:'12px 14px',marginBottom:12}}>
              <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.blueBright,marginBottom:6}}>💡 Use This Next Time{persona?`  -  Written for ${persona.name}`:''}</div>
              <div style={{fontSize:13,color:C.white,lineHeight:1.7,fontStyle:'italic'}}>{feedback.improvement}</div>
            </div>
          )}

          {/* Word track comparison  -  your best response vs model */}
          {allTranscripts.length>0&&activeS?.script&&(()=>{
            // Find the longest/best response (most words = most complete attempt)
            // For live drills allTranscripts contains full convo string  -  extract rep lines
            const repOnlyLines = allTranscripts.filter(t=>typeof t==='string'&&!t.startsWith(activeS?.situation?.substring(0,10)||'XXX'))
            const bestResp = repOnlyLines.reduce((a,b)=>b.split(' ').length>a.split(' ').length?b:a, allTranscripts[0]||'')
            const capped = bestResp.length>300 ? bestResp.substring(0,300)+'...' : bestResp
            return(
              <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:12}}>
                <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:10}}>📊 Your Best Response vs Model</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.yellow,marginBottom:6}}>Your Best Response</div>
                  <div style={{background:'rgba(255,201,71,0.06)',border:'1px solid rgba(255,201,71,0.15)',borderRadius:6,padding:'8px 10px',fontSize:12,color:C.lightText,lineHeight:1.65,fontStyle:'italic'}}>"{capped}"</div>
                </div>
                <div>
                  <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green,marginBottom:6}}>Model Script</div>
                  <div style={{background:'rgba(184,255,60,0.06)',border:'1px solid rgba(184,255,60,0.2)',borderRadius:6,padding:'8px 10px',fontSize:12,color:C.white,lineHeight:1.65,fontStyle:'italic'}}>"{activeS.script}"</div>
                  <div style={{background:'rgba(184,255,60,0.04)',border:'1px solid rgba(184,255,60,0.1)',borderRadius:6,padding:'6px 10px',marginTop:6,fontSize:11,color:C.gray,lineHeight:1.5,fontStyle:'italic'}}>Follow-up close: "{activeS.followup}"</div>
                </div>
              </div>
            )
          })()}

          {/* Mistake reminder */}
          <div style={{background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:8,padding:'10px 12px',marginBottom:14}}>
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.red,marginBottom:4}}>⚠ Mistake to Avoid</div>
            <div style={{fontSize:12,color:'#ffaaaa',lineHeight:1.6}}>{activeS.mistake}</div>
          </div>

          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:8}}>Log your result:</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {SCORES.map(({val,label,color})=>(
              <button key={val} onClick={()=>logResult(val)} style={{padding:'10px 4px',borderRadius:8,border:`1px solid ${color}44`,background:`${color}15`,color,fontFamily:fH,fontWeight:900,fontSize:12,letterSpacing:.5,textTransform:'uppercase',cursor:'pointer'}}>{label}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>launch(activeS,activePersId)} style={{width:'100%',background:'rgba(26,107,255,0.15)',border:'1px solid rgba(26,107,255,0.3)',color:C.blueBright,fontFamily:fH,fontWeight:900,fontSize:14,letterSpacing:1,textTransform:'uppercase',padding:12,borderRadius:8,cursor:'pointer',marginBottom:8}}>🔁 Drill Again  -  Same Persona</button>
        <button onClick={()=>launch(activeS,null)} style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:'uppercase',padding:10,borderRadius:8,cursor:'pointer'}}>🎲 New Persona  -  Same Script</button>
      </div>
    )
  }

  // ── VOICE DRILL SCREEN  -  auto-record, ElevenLabs + Claude ─
  if((livePhase==='connecting'||livePhase==='live'||livePhase==='ended')&&activeS) {
    const persona = PERSONAS.find(p=>p.id===activePersId)||getPersonaForScript(activeS)
    return(
      <div style={{padding:'16px 16px 80px'}}>

        {/* Header status */}
        <div style={{background:livePhase==='connecting'?'rgba(255,201,71,0.1)':livePhase==='live'?'rgba(255,77,77,0.1)':'rgba(184,255,60,0.08)',border:`1px solid ${livePhase==='connecting'?'rgba(255,201,71,0.3)':livePhase==='live'?'rgba(255,77,77,0.3)':'rgba(184,255,60,0.25)'}`,borderRadius:12,padding:'14px 16px',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <span style={{fontSize:32}}>{persona?.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:fH,fontSize:11,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:3,color:livePhase==='connecting'?C.yellow:livePhase==='live'?C.red:C.green}}>
                {livePhase==='connecting'?'🔄 Connecting to AI customer...':livePhase==='live'?'🔴 Live  -  Just speak naturally':'✅ Session complete'}
              </div>
              <div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1}}>{persona?.name}</div>
              <div style={{fontSize:11,color:C.gray,marginTop:2}}>{activeS.objection.replace(/"/g,'')}</div>
            </div>
            {livePhase==='live'&&<div style={{fontFamily:fH,fontSize:22,fontWeight:900,color:C.gray,flexShrink:0}}>{exchangeCount}<span style={{fontSize:11,color:C.gray}}> ex</span></div>}
          </div>
          {livePhase==='live'&&(
            <div style={{background:liveRecording?'rgba(255,77,77,0.1)':speaking?'rgba(26,107,255,0.1)':'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:liveRecording?C.red:C.blue,flexShrink:0,animation:'livepulse 1s infinite'}}/>
              {liveRecording
                ? <span style={{fontSize:12,color:C.lightText}}>Listening  -  speak now. Auto-sends after silence.</span>
                : speaking
                  ? <span style={{fontSize:12,color:C.lightText}}>{persona?.name} is speaking  -  listen carefully.</span>
                  : <span style={{fontSize:12,color:C.gray}}>Preparing response...</span>
              }
            </div>
          )}
          {liveStatus&&<div style={{fontSize:12,color:C.yellow,marginTop:8}}>{liveStatus}</div>}
          {liveError&&<div style={{background:'rgba(255,77,77,0.1)',border:'1px solid rgba(255,77,77,0.3)',borderRadius:8,padding:'10px 12px',fontSize:12,color:C.red,marginTop:8}}>{liveError}<br/><span style={{fontSize:11,color:C.gray}}>Check that OPENAI_API_KEY is set in Cloudflare env vars.</span></div>}
        </div>

        {/* Live transcript  -  auto-scrolls */}
        <div id="live-transcript-box" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14,minHeight:200,maxHeight:380,overflowY:'auto'}}>
          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:10}}>Live Conversation</div>
          {liveTranscript.length===0&&(
            <div style={{fontSize:12,color:C.gray,fontStyle:'italic',textAlign:'center',padding:'30px 0'}}>
              {livePhase==='connecting'?'Connecting...':livePhase==='live'?`${persona?.name} is about to speak...`:'No transcript recorded.'}
            </div>
          )}
          {liveTranscript.map((t,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:t.role==='rep'?C.green:C.yellow,marginBottom:3}}>
                {t.role==='rep'?'You':persona?.name}
              </div>
              <div style={{background:t.role==='rep'?'rgba(184,255,60,0.06)':'rgba(255,201,71,0.06)',border:`1px solid ${t.role==='rep'?'rgba(184,255,60,0.15)':'rgba(255,201,71,0.15)'}`,borderRadius:8,padding:'8px 12px',fontSize:13,color:C.white,lineHeight:1.6,fontStyle:'italic'}}>
                "{t.text}"
              </div>
            </div>
          ))}
        </div>

        {/* Script reference  -  collapsed by default */}
        <div style={{background:'rgba(184,255,60,0.04)',border:'1px solid rgba(184,255,60,0.15)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:4}}>📋 Model Script Reference</div>
          <div style={{fontSize:12,color:C.lightText,lineHeight:1.6,fontStyle:'italic'}}>{activeS.script}</div>
        </div>

        {/* ── RECORDING / ACTION AREA ── */}
        {livePhase==='live'&&(
          <>
            {/* Transcript preview of what was captured */}
            {transcript&&liveRecording&&(
              <div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',marginBottom:10,fontSize:13,color:C.lightText,fontStyle:'italic'}}>
                "{transcript}"
              </div>
            )}

            {/* Send Now button  -  always visible when recording */}
            {liveRecording&&(
              <button onClick={()=>{ if(submitRef.current) submitRef.current() }} style={{width:'100%',background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:16,letterSpacing:1,textTransform:'uppercase',padding:16,borderRadius:10,border:'none',cursor:'pointer',marginBottom:10,boxShadow:'0 0 30px rgba(184,255,60,0.3)'}}>
                Send Now
              </button>
            )}

            {/* End session */}
            <button onClick={()=>endLiveDrill(activeS,liveTranscript)} style={{width:'100%',background:'transparent',border:`1px solid rgba(255,77,77,0.25)`,color:'rgba(255,77,77,0.6)',fontFamily:fH,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:'uppercase',padding:9,borderRadius:8,cursor:'pointer',marginBottom:8}}>
              End  -  Get Coaching Report
            </button>
          </>
        )}
        <button onClick={stopLiveDrill} style={{width:'100%',background:'transparent',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:'uppercase',padding:9,borderRadius:8,cursor:'pointer'}}>
          Cancel  -  Back to Drills
        </button>
        {livePhase==='ended'&&<div style={{textAlign:'center',padding:'16px 0',fontSize:13,color:C.green}}>Generating coaching report...</div>}

        <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    )
  }

  // ── DRILL LIST  -  with Persona selector ──────────────────────
  return(
    <div style={{padding:'16px 16px 80px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <div style={{fontFamily:fH,fontSize:28,fontWeight:900,textTransform:'uppercase',color:C.white}}>Voice Drill</div>
        <button onClick={()=>setShowPersonas(p=>!p)} style={{background:showPersonas?'rgba(255,201,71,0.15)':'rgba(255,255,255,0.06)',border:`1px solid ${showPersonas?'rgba(255,201,71,0.4)':C.border}`,color:showPersonas?C.yellow:C.gray,fontFamily:fH,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:'uppercase',padding:'6px 12px',borderRadius:6,cursor:'pointer'}}>
          👥 Personas {showPersonas?'▲':'▼'}
        </button>
      </div>
      <div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>AI Customer · Silent Coach · ACRA Grading</div>

      {/* Persona browser */}
      {showPersonas&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.yellow,marginBottom:10}}>👥 Customer Personas</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {PERSONAS.map(p=>(
              <div key={p.id} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{p.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:1}}>
                    <span style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:C.white}}>{p.name}</span>
                    <Tag color={p.dept==='sales'?C.blue:C.green}>{p.dept}</Tag>
                  </div>
                  <div style={{fontSize:11,color:C.gray}}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!supported&&<div style={{fontSize:12,color:C.yellow,marginBottom:10}}>⚠ Use Chrome or Edge for voice input.</div>}
      <ScriptFilterBar dept={filterDept} setDept={setFilterDept} cat={cat} setCat={setCat} search={search} setSearch={setSearch} lockDept={lockDept}/>
      <div style={{fontSize:12,color:C.gray,marginBottom:10}}>{filtered.length} drills</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map(s=>{
          const matchPersona = getPersonaForScript(s)
          return(
            <div key={s.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:s.dept==='sales'?'rgba(26,107,255,0.35)':'rgba(184,255,60,0.35)',minWidth:30,lineHeight:1}}>{String(s.id).padStart(2,'0')}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1,marginBottom:3}}>{s.objection.replace(/"/g,'')}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <Tag color={s.dept==='sales'?C.blue:C.green}>{s.dept}</Tag>
                  <span style={{fontSize:10,color:C.gray}}>{s.category}</span>
                  <span style={{fontSize:10,color:C.yellow}}>{matchPersona.emoji} {matchPersona.name}</span>
                  {(()=>{const best=loadJSON(`5md-best-${s.id}`,null);return best?<span style={{fontFamily:fH,fontSize:10,fontWeight:700,color:best.startsWith('A')?C.green:best.startsWith('B')?C.blueBright:C.yellow}}>Best: {best}</span>:null})()}
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={()=>{
                  const p=getPersonaForScript(s)
                  setActiveS(s); setActivePersId(p.id)
                  setFeedback(null); setConfidenceFlags([]); setCloseEarnedFlag(false)
                  setLiveTranscript([]); liveTranscriptRef.current=[]; setExchangeCount(0)
                  setLivePhase('connecting')
                  setTimeout(()=>startLiveDrill(s,p), 150)
                }} style={{background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:12,letterSpacing:1,textTransform:'uppercase',padding:'10px 14px',borderRadius:8,border:'none',cursor:'pointer',flexShrink:0}}>🎙 Start Live Drill</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )


// ══════════════════════════════════════════════════════════════
// HUDDLE TIMER  -  Now accepts preloadScript from Home button
// ══════════════════════════════════════════════════════════════

}
// ── Huddle Attendance + Completion Component ─────────────────
function HuddleComplete({selScript,dealer,onLog,onNew}) {
  const [attended,setAttended] = useState({})
  const [dashData,setDashData] = useState(null)
  const [step,setStep]         = useState('attendance') // attendance | result

  useEffect(()=>{
    if(dealer?.dealerId){
      dealerSync('getDashboard',dealer.dealerId,'').then(res=>{
        if(res&&!res.error) setDashData(res)
      })
    }
  },[])

  // Get enrolled reps from KV
  const reps = dashData
    ? [...new Set((dashData.activities||[]).map(a=>a.repName))].filter(Boolean)
    : dealer?.repName ? [dealer.repName] : []

  const toggleRep = name => setAttended(p=>({...p,[name]:!p[name]}))
  const attendedReps = reps.filter(r=>attended[r])

  const logResult = result => {
    // Log huddle for each attending rep
    attendedReps.forEach(rep=>{
      dealerSync('logActivity',dealer.dealerId,rep,{
        type:'huddle',
        script:selScript?.objection.replace(/"/g,'')||'',
        result,
        dept:selScript?.dept||'sales',
        attended:true,
      })
    })
    // Log non-attendees with 'absent' flag for Coach Now algorithm
    reps.filter(r=>!attended[r]).forEach(rep=>{
      dealerSync('logActivity',dealer.dealerId,rep,{
        type:'huddle_absent',
        script:selScript?.objection.replace(/"/g,'')||'',
        dept:selScript?.dept||'sales',
        attended:false,
      })
    })
    onLog(result)
  }

  if(step==='attendance') return(
    <div style={{padding:'16px 16px 80px',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:10}}>✅</div>
      <div style={{fontFamily:fH,fontSize:26,fontWeight:900,textTransform:'uppercase',color:C.green,marginBottom:4}}>Huddle Complete!</div>
      <div style={{fontSize:13,color:C.lightText,marginBottom:16}}>Who attended? Tap each rep that was present.</div>

      {/* Script used */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',marginBottom:14,textAlign:'left'}}>
        <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:3}}>Script Used</div>
        <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white}}>{selScript?.objection.replace(/"/g,'')}</div>
      </div>

      {/* Attendance checklist */}
      {reps.length>0 ? (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14,textAlign:'left'}}>
          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:10}}>👥 Attendance</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {reps.map(rep=>(
              <div key={rep} onClick={()=>toggleRep(rep)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,background:attended[rep]?'rgba(184,255,60,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${attended[rep]?'rgba(184,255,60,0.3)':C.border}`,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:attended[rep]?C.green:'rgba(255,255,255,0.08)',border:`2px solid ${attended[rep]?C.green:C.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                  {attended[rep]&&<span style={{fontSize:12,color:C.navy,fontWeight:900}}>✓</span>}
                </div>
                <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:attended[rep]?C.white:C.gray}}>{rep}</div>
                {attended[rep]&&<div style={{marginLeft:'auto',fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green}}>Present</div>}
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:11,color:C.gray,textAlign:'center'}}>
            {attendedReps.length} of {reps.length} marked present
          </div>
        </div>
      ):(
        <div style={{background:'rgba(26,107,255,0.08)',border:'1px solid rgba(26,107,255,0.2)',borderRadius:10,padding:'12px 14px',marginBottom:14,fontSize:12,color:C.gray}}>
          No reps found yet. Log some drills first to populate attendance.
        </div>
      )}

      <button onClick={()=>setStep('result')} style={{width:'100%',background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:15,letterSpacing:1,textTransform:'uppercase',padding:14,borderRadius:10,border:'none',cursor:'pointer',marginBottom:10}}>
        Next  -  Rate the Huddle →
      </button>
      <button onClick={()=>setStep('result')} style={{width:'100%',background:'transparent',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:'uppercase',padding:10,borderRadius:8,cursor:'pointer'}}>
        Skip Attendance
      </button>
    </div>
  )

  return(
    <div style={{padding:'16px 16px 80px',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:10}}>🎯</div>
      <div style={{fontFamily:fH,fontSize:22,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>How did the team handle it?</div>
      {attendedReps.length>0&&<div style={{fontSize:12,color:C.green,marginBottom:16}}>{attendedReps.length} rep{attendedReps.length>1?'s':''} marked present</div>}
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
        {SCORES.map(({val,label,color})=>(
          <button key={val} onClick={()=>logResult(val)} style={{padding:14,borderRadius:10,border:`1px solid ${color}44`,background:`${color}15`,color,fontFamily:fH,fontWeight:900,fontSize:16,letterSpacing:1,textTransform:'uppercase',cursor:'pointer'}}>{label}</button>
        ))}
      </div>
      <button onClick={onNew} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:13,letterSpacing:1,textTransform:'uppercase',padding:12,borderRadius:8,cursor:'pointer'}}>New Huddle</button>
    </div>
  )
}

function HuddleTimer({onLog,dealer,preloadScript,onClearPreload}) {
  const dept     = roleDept(dealer?.role||'both')
  const lockDept = dept==='both'?null:dept
  const [filterDept,setFilterDept] = useState(lockDept||'all')
  const [cat,setCat]   = useState('all')
  const [search,setSearch] = useState('')
  const [phase,setPhase]   = useState('setup')
  const [selScript,setSelScript] = useState(null)
  const [timeLeft,setTimeLeft]   = useState(TOTAL_H)
  const [running,setRunning]     = useState(false)
  const intRef = useRef(null)

  // Preload script from Home "Team Huddle" button
  useEffect(()=>{
    if(preloadScript){ setSelScript(preloadScript); onClearPreload&&onClearPreload() }
  },[preloadScript])

  const getStep  = elapsed => { let s=0; for(let i=STEP_STARTS.length-1;i>=0;i--){if(elapsed>=STEP_STARTS[i]){s=i;break}} return s }
  const elapsed  = TOTAL_H-timeLeft; const step = getStep(elapsed)
  const col      = SCOLS[step]; const stepData = STEPS[step]
  const circ     = 2*Math.PI*80; const pct = elapsed/TOTAL_H
  const fmt      = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const showScriptForStep = step===1||step===2

  useEffect(()=>{
    if(!running) return
    intRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){clearInterval(intRef.current);setRunning(false);setPhase('done');return 0}return t-1})
    },1000)
    return ()=>clearInterval(intRef.current)
  },[running])

  const startHuddle = () => { if(!selScript)return; setPhase('running'); setTimeLeft(TOTAL_H); setRunning(false) }
  const skipStep    = () => { if(step<STEPS.length-1){setTimeLeft(TOTAL_H-STEP_STARTS[step+1])}else{clearInterval(intRef.current);setRunning(false);setPhase('done')} }

  const logResult = result => {
    // KV sync handled by App root logResult
    onLog({dept:selScript.dept,script:selScript.objection.replace(/"/g,''),result,notes:'Huddle drill',type:'huddle'})
    setPhase('setup'); setSelScript(null); setTimeLeft(TOTAL_H); setRunning(false)
  }

  const filtered = SCRIPTS.filter(s=>{
    const ed=lockDept||filterDept
    if(ed!=='all'&&s.dept!==ed) return false
    if(cat!=='all'&&s.category!==cat) return false
    if(search&&!s.objection.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if(phase==='done') return(
    <HuddleComplete
      selScript={selScript}
      dealer={dealer}
      onLog={logResult}
      onNew={()=>{setPhase('setup');setSelScript(null);setTimeLeft(TOTAL_H);setRunning(false)}}
    />
  )

  if(phase==='running') return(
    <div style={{padding:'16px 16px 80px'}}>
      <div style={{display:'flex',gap:4,marginBottom:14}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:5,borderRadius:100,background:i<step?SCOLS[i]:i===step?col:'rgba(255,255,255,0.1)',transition:'all 0.4s'}}/>)}</div>
      <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:10,marginBottom:14}}>
        {STEPS.map((s,i)=>(
          <div key={i} style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 10px',borderRadius:8,border:`1px solid ${i===step?SCOLS[i]+'55':C.border}`,background:i===step?`${SCOLS[i]}22`:'rgba(255,255,255,0.03)',opacity:i<step?0.5:i===step?1:0.7,transform:i===step?'scale(1.05)':'scale(1)',transition:'all 0.4s'}}>
            <div style={{fontSize:16}}>{s.icon}</div>
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:i===step?SCOLS[i]:C.gray,whiteSpace:'nowrap'}}>{s.label.split(' ').slice(0,2).join(' ')}</div>
            <div style={{fontFamily:fH,fontSize:10,fontWeight:900,color:i===step?SCOLS[i]:C.gray}}>{s.time}s</div>
          </div>
        ))}
      </div>
      <div style={{background:`${col}18`,border:`1px solid ${col}44`,borderRadius:12,padding:16,marginBottom:14,transition:'all 0.4s'}}>
        <div style={{fontSize:28,marginBottom:8}}>{stepData.icon}</div>
        <div style={{fontFamily:fH,fontSize:22,fontWeight:900,textTransform:'uppercase',color:col,marginBottom:6}}>{stepData.label}</div>
        <div style={{fontSize:13,color:C.lightText,lineHeight:1.65,opacity:.85}}>{stepData.desc}</div>
      </div>
      {showScriptForStep&&selScript&&<ScriptCard script={selScript} mode='scriptonly' defaultOpen={true}/>}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:16}}>
        <div style={{position:'relative',width:190,height:190}}>
          <svg width="190" height="190" style={{transform:'rotate(-90deg)'}}>
            <circle cx="95" cy="95" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
            <circle cx="95" cy="95" r="80" fill="none" stroke={col} strokeWidth="12" strokeDasharray={circ} strokeDashoffset={circ-pct*circ} strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear,stroke 0.4s'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontFamily:fH,fontSize:48,fontWeight:900,color:col,lineHeight:1,transition:'color 0.4s'}}>{fmt(timeLeft)}</div>
            <div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginTop:4}}>Step {step+1} of {STEPS.length}</div>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <button onClick={()=>{if(running){clearInterval(intRef.current);setRunning(false)}else setRunning(true)}} style={{background:running?C.yellow:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:14,letterSpacing:1,textTransform:'uppercase',padding:'10px 24px',borderRadius:8,border:'none',cursor:'pointer'}}>
          {running?'⏸ Pause':timeLeft===TOTAL_H?'▶ Start':'▶ Resume'}
        </button>
        <button onClick={skipStep} style={{background:'rgba(255,255,255,0.05)',color:C.gray,fontFamily:fH,fontWeight:900,fontSize:14,letterSpacing:1,textTransform:'uppercase',padding:'10px 24px',borderRadius:8,border:`1px solid ${C.border}`,cursor:'pointer'}}>Skip →</button>
      </div>
    </div>
  )

  return(
    <div style={{padding:'16px 16px 80px'}}>
      <div style={{fontFamily:fH,fontSize:28,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Team Huddle</div>
      <div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>5-Minute Daily Team Drill</div>
      {selScript&&(
        <div style={{background:'rgba(184,255,60,0.08)',border:'1px solid rgba(184,255,60,0.3)',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green}}>Pre-selected</div>
          <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white,flex:1}}>{selScript.objection.replace(/"/g,'')}</div>
          <div style={{color:C.green,fontSize:16}}>✓</div>
        </div>
      )}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span>⏱</span><span style={{fontFamily:fH,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.white}}>The 5-Minute Framework</span></div>
        {STEPS.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:i<4?10:0}}>
            <div style={{background:`${SCOLS[i]}22`,border:`1px solid ${SCOLS[i]}44`,borderRadius:100,padding:'3px 7px',fontFamily:fH,fontSize:10,fontWeight:900,color:SCOLS[i],minWidth:32,textAlign:'center',flexShrink:0}}>{s.time}s</div>
            <div><div style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:SCOLS[i],marginBottom:1}}>{s.icon} {s.label}</div><div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>{s.desc}</div></div>
          </div>
        ))}
      </div>
      <div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>Pick Today's Script</div>
      <ScriptFilterBar dept={filterDept} setDept={setFilterDept} cat={cat} setCat={setCat} search={search} setSearch={setSearch} lockDept={lockDept}/>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16,maxHeight:300,overflowY:'auto'}}>
        {filtered.map(s=>(
          <div key={s.id} onClick={()=>setSelScript(s)} style={{background:selScript?.id===s.id?(s.dept==='sales'?'rgba(26,107,255,0.12)':'rgba(184,255,60,0.08)'):C.card,border:`1px solid ${selScript?.id===s.id?(s.dept==='sales'?'rgba(26,107,255,0.4)':'rgba(184,255,60,0.35)'):C.border}`,borderRadius:8,padding:'10px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:s.dept==='sales'?'rgba(26,107,255,0.4)':'rgba(184,255,60,0.4)',minWidth:26}}>{String(s.id).padStart(2,'0')}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1.1,marginBottom:2}}>{s.objection.replace(/"/g,'')}</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}><Tag color={s.dept==='sales'?C.blue:C.green}>{s.dept}</Tag><span style={{fontSize:10,color:C.gray,alignSelf:'center'}}>{s.category}</span></div>
            </div>
            {selScript?.id===s.id&&<div style={{color:C.green,fontSize:16}}>✓</div>}
          </div>
        ))}
      </div>
      <button onClick={startHuddle} disabled={!selScript} style={{width:'100%',background:selScript?C.green:'rgba(255,255,255,0.08)',color:selScript?C.navy:C.gray,fontFamily:fH,fontWeight:900,fontSize:16,letterSpacing:1,textTransform:'uppercase',padding:16,borderRadius:10,border:'none',cursor:selScript?'pointer':'default'}}>
        {selScript?'▶ Start 5-Minute Huddle':'Select a script to start'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// TRACK & DASHBOARD  -  Rebuilt
// Managers: 3 zones (Health Bar, Who Needs Attention, Activity Feed) + floating log
// Reps: personal stats + team rank
// ══════════════════════════════════════════════════════════════
function QuickLogSheet({onLog,onClose,dealer}) {
  const [dept,setDept]   = useState(null)
  const [selObj,setSelObj] = useState(null)
  const [result,setResult] = useState(null)
  const [rep,setRep]     = useState('')
  const isMgr = isManager(dealer?.role||'sales_rep')

  const filteredScripts = dept ? SCRIPTS.filter(s=>s.dept===dept) : []

  const submit = () => {
    if(!dept||!selObj||!result) return
    onLog({dept,script:selObj.objection.replace(/"/g,''),result,notes:'Live win logged',type:'manual',rep:rep||dealer?.repName})
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)'}}/>
      <div style={{position:'relative',background:C.navyMid,borderRadius:'16px 16px 0 0',padding:'20px 16px 32px',border:`1px solid ${C.border}`,maxHeight:'85vh',overflowY:'auto'}}>
        {/* Handle */}
        <div style={{width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:100,margin:'0 auto 16px'}}/>
        <div style={{fontFamily:fH,fontSize:18,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Log a Live Win</div>
        <div style={{fontSize:12,color:C.gray,marginBottom:16}}>Used a script on the floor? Log it in 10 seconds.</div>

        {/* Step 1  -  Department */}
        <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>1. Department</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          {[{id:'sales',icon:'🏆',label:'Sales',color:C.blue},{id:'service',icon:'🔧',label:'Service',color:C.green}].map(d=>(
            <div key={d.id} onClick={()=>{setDept(d.id);setSelObj(null)}} style={{background:dept===d.id?`${d.color}20`:'rgba(255,255,255,0.04)',border:`2px solid ${dept===d.id?d.color:C.border}`,borderRadius:12,padding:'14px 12px',textAlign:'center',cursor:'pointer',transition:'all 0.15s'}}>
              <div style={{fontSize:28,marginBottom:4}}>{d.icon}</div>
              <div style={{fontFamily:fH,fontSize:14,fontWeight:900,textTransform:'uppercase',color:dept===d.id?d.color:C.gray}}>{d.label}</div>
            </div>
          ))}
        </div>

        {/* Step 2  -  Objection picker */}
        {dept && (
          <>
            <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>2. Script / Objection</div>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16,maxHeight:200,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:10,padding:'6px'}}>
              {filteredScripts.map(s=>(
                <div key={s.id} onClick={()=>setSelObj(s)} style={{background:selObj?.id===s.id?(dept==='sales'?'rgba(26,107,255,0.15)':'rgba(184,255,60,0.1)'):'transparent',border:`1px solid ${selObj?.id===s.id?(dept==='sales'?'rgba(26,107,255,0.4)':'rgba(184,255,60,0.3)'):'transparent'}`,borderRadius:8,padding:'9px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <div style={{fontFamily:fH,fontSize:13,fontWeight:900,color:dept==='sales'?'rgba(26,107,255,0.4)':'rgba(184,255,60,0.4)',minWidth:24}}>{String(s.id).padStart(2,'0')}</div>
                  <div style={{fontSize:12,color:selObj?.id===s.id?C.white:C.lightText,lineHeight:1.3}}>{s.objection.replace(/"/g,'')}</div>
                  {selObj?.id===s.id&&<div style={{marginLeft:'auto',color:C.green,flexShrink:0}}>✓</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 3  -  Result */}
        {selObj && (
          <>
            <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>3. Result</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
              {SCORES.map(({val,label,color})=>(
                <div key={val} onClick={()=>setResult(val)} style={{background:result===val?`${color}20`:'rgba(255,255,255,0.04)',border:`2px solid ${result===val?color:C.border}`,borderRadius:10,padding:'12px 6px',textAlign:'center',cursor:'pointer'}}>
                  <div style={{fontFamily:fH,fontSize:13,fontWeight:900,color:result===val?color:C.gray}}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 4  -  Rep name (managers only) */}
        {isMgr&&result&&(
          <>
            <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>4. Team Member (optional)</div>
            <input style={{...inp,marginBottom:16}} placeholder="Rep name  -  leave blank for yourself" value={rep} onChange={e=>setRep(e.target.value)}/>
          </>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={!dept||!selObj||!result} style={{width:'100%',background:dept&&selObj&&result?C.green:'rgba(255,255,255,0.08)',color:dept&&selObj&&result?C.navy:C.gray,fontFamily:fH,fontWeight:900,fontSize:16,letterSpacing:1,textTransform:'uppercase',padding:14,borderRadius:10,border:'none',cursor:dept&&selObj&&result?'pointer':'default'}}>
          {dept&&selObj&&result?'Log It →':'Complete steps above'}
        </button>
      </div>
    </div>
  )
}

function TrackDash({results,onRemove,onLog,preloadScript,dealer}) {
  const isMgr = isManager(dealer?.role||'sales_rep')
  const [dashData,setDashData]     = useState(null)
  const [dashLoading,setDashLoading] = useState(false)
  const [showLog,setShowLog]       = useState(false)

  // Load team data for managers
  useEffect(()=>{
    if(isMgr&&dealer?.dealerId){
      setDashLoading(true)
      dealerSync('getDashboard',dealer.dealerId,'').then(res=>{setDashData(res);setDashLoading(false)})
    }
  },[dealer?.dealerId])

  // preloadScript intentionally not used to auto-open sheet

  const won      = results.filter(r=>r.result==='won').length
  const progress = results.filter(r=>r.result==='progress').length
  const practice = results.filter(r=>r.result==='practice').length

  const exportDashPDF = () => {
    if(!dashData) return
    const acts  = dashData.activities||[]
    const reps  = [...new Set(acts.map(a=>a.repName))].filter(Boolean)
    const now   = new Date()
    const month = now.toLocaleDateString('en-US',{month:'long',year:'numeric'})
    const monthStart = new Date(now.getFullYear(),now.getMonth(),1).getTime()
    const monthActs  = acts.filter(a=>a.timestamp>=monthStart)
    const won_m = monthActs.filter(a=>a.result==='won'||a.result?.startsWith('A')||a.result?.startsWith('B')).length
    const monthWinRate = monthActs.length>0?Math.round((won_m/monthActs.length)*100):0

    const repRows = reps.map(rep=>{
      const ra  = acts.filter(a=>a.repName===rep)
      const rm  = monthActs.filter(a=>a.repName===rep)
      const won = ra.filter(a=>a.result==='won'||a.result?.startsWith('A')||a.result?.startsWith('B')).length
      const wr  = ra.length>0?Math.round((won/ra.length)*100):0
      const wrColor = wr>=60?'#2d8a2d':wr>=40?'#a07000':'#c03030'
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:700;">${rep}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${rm.length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${ra.length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:#1a6bff;">${ra.filter(a=>a.dept==='sales').length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:#5ca800;">${ra.filter(a=>a.dept==='service').length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:${wrColor};">${wr}%</td>
      </tr>`
    }).join('')

    const topScript = (() => {
      const sc = {}
      acts.forEach(a=>{ if(a.script){ sc[a.script]=(sc[a.script]||0)+1 }})
      return Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0]||' - '
    })()

    printPDF(`Monthly Report Card  -  ${month}`,`
      <h1>Monthly Dealer Report Card</h1>
      <div class="sub">${dashData.dealer?.name||dealer?.dealerName||'Dealership'} · Code: ${dealer?.dealerId}</div>
      <div class="date">${month}</div>
      <div class="divider"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="card" style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#1a6bff;">${monthActs.length}</div>
          <div class="label">Drills This Month</div>
        </div>
        <div class="card" style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#2d8a2d;">${monthWinRate}%</div>
          <div class="label">Win Rate</div>
        </div>
        <div class="card" style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#b8682d;">${monthActs.filter(a=>a.type==='huddle').length}</div>
          <div class="label">Huddles Completed</div>
        </div>
        <div class="card" style="text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#050d1f;">${reps.length}</div>
          <div class="label">Active Reps</div>
        </div>
      </div>

      <h2>Rep Performance</h2>
      ${repRows?`<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead><tr style="background:#f0f4ff;">
          <th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Rep</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">This Month</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">All Time</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#1a6bff;">Sales</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#5ca800;">Service</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#333;">Win Rate</th>
        </tr></thead>
        <tbody>${repRows}</tbody>
      </table>`:'<p style="color:#999;">No activity this month.</p>'}

      <h2>Top Objection Drilled</h2>
      <div class="card blue"><div style="font-size:14px;font-weight:700;">${topScript}</div></div>

      <h2>Recent Activity (Last 20)</h2>
      ${acts.slice(0,20).map(a=>`<div class="card"><div style="font-size:13px;font-weight:700;">${a.repName} <span style="font-size:11px;color:${a.dept==='sales'?'#1a6bff':'#5ca800'};font-weight:600;">[${(a.dept||'').toUpperCase()}]</span></div><div style="font-size:12px;color:#666;">${a.script}  -  ${new Date(a.timestamp).toLocaleDateString()}</div></div>`).join('')}
    `)
  }

  // ── MANAGER VIEW ──────────────────────────────────────────
  if(isMgr) {
    const acts     = dashData?.activities||[]
    const reps     = [...new Set(acts.map(a=>a.repName))].filter(Boolean)
    const weekAgo  = Date.now()-7*24*60*60*1000
    const weekActs = acts.filter(a=>a.timestamp>weekAgo)
    const won_t    = acts.filter(a=>a.result==='won').length
    const winRate  = acts.length>0?Math.round((won_t/acts.length)*100):0

    // Who needs attention  -  grade-weighted coaching priority algorithm
    const repStats = reps.map(rep=>{
      const ra   = acts.filter(a=>a.repName===rep)
      const wa   = weekActs.filter(a=>a.repName===rep)
      const last5 = ra.slice(0,5)
      const badGrades = last5.filter(a=>a.result==='practice'||a.result?.startsWith('D')||a.result==='F').length
      const winCount = ra.filter(a=>a.result==='won'||a.result?.startsWith('A')||a.result?.startsWith('B')).length
      const repWinRate = ra.length>0?Math.round((winCount/ra.length)*100):0
      const weekHuddled = wa.some(a=>a.type==='huddle'&&a.attended!==false)
      const weekAbsent  = wa.some(a=>a.type==='huddle_absent')
      // Coaching score  -  higher = more urgent coaching needed
      let coachScore = 0
      if(wa.length===0) coachScore += 40              // no activity this week
      if(repWinRate<40&&ra.length>=3) coachScore += 30 // low win rate
      if(badGrades>=2) coachScore += 20                // 2+ poor grades in last 5
      if(weekAbsent) coachScore += 20                  // confirmed absent from huddle
      else if(!weekHuddled&&wa.length>0) coachScore += 8 // drilling but no huddle recorded
      if(weekHuddled) coachScore = Math.max(0, coachScore - 20) // attended = credit
      // Recognize score  -  higher = more deserving of recognition
      let recogScore = 0
      if(wa.length>=3) recogScore += 30
      if(repWinRate>=60&&ra.length>=3) recogScore += 30
      if(wa.some(a=>a.result==='won'||a.result?.startsWith('A'))) recogScore += 20
      if(weekHuddled) recogScore += 20
      return{
        rep, total:ra.length, weekTotal:wa.length,
        won:winCount, repWinRate, badGrades,
        weekHuddled, coachScore, recogScore,
        sales:ra.filter(a=>a.dept==='sales').length,
        service:ra.filter(a=>a.dept==='service').length,
        coachReasons:[
          wa.length===0?'No activity this week':null,
          repWinRate<40&&ra.length>=3?`${repWinRate}% win rate`:null,
          badGrades>=2?`${badGrades} poor grades in last 5`:null,
          weekAbsent?'Absent from huddle this week':(!weekHuddled&&wa.length>0?'No huddle recorded':null),
        ].filter(Boolean)
      }
    }).sort((a,b)=>b.total-a.total)
    const topPerformers = [...repStats].sort((a,b)=>b.recogScore-a.recogScore).slice(0,2)
    const needsCoaching = [...repStats].filter(r=>r.coachScore>0).sort((a,b)=>b.coachScore-a.coachScore).slice(0,3)

    return(
      <div style={{padding:'16px 16px 100px',position:'relative'}}>
        {showLog&&<QuickLogSheet onLog={r=>{onLog(r);setShowLog(false)}} onClose={()=>setShowLog(false)} dealer={dealer}/>}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:fH,fontSize:26,fontWeight:900,textTransform:'uppercase',color:C.white}}>Dashboard</div>
          <div style={{display:'flex',gap:8}}>
            <PDFBtn onClick={exportDashPDF} label="📄 Monthly Report"/>
          </div>
        </div>

        {/* Dealer code pill */}
        <div style={{background:'rgba(184,255,60,0.08)',border:'1px solid rgba(184,255,60,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,flexShrink:0}}>Dealer Code</div>
          <div style={{fontFamily:fH,fontSize:22,fontWeight:900,letterSpacing:4,color:C.white,flex:1}}>{dealer?.dealerId}</div>
          <div style={{fontSize:11,color:C.gray}}>Share with team</div>
        </div>

        {/* Live Drills Today */}
        {(() => {
          const today = new Date().toLocaleDateString('en-US')
          const todayActs = (dashData?.activities||[]).filter(a=>new Date(a.timestamp).toLocaleDateString('en-US')===today)
          const todaySales = todayActs.filter(a=>a.dept==='sales').length
          const todaySvc   = todayActs.filter(a=>a.dept==='service').length
          return (
            <div style={{background:'linear-gradient(135deg,rgba(26,107,255,0.12),rgba(26,107,255,0.05))',border:'1px solid rgba(26,107,255,0.3)',borderRadius:12,padding:'14px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:14}}>
              <div style={{background:'rgba(26,107,255,0.2)',borderRadius:10,padding:'10px 14px',textAlign:'center',minWidth:64}}>
                <div style={{fontFamily:fH,fontSize:38,fontWeight:900,color:C.blueBright,lineHeight:1}}>{todayActs.length}</div>
                <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.blueBright,marginTop:2}}>Today</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:fH,fontSize:13,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Live Drills Today</div>
                <div style={{display:'flex',gap:10}}>
                  <div style={{fontSize:11,color:C.blue}}>🏆 {todaySales} Sales</div>
                  <div style={{fontSize:11,color:C.green}}>🔧 {todaySvc} Service</div>
                  <div style={{fontSize:11,color:C.yellow}}>⏱ {todayActs.filter(a=>a.type==='huddle').length} Huddles</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:todayActs.length>0?C.green:C.gray}}>{todayActs.length>0?'🟢 Active':'⚫ No activity'}</div>
              </div>
            </div>
          )
        })()}

        {dashLoading&&<div style={{textAlign:'center',color:C.gray,padding:'40px 0'}}>Loading team data...</div>}

        {!dashLoading&&(
          <>
            {/* ── ZONE 1: HEALTH BAR ──────────────────────── */}
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>⚡ Dealership Health</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:6}}>
              {[
                {val:reps.length,label:'Active Reps',color:C.blue,icon:'👥'},
                {val:acts.filter(a=>a.type==='voice_drill'||a.type==='voice').length,label:'Voice Drills',color:C.yellow,icon:'🎙'},
                {val:weekActs.filter(a=>a.type==='huddle').length,label:'Huddles/Wk',color:'#3dcfcf',icon:'⏱'},
                {val:`${winRate}%`,label:'Win Rate',color:winRate>=60?C.green:winRate>=40?C.yellow:C.orange,icon:'🏆'},
              ].map(({val,label,color,icon})=>(
                <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:14,marginBottom:2}}>{icon}</div>
                  <div style={{fontFamily:fH,fontSize:20,fontWeight:900,color,lineHeight:1}}>{val}</div>
                  <div style={{fontFamily:fH,fontSize:7,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color,marginTop:2,lineHeight:1.2}}>{label}</div>
                </div>
              ))}
            </div>
            {/* Dept split bar */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              <div style={{background:'rgba(26,107,255,0.08)',border:'1px solid rgba(26,107,255,0.2)',borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
                <span>🏆</span><div><div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:C.blue}}>{acts.filter(a=>a.dept==='sales').length}</div><div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blue}}>Sales Drills</div></div>
              </div>
              <div style={{background:'rgba(184,255,60,0.07)',border:'1px solid rgba(184,255,60,0.2)',borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
                <span>🔧</span><div><div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:C.green}}>{acts.filter(a=>a.dept==='service').length}</div><div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green}}>Service Drills</div></div>
              </div>
            </div>

            {/* ── ZONE 2: WHO NEEDS ATTENTION ─────────────── */}
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>🎯 Coaching Priorities</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {/* Top performers */}
              <div style={{background:'rgba(184,255,60,0.06)',border:'1px solid rgba(184,255,60,0.2)',borderRadius:10,padding:'12px 12px'}}>
                <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.green,marginBottom:8}}>🔥 Recognize</div>
                {topPerformers.length===0&&<div style={{fontSize:11,color:C.gray,fontStyle:'italic'}}>No activity yet</div>}
                {topPerformers.map((r,i)=>(
                  <div key={r.rep} style={{marginBottom:i<topPerformers.length-1?10:0}}>
                    <div style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:2}}>{r.rep}</div>
                    <div style={{fontSize:10,color:C.gray,marginBottom:1}}>{r.total} drills · {r.weekTotal} this week</div>
                    {r.repWinRate>=60&&r.total>=3&&<div style={{fontSize:10,color:C.green}}>🏆 {r.repWinRate}% win rate</div>}
                    {r.weekHuddled&&<div style={{fontSize:10,color:C.green}}>⏱ Attended huddle</div>}
                  </div>
                ))}
              </div>
              {/* Needs coaching */}
              <div style={{background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:10,padding:'12px 12px'}}>
                <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.red,marginBottom:8}}>⚠ Coach Now</div>
                {needsCoaching.length===0&&<div style={{fontSize:11,color:C.gray,fontStyle:'italic'}}>Team is on track 🟢</div>}
                {needsCoaching.map((r,i)=>(
                  <div key={r.rep} style={{marginBottom:i<needsCoaching.length-1?10:0}}>
                    <div style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:3}}>{r.rep}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {r.coachReasons.map((reason,ri)=>(
                        <div key={ri} style={{fontSize:10,color:C.red,display:'flex',alignItems:'center',gap:4}}>
                          <span>⚠</span><span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full leaderboard */}
            {repStats.length>0&&(
              <>
                <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>👥 Full Leaderboard</div>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',marginBottom:16}}>
                  {repStats.map((r,i)=>(
                    <div key={r.rep} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<repStats.length-1?`1px solid ${C.border}`:'none'}}>
                      <div style={{fontFamily:fH,fontSize:13,fontWeight:900,color:i===0?C.yellow:C.gray,minWidth:20}}>#{i+1}</div>
                      <div style={{width:30,height:30,borderRadius:'50%',background:C.blue+'22',border:`1px solid ${C.blue}44`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:fH,fontSize:12,fontWeight:900,color:C.blue}}>{r.rep[0]?.toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:1}}>{r.rep}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontSize:10,color:C.green}}>✓{r.won}</span>
                          {r.sales>0&&<span style={{fontSize:10,color:C.blue,background:'rgba(26,107,255,0.12)',padding:'1px 5px',borderRadius:100}}>🏆{r.sales}</span>}
                          {r.service>0&&<span style={{fontSize:10,color:C.green,background:'rgba(184,255,60,0.1)',padding:'1px 5px',borderRadius:100}}>🔧{r.service}</span>}
                          {r.total>=2&&<span style={{fontFamily:fH,fontSize:10,fontWeight:700,color:r.repWinRate>=60?C.green:r.repWinRate>=40?C.yellow:C.orange}}>{r.repWinRate}%</span>}
                        </div>
                      </div>
                      <div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:C.blue}}>{r.total}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── ZONE 3: ACTIVITY FEED ────────────────────── */}
            {acts.length>0&&(
              <>
                <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>📊 Recent Activity</div>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:16}}>
                  {acts.slice(0,15).map((a,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:i<14?`1px solid ${C.border}`:'none'}}>
                      <div style={{background:a.dept==='sales'?'rgba(26,107,255,0.15)':'rgba(184,255,60,0.1)',border:`1px solid ${a.dept==='sales'?'rgba(26,107,255,0.3)':'rgba(184,255,60,0.25)'}`,borderRadius:4,padding:'2px 5px',fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,color:a.dept==='sales'?C.blueBright:C.green,flexShrink:0}}>
                        {a.dept==='sales'?'SALES':'SVC'}
                      </div>
                      <div style={{fontFamily:fH,fontSize:10,fontWeight:700,color:scoreColor(a.result)}}>{scoreLabel(a.result)}</div>
                      <div style={{flex:1}}><div style={{fontSize:11,color:C.white}}>{a.repName}</div><div style={{fontSize:10,color:C.gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{a.script}</div></div>
                      <div style={{fontSize:9,color:C.gray,flexShrink:0}}>{new Date(a.timestamp).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!dashData&&!dashLoading&&<div style={{textAlign:'center',color:C.gray,padding:'40px 0',fontSize:13}}>Dashboard unavailable. Check connection.</div>}
          </>
        )}

        {/* Floating + Log button */}
        <div onClick={()=>setShowLog(true)} style={{position:'fixed',bottom:82,right:'max(12px, calc(50vw - 228px))',background:C.green,display:'flex',alignItems:'center',gap:6,padding:'11px 16px',borderRadius:100,cursor:'pointer',boxShadow:`0 4px 20px rgba(184,255,60,0.45)`,zIndex:200}}>
          <span style={{fontSize:20,lineHeight:1,color:C.navy,fontWeight:900}}>+</span>
          <span style={{fontFamily:fH,fontSize:12,fontWeight:900,letterSpacing:1,textTransform:'uppercase',color:C.navy}}>Log Win</span>
        </div>
      </div>
    )
  }

  // ── REP VIEW ────────────────────────────────────────────────
  const myWon      = results.filter(r=>r.result==='won').length
  const myProgress = results.filter(r=>r.result==='progress').length
  const myPractice = results.filter(r=>r.result==='practice').length

  return(
    <div style={{padding:'16px 16px 100px',position:'relative'}}>
      {showLog&&<QuickLogSheet onLog={r=>{onLog(r);setShowLog(false)}} onClose={()=>setShowLog(false)} dealer={dealer}/>}

      <div style={{fontFamily:fH,fontSize:26,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:14}}>My Activity</div>

      {/* Personal KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
        {[{label:'Won',val:myWon,color:C.green},{label:'Progress',val:myProgress,color:C.yellow},{label:'Practice',val:myPractice,color:C.orange}].map(({label,val,color})=>(
          <div key={label} style={{background:`${color}10`,border:`1px solid ${color}33`,borderRadius:10,padding:12,textAlign:'center'}}>
            <div style={{fontFamily:fH,fontSize:30,fontWeight:900,color}}>{val}</div>
            <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Activity list */}
      {!results.length
        ?<div style={{textAlign:'center',color:C.gray,padding:'40px 0',fontSize:13,fontStyle:'italic'}}>No results yet. Complete a drill to start tracking.</div>
        :<div style={{display:'flex',flexDirection:'column',gap:8}}>
          {results.map(e=>(
            <div key={e.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'11px 13px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontFamily:fH,fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:scoreColor(e.result)}}>{scoreLabel(e.result)}</span>
                  <Tag color={e.dept==='sales'?C.blue:C.green}>{e.dept==='sales'?'🏆 Sales':'🔧 Service'}</Tag>
                  {e.type&&<Tag color={e.type==='huddle'?'#3dcfcf':e.type==='manual'?C.orange:C.blueBright}>{e.type}</Tag>}
                  <span style={{fontSize:10,color:C.gray}}>{e.date}</span>
                </div>
                <button onClick={()=>onRemove(e.id)} style={{background:'none',border:'none',color:C.gray,cursor:'pointer',fontSize:16}}>x</button>
              </div>
              <div style={{fontSize:13,color:C.white}}>{e.script}</div>
            </div>
          ))}
        </div>
      }

      {/* Floating + Log button */}
      <div onClick={()=>setShowLog(true)} style={{position:'fixed',bottom:82,right:'max(12px, calc(50vw - 228px))',background:C.green,display:'flex',alignItems:'center',gap:6,padding:'11px 16px',borderRadius:100,cursor:'pointer',boxShadow:`0 4px 20px rgba(184,255,60,0.45)`,zIndex:200}}>
          <span style={{fontSize:20,lineHeight:1,color:C.navy,fontWeight:900}}>+</span>
          <span style={{fontFamily:fH,fontSize:12,fontWeight:900,letterSpacing:1,textTransform:'uppercase',color:C.navy}}>Log Win</span>
        </div>
    </div>
  )
}


// ── Manager Hub tools (ShopTime, LeaderGrid, Lifecycle) ───────
const TS_LIST=[{label:'Waiting for first job to arrive',r:true},{label:'Moving cars in and out of workshop',r:true},{label:'Waiting for parts',r:true},{label:'Ad-hoc breaks (smoking, chatting)',r:true},{label:'Asking advice / collecting tools',r:true},{label:'Completing repair order information',r:true},{label:'Liaison with service advisor  -  extra work',r:true},{label:'Cleaning the work bay area',r:false},{label:'Down-time between jobs',r:true},{label:'Natural / scheduled breaks',r:false},{label:'Re-work / warranty corrections',r:true}]
function ShopTime(){const[mins,setMins]=useState(Array(TS_LIST.length).fill(''));const[techs,setTechs]=useState('');const[dy,setDy]=useState('5');const[wks,setWks]=useState('49');const[elr,setElr]=useState('');const[acts,setActs]=useState([{stealer:'',owner:'',by:''},{stealer:'',owner:'',by:''},{stealer:'',owner:'',by:''}]);const total=mins.reduce((a,v)=>a+(parseFloat(v)||0),0);const annHrs=total&&techs?(total*(parseFloat(techs)||0)*(parseFloat(dy)||0)*(parseFloat(wks)||0))/60:0;const annLost=annHrs*(parseFloat(elr)||0);const sm={...inp,width:66,textAlign:'right'};const expPDF=()=>{const rows=TS_LIST.map((st,i)=>mins[i]?`<tr><td style="padding:7px 10px;border-bottom:1px solid #eee;">${st.label}</td><td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;">${mins[i]} mins</td><td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;color:${st.r?'#1a6bff':'#999'};">${st.r?'Recoverable':'Partial'}</td></tr>`:'').filter(Boolean).join('');const ar=acts.filter(a=>a.stealer).map((a,i)=>`<div class="card blue"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">Priority #${i+1}: ${a.stealer}</div><div style="display:flex;gap:20px;"><div><div class="label">Owner</div><div class="val">${a.owner||' - '}</div></div><div><div class="label">By When</div><div class="val">${a.by||' - '}</div></div></div></div>`).join('');printPDF('Shop Time Stealer',`<h1>Shop Time Stealer</h1><div class="sub">Lost Revenue Calculator</div><div class="date">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><div class="divider"></div>${rows?`<h2>Assessment</h2><table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><thead><tr style="background:#f0f4ff;"><th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Activity</th><th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Mins</th><th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Status</th></tr></thead><tbody>${rows}</tbody></table>`:''}<div class="card" style="background:#f0f8f0;border-color:#90c090;margin-bottom:20px;"><div class="label">Total Mins Lost/Day</div><div style="font-size:28px;font-weight:900;color:#1a6bff;">${total.toFixed(0)} mins</div>${annLost>0?`<div style="font-size:20px;font-weight:700;color:#e85d4a;margin-top:6px;">Annual Lost: $${annLost.toLocaleString('en-US',{maximumFractionDigits:0})}</div>`:''}</div><h2>Action Plan</h2>${ar||'<div class="card blue"><div class="label">Priority #1</div><div style="border-bottom:1px solid #ccc;min-height:26px;"></div></div>'}`)};return(<div><div style={{fontFamily:fH,fontSize:22,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Shop Time Stealer</div><div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>Lost Revenue Calculator</div><PDFBtn onClick={expPDF}/><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',marginBottom:14}}><div style={{background:`linear-gradient(135deg,${C.navyLight},#0c1f40)`,padding:'10px 16px',borderBottom:`1px solid ${C.border}`}}><div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green}}>Assessment</div></div>{TS_LIST.map((st,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderBottom:`1px solid ${C.border}`}}><div style={{flex:1,fontSize:12,color:C.lightText}}>{st.label}</div><div style={{fontSize:10,fontFamily:fH,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:st.r?C.green:C.yellow,minWidth:70,textAlign:'right'}}>{st.r?'✓ Recov.':'◑ Partial'}</div><input style={sm} type="number" min="0" placeholder="mins" value={mins[i]} onChange={e=>{const n=[...mins];n[i]=e.target.value;setMins(n)}}/></div>)}<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px'}}><div style={{fontFamily:fH,fontSize:12,fontWeight:700,textTransform:'uppercase',color:C.white}}>Total/Day</div><div style={{fontFamily:fH,fontSize:24,fontWeight:900,color:total>0?C.green:C.gray}}>{total>0?total.toFixed(0):' - '} <span style={{fontSize:12,color:C.gray}}>mins</span></div></div></div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',marginBottom:14}}><div style={{background:`linear-gradient(135deg,${C.navyLight},#0c1f40)`,padding:'10px 16px',borderBottom:`1px solid ${C.border}`}}><div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green}}>Calculator</div></div><div style={{padding:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[{lbl:'Mins/Day',val:total.toFixed(0),ro:true,suf:'mins'},{lbl:'Technicians',val:techs,set:setTechs,ph:'8',suf:'techs'},{lbl:'Days/Week',val:dy,set:setDy,ph:'5',suf:'days'},{lbl:'Weeks/Year',val:wks,set:setWks,ph:'49',suf:'wks'},{lbl:'Labor Rate',val:elr,set:setElr,ph:'185',pre:'$',suf:'/hr'}].map((r,i)=>(<div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,fontFamily:fH,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:5}}>{r.lbl}</div><div style={{display:'flex',alignItems:'center',gap:4}}>{r.pre&&<span style={{color:C.gray,fontSize:13}}>{r.pre}</span>}{r.ro?<div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:C.green}}>{r.val||' - '}</div>:<input style={{...inp,fontSize:15}} type="number" min="0" placeholder={r.ph} value={r.val} onChange={e=>r.set(e.target.value)}/>}<span style={{color:C.gray,fontSize:11}}>{r.suf}</span></div></div>))}<div style={{background:annLost>0?'rgba(184,255,60,0.06)':'rgba(255,255,255,0.03)',border:annLost>0?'1px solid rgba(184,255,60,0.3)':`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',gridColumn:'1 / -1'}}><div style={{fontSize:10,fontFamily:fH,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:4}}>Annual Lost Revenue</div><div style={{fontFamily:fH,fontSize:36,fontWeight:900,color:annLost>0?C.green:C.gray}}>{annLost>0?`$${annLost.toLocaleString('en-US',{maximumFractionDigits:0})}`:' - '}</div>{annLost>0&&<div style={{display:'flex',gap:10,marginTop:10}}>{[25,50].map(p=><div key={p} style={{background:'rgba(26,107,255,0.1)',border:'1px solid rgba(26,107,255,0.2)',borderRadius:6,padding:'6px 10px'}}><div style={{fontSize:10,color:C.gray,fontFamily:fH,letterSpacing:1,textTransform:'uppercase'}}>{p}% Recovery</div><div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:C.blueBright}}>${(annLost*p/100).toLocaleString('en-US',{maximumFractionDigits:0})}</div></div>)}</div>}</div></div></div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}><div style={{background:`linear-gradient(135deg,${C.navyLight},#0c1f40)`,padding:'10px 16px',borderBottom:`1px solid ${C.border}`}}><div style={{fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green}}>Action Plan</div></div><div style={{padding:14}}>{acts.map((a,n)=>(<div key={n} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 12px',marginBottom:8}}><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:6}}>Priority #{n+1}</div><div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:6}}><select style={{...inp,cursor:'pointer'}} value={a.stealer} onChange={e=>{const x=[...acts];x[n]={...x[n],stealer:e.target.value};setActs(x)}}><option value="">Select from assessment...</option>{TS_LIST.map((st,si)=>parseFloat(mins[si])>0?<option key={si} value={st.label}>{st.label} ({mins[si]} mins)</option>:null).filter(Boolean)}</select><input style={inp} placeholder="Owner..." value={a.owner} onChange={e=>{const x=[...acts];x[n]={...x[n],owner:e.target.value};setActs(x)}}/><input style={{...inp,cursor:'pointer',colorScheme:'dark'}} type="date" value={a.by} onChange={e=>{const x=[...acts];x[n]={...x[n],by:e.target.value};setActs(x)}}/></div></div>))}</div></div></div>)}

const QUADS=[{id:'guide',label:'Guide',title:'Lack of Experience',sub:'High Commit · Low Cap',color:C.blue,bg:'rgba(26,107,255,0.08)',bdr:'rgba(26,107,255,0.25)',desc:'Enthusiastic but developing. Invest here.',word:'"Let me show you exactly how I\'d handle that, then we\'ll practice together."',coaching:'Direct & Guide  -  clear expectations, role-play.'},{id:'delegate',label:'Delegate',title:'High Performers',sub:'High Commit · High Cap',color:C.green,bg:'rgba(184,255,60,0.07)',bdr:'rgba(184,255,60,0.3)',desc:'Skilled, self-motivated. Give them autonomy.',word:'"I trust you. Here\'s the outcome  -  how you get there is yours."',coaching:'Delegate  -  give ownership, recognize publicly.'},{id:'direct',label:'Direct',title:'Up or Out',sub:'Low Commit · Low Cap',color:C.red,bg:'rgba(255,107,107,0.07)',bdr:'rgba(255,107,107,0.25)',desc:'Most challenging. Every day unaddressed costs your team.',word:'"Here are the results I need in 30 days. The change starts now."',coaching:'Direct  -  documented expectations, 30-day plan.'},{id:'excite',label:'Excite',title:'Experienced, Not Engaged',sub:'Low Commit · High Cap',color:C.yellow,bg:'rgba(255,201,71,0.07)',bdr:'rgba(255,201,71,0.25)',desc:'Most dangerous. Capability without commitment breeds cynicism.',word:'"I\'ve noticed a shift. Help me understand what\'s changed."',coaching:'Excite  -  honest 1:1, find root cause.'}]
function LeaderGrid(){const[team,setTeam]=useState([]);const[nm,setNm]=useState('');const[qid,setQid]=useState('delegate');const[sel,setSel]=useState(null);const[acts,setActs]=useState({});const[ap,setAp]=useState([{emp:'',priority:'',action:'',when:''},{emp:'',priority:'',action:'',when:''}]);const selQ=QUADS.find(q=>q.id===sel);const add=()=>{if(!nm.trim())return;setTeam([...team,{name:nm.trim(),qid,id:Date.now()}]);setNm('')};const rem=id=>setTeam(team.filter(m=>m.id!==id));const allNames=team.map(m=>m.name);const qC={guide:'#e8f0ff',delegate:'#e8ffe8',direct:'#ffe8e8',excite:'#fff8e8'};const expPDF=()=>{const tR=QUADS.map(q=>{const mb=team.filter(m=>m.qid===q.id);if(!mb.length)return'';return`<div class="card"><div style="padding:4px 8px;background:${qC[q.id]};color:${q.color};font-weight:700;border-radius:4px;display:inline-block;margin-bottom:8px;">${q.label}  -  ${q.title}</div><div style="font-size:13px;color:#333;margin-bottom:8px;">${mb.map(m=>m.name).join(', ')}</div><div class="word-track">${q.word}</div></div>`}).join('');const aR=ap.filter(a=>a.emp).map(a=>{const eq=team.find(m=>m.name===a.emp);const q=QUADS.find(q=>q.id===eq?.qid);return`<div class="card"><div style="font-size:18px;font-weight:700;color:#050d1f;margin-bottom:4px;">${a.emp}</div>${q?`<div class="word-track">${q.word}</div>`:''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:10px;"><div><div class="label">Priority</div><div class="val">${a.priority||' - '}</div></div><div><div class="label">By When</div><div class="val">${a.when||' - '}</div></div></div><div><div class="label">Coaching Action</div><div class="val">${a.action||' - '}</div></div></div>`}).join('');printPDF('Commitment & Capability',`<h1>Commitment & Capability</h1><div class="sub">Leadership Grid</div><div class="date">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><div class="divider"></div>${tR?`<h2>Team Assessment</h2>${tR}`:''}${aR?`<h2>Coaching Action Plan</h2>${aR}`:''}<h2>Weekly Check-In</h2>${['Reviewed grid','Identified top 2 priorities','Matched coaching style','Scheduled 1:1s','Written commitments'].map(i=>`<div class="cb-row"><div class="cb"></div><div style="font-size:13px;">${i}</div></div>`).join('')}`)};return(<div><div style={{fontFamily:fH,fontSize:22,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Commitment & Capability</div><div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>Leadership Grid</div><PDFBtn onClick={expPDF}/><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span>🎯</span><span style={{fontFamily:fH,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.white}}>The Coaching Model</span></div>{QUADS.map((q,i)=>(<div key={q.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:i<3?10:0}}><div style={{background:`${q.color}22`,border:`1px solid ${q.color}44`,borderRadius:8,padding:'5px 8px',fontFamily:fH,fontSize:10,fontWeight:900,color:q.color,minWidth:60,textAlign:'center',flexShrink:0}}>{q.label}</div><div><div style={{fontFamily:fH,fontSize:12,fontWeight:900,textTransform:'uppercase',color:q.color,marginBottom:1}}>{q.title}</div><div style={{fontSize:11,color:C.gray,lineHeight:1.4}}>{q.sub}  -  {q.desc}</div></div></div>))}</div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:14}}><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:8}}>Add Team Member</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><input style={{...inp,flex:1}} placeholder="Name..." value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><select style={{...inp,flex:'0 0 auto',cursor:'pointer'}} value={qid} onChange={e=>setQid(e.target.value)}>{QUADS.map(q=><option key={q.id} value={q.id}>{q.title}</option>)}</select><button onClick={add} style={{background:C.green,color:C.navy,fontFamily:fH,fontWeight:900,fontSize:12,letterSpacing:1,textTransform:'uppercase',padding:'8px 14px',borderRadius:6,border:'none',cursor:'pointer'}}>Add</button></div></div><div style={{marginBottom:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{QUADS.map(q=>{const mb=team.filter(m=>m.qid===q.id);const isS=sel===q.id;return(<div key={q.id} onClick={()=>setSel(isS?null:q.id)} style={{background:isS?q.bg:C.card,border:`2px solid ${isS?q.color:C.border}`,borderRadius:10,padding:12,cursor:'pointer',minHeight:90}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><div><div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:q.color}}>{q.label}</div><div style={{fontFamily:fH,fontSize:11,fontWeight:700,textTransform:'uppercase',color:C.white,lineHeight:1.1}}>{q.title}</div><div style={{fontSize:10,color:C.gray}}>{q.sub}</div></div><div style={{background:q.bg,border:`1px solid ${q.bdr}`,borderRadius:100,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:fH,fontWeight:900,fontSize:11,color:q.color}}>{mb.length}</div></div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{mb.map(m=><div key={m.id} style={{background:'rgba(255,255,255,0.08)',borderRadius:100,padding:'2px 7px',fontSize:11,color:C.white,display:'flex',alignItems:'center',gap:4}}>{m.name}<span onClick={e=>{e.stopPropagation();rem(m.id)}} style={{color:C.gray,cursor:'pointer'}}>x</span></div>)}{!mb.length&&<div style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontStyle:'italic'}}>Empty</div>}</div></div>)})}</div></div>{selQ&&(<div style={{background:selQ.bg,border:`1px solid ${selQ.bdr}`,borderRadius:10,padding:'13px 14px',marginBottom:14}}><div style={{fontFamily:fH,fontSize:15,fontWeight:900,textTransform:'uppercase',color:selQ.color,marginBottom:4}}>{selQ.label}  -  {selQ.title}</div><p style={{fontSize:13,color:C.lightText,lineHeight:1.65,marginBottom:10}}>{selQ.desc}</p><div style={{background:'rgba(0,0,0,0.2)',borderLeft:`3px solid ${selQ.color}`,borderRadius:'0 6px 6px 0',padding:'10px 12px',fontSize:13,color:C.white,fontStyle:'italic',lineHeight:1.65,marginBottom:10}}>{selQ.word}</div><textarea style={{...inp,minHeight:44,resize:'vertical'}} placeholder="My action this week..." value={acts[selQ.id]||''} onChange={e=>setActs({...acts,[selQ.id]:e.target.value})}/></div>)}<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 14px',marginBottom:14}}><div style={{fontFamily:fH,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:4}}>📋 Coaching Action Plan</div><div style={{fontSize:12,color:C.gray,marginBottom:12}}>Pick 2 employees from your grid.</div>{ap.map((a,i)=>(<div key={i} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:8,padding:'11px 12px',marginBottom:8}}><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>Employee #{i+1}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}><div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:3}}>Name</div><select style={{...inp,cursor:'pointer'}} value={a.emp} onChange={e=>{const x=[...ap];x[i]={...x[i],emp:e.target.value};setAp(x)}}><option value="">Select...</option>{allNames.map(n=><option key={n} value={n}>{n}</option>)}</select></div><div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:3}}>Priority</div><select style={{...inp,cursor:'pointer'}} value={a.priority} onChange={e=>{const x=[...ap];x[i]={...x[i],priority:e.target.value};setAp(x)}}><option value="">Select...</option><option value="High  -  This Week">High  -  This Week</option><option value="Medium  -  This Month">Medium</option><option value="Watching">Watching</option></select></div></div><div style={{marginBottom:6}}><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:3}}>Coaching Action</div><input style={inp} placeholder="e.g. Role-play payment objection by Friday..." value={a.action} onChange={e=>{const x=[...ap];x[i]={...x[i],action:e.target.value};setAp(x)}}/></div><div><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.gray,marginBottom:3}}>By When</div><input style={{...inp,cursor:'pointer',colorScheme:'dark'}} type="date" value={a.when} onChange={e=>{const x=[...ap];x[i]={...x[i],when:e.target.value};setAp(x)}}/></div></div>))}</div></div>)}

const LC_STEPS=[{id:'sell1',n:1,label:'Sell #1',title:'Set the Foundation',focus:'Sell the ownership experience, not just the vehicle.',color:'#e85d4a',actions:['Deliver 5 personalized ownership value points during the sale','Capture complete guest profile  -  email, phone, communication preferences','Introduce the service experience early  -  before the deal is done','Manager turn focused on the ownership journey, not just closing'],metrics:['Closing ratio','Email capture rate (goal: 85%+)','CRM notes quality score']},{id:'deliver',n:2,label:'Deliver',title:'Execute a Premium Delivery',focus:'Slow down the delivery to speed up retention.',color:'#e88b3a',actions:['Complete the Delivery Checklist with the guest  -  every delivery','Manager touchpoint during delivery reinforces brand trust','Confirm technology setup, features walkthrough, and first service intro','Manager signs off on checklist before guest departs'],metrics:['Delivery checklist completion rate (goal: 90%+)','Delivery satisfaction scores']},{id:'schedule',n:3,label:'Schedule',title:'Lock in Retention',focus:'Every delivery equals a future service appointment.',color:C.green,actions:['Schedule first service appointment at delivery  -  every time','Confirm appointment in system before goodbye','Activate automated confirmation texts and reminders','BDC follows up within 24 hours to confirm'],metrics:['Service appts set at delivery (goal: 90 - 100%)','First service show rate (goal: 75%+)']},{id:'reconnect',n:4,label:'ReConnect',title:'Reinforce the Relationship',focus:'This is where loyalty is built.',color:'#3dcfcf',actions:['Schedule the ReConnect during delivery  -  not as an afterthought','Complete within 3 - 7 days while experience is fresh','Review features, confirm satisfaction, validate service appointment','Document the ReConnect outcome in CRM'],metrics:['ReConnect completion rate (goal: 90%+)','ReConnect scheduled at delivery']},{id:'appraise',n:5,label:'Appraise',title:'Activate the Sales Opportunity',focus:'The service drive is your most consistent showroom.',color:C.blueBright,actions:['Send complimentary trade appraisal offer during service appointment confirmation','BDC monitors responses and qualifies interested guests','Service advisor verbally reinforces the appraisal offer','Sales team notified immediately when interest is expressed'],metrics:['Appraisal requests per month','Service-to-sales conversion rate']},{id:'sell2',n:6,label:'Sell #2',title:'Complete the Cycle',focus:'Your next sale is already in your service lane.',color:C.blue,actions:['Engage appraisal-interested guests with personalized follow-up','Present upgrade options, equity position, and loyalty incentives','Highlight ownership benefits of staying with your dealership','Track cycle time: days from Vehicle #1 to Vehicle #2 close'],metrics:['Repeat purchase rate','Service-to-sale conversion rate','Average lifecycle cycle days']}]
function Lifecycle(){const[checked,setChecked]=useState({});const[exp,setExp]=useState('sell1');const[notes,setNotes]=useState({});const tog=(sid,ai)=>{const k=`${sid}-${ai}`;setChecked(p=>({...p,[k]:!p[k]}))};const pct=step=>Math.round((step.actions.filter((_,i)=>checked[`${step.id}-${i}`]).length/step.actions.length)*100);const overall=Math.round(LC_STEPS.reduce((a,s)=>a+pct(s),0)/LC_STEPS.length);const expPDF=()=>{const items=LC_STEPS.map(step=>{const unc=step.actions.filter((_,i)=>!checked[`${step.id}-${i}`]);if(!unc.length)return'';return`<div class="card red"><div style="font-size:15px;font-weight:700;color:#e85d4a;margin-bottom:4px;">${step.n}. ${step.label}  -  ${step.title}</div><div style="font-size:12px;color:#666;font-style:italic;margin-bottom:8px;">"${step.focus}"</div>${unc.map(a=>`<div class="cb-row"><div class="cb"></div><div style="font-size:13px;color:#333;">${a}</div></div>`).join('')}${notes[step.id]?`<div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;padding:10px 12px;margin-top:8px;font-size:13px;color:#444;">${notes[step.id]}</div>`:''}</div>`}).filter(Boolean).join('');printPDF('Ownership Lifecycle',`<h1>Ownership Lifecycle</h1><div class="sub">Improvement Plan  -  ${overall}% Overall</div><div class="date">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><div class="divider"></div>${items||'<p style="color:#999;text-align:center;padding:20px;">All actions complete!</p>'}`)};return(<div><div style={{fontFamily:fH,fontSize:22,fontWeight:900,textTransform:'uppercase',color:C.white,marginBottom:4}}>Ownership Lifecycle</div><div style={{fontFamily:fH,fontSize:13,color:C.blueBright,textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>First Sale to Second Sale</div><PDFBtn onClick={expPDF}/><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray}}>Overall</div><div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:overall>70?C.green:overall>30?C.yellow:C.gray}}>{overall}%</div></div><div style={{height:5,background:'rgba(255,255,255,0.08)',borderRadius:100,overflow:'hidden',marginBottom:10}}><div style={{height:'100%',width:`${overall}%`,background:`linear-gradient(90deg,${C.blue},${C.green})`,borderRadius:100}}/></div><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{LC_STEPS.map(step=>{const p=pct(step);return<div key={step.id} onClick={()=>setExp(exp===step.id?null:step.id)} style={{background:p===100?'rgba(184,255,60,0.1)':C.card,border:`1px solid ${p===100?'rgba(184,255,60,0.4)':C.border}`,borderRadius:6,padding:'3px 7px',cursor:'pointer'}}><div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:p===100?C.green:step.color}}>{step.label}</div><div style={{fontSize:10,color:C.gray}}>{p}%</div></div>})}</div></div>{LC_STEPS.map(step=>{const p=pct(step);const isO=exp===step.id;return(<div key={step.id} style={{background:C.card,border:`1px solid ${isO?step.color+'66':C.border}`,borderRadius:10,overflow:'hidden',marginBottom:8}}><div onClick={()=>setExp(isO?null:step.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',cursor:'pointer',background:isO?`linear-gradient(135deg,${C.navyLight},#0c1f40)`:'transparent'}}><div style={{fontFamily:fH,fontSize:22,fontWeight:900,color:step.color,minWidth:24,lineHeight:1}}>{step.n}</div><div style={{flex:1}}><div style={{fontFamily:fH,fontSize:14,fontWeight:900,textTransform:'uppercase',color:C.white}}>{step.label}  -  {step.title}</div><div style={{fontSize:11,color:C.gray,fontStyle:'italic'}}>"{step.focus}"</div></div><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:36,height:3,background:'rgba(255,255,255,0.1)',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:`${p}%`,background:step.color,borderRadius:100}}/></div><div style={{fontFamily:fH,fontSize:11,fontWeight:700,color:p===100?C.green:C.gray}}>{p}%</div><div style={{color:C.gray,fontSize:12}}>{isO?'▲':'▼'}</div></div></div>{isO&&(<div style={{padding:'12px 14px 14px'}}><div style={{marginBottom:10}}>{step.actions.map((a,i)=>{const k=`${step.id}-${i}`;const d=checked[k];return<label key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:6,cursor:'pointer'}}><input type="checkbox" checked={!!d} onChange={()=>tog(step.id,i)} style={{marginTop:2,accentColor:step.color}}/><span style={{fontSize:12,color:d?C.gray:C.lightText,textDecoration:d?'line-through':'none',lineHeight:1.55}}>{a}</span></label>})}</div><div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>{step.metrics.map((m,i)=><div key={i} style={{background:'rgba(26,107,255,0.1)',border:'1px solid rgba(26,107,255,0.2)',borderRadius:100,padding:'2px 8px',fontSize:11,color:C.blueBright,fontFamily:fH,fontWeight:700}}>{m}</div>)}</div><textarea style={{...inp,minHeight:40,resize:'vertical',lineHeight:1.5}} placeholder="Notes..." value={notes[step.id]||''} onChange={e=>setNotes({...notes,[step.id]:e.target.value})}/></div>)}</div>)})}</div>)}

// ── IP Notice shown in Mgr Hub ────────────────────────────
function IPNotice() {
  return(
    <div style={{margin:'16px 0',padding:'12px 14px',background:'rgba(255,255,255,0.02)',border:`1px solid rgba(255,255,255,0.06)`,borderRadius:8}}>
      <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(138,154,181,0.4)',marginBottom:6}}>Intellectual Property Notice</div>
      <p style={{fontSize:11,color:'rgba(138,154,181,0.4)',lineHeight:1.65}}>
        All content, scripts, word tracks, the 5-Minute Huddle™ framework, and coaching methodologies are the proprietary intellectual property of Retail Performance Solutions LLC. © 2026 All rights reserved. Licensed for internal dealership use only. Unauthorized reproduction or redistribution is prohibited.
      </p>
    </div>
  )
}

const HUB_MODS=[{id:'shop',label:'Shop Time',icon:'⏱',C:ShopTime},{id:'grid',label:'Leadership Grid',icon:'🎯',C:LeaderGrid},{id:'lifecycle',label:'Lifecycle',icon:'🔄',C:Lifecycle}]
function ManagerHub(){const[active,setActive]=useState('shop');const Mod=HUB_MODS.find(m=>m.id===active)?.C;return(<div style={{padding:'16px 16px 80px'}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}><div style={{background:`linear-gradient(135deg,${C.blue},${C.green})`,borderRadius:6,padding:'3px 10px',fontFamily:fH,fontSize:10,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:C.navy}}>Manager Hub</div></div><div style={{display:'flex',gap:2,marginBottom:20,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>{HUB_MODS.map(m=>(<button key={m.id} onClick={()=>setActive(m.id)} style={{background:'transparent',border:'none',borderBottom:active===m.id?`2px solid ${C.green}`:'2px solid transparent',color:active===m.id?C.white:C.gray,fontFamily:fH,fontSize:12,fontWeight:active===m.id?900:600,letterSpacing:1,textTransform:'uppercase',padding:'8px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',marginBottom:-1}}><span>{m.icon}</span>{m.label}</button>))}</div>{Mod&&<Mod/>}<IPNotice/></div>)}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// MASTER OPERATOR DASHBOARD  -  Tony's view of all dealerships
// Access via: ?admin=YOURKEY in the URL
// ══════════════════════════════════════════════════════════════
function MasterDashboard({adminKey,onExit}) {
  const [data,setData]     = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError]   = useState('')
  const [sortBy,setSortBy] = useState('health')
  const [filter,setFilter] = useState('all')
  const [expanded,setExpanded] = useState(null)

  useEffect(()=>{
    fetch('/dealer-sync',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'getMasterDashboard',dealerId:'MASTER',repName:'admin',data:{adminKey}})
    }).then(r=>r.json()).then(d=>{
      if(d.error){setError(d.error)}else{setData(d)}
      setLoading(false)
    }).catch(()=>{setError('Connection error');setLoading(false)})
  },[])

  const healthColor = h => h>=70?C.green:h>=40?C.yellow:C.red
  const healthLabel = h => h>=70?'🟢 Healthy':h>=40?'🟡 At Risk':'🔴 Inactive'
  const daysAgo = d => d===0?'Today':d===1?'Yesterday':`${d}d ago`

  const dealers = data?.dealers||[]
  const sorted = [...dealers]
    .filter(d=>filter==='all'||(filter==='healthy'&&d.health>=70)||(filter==='atrisk'&&d.health>=40&&d.health<70)||(filter==='inactive'&&d.health<40))
    .sort((a,b)=>sortBy==='health'?(b.health-a.health):sortBy==='drills'?(b.totalDrills-a.totalDrills):sortBy==='active'?(a.daysSinceActive-b.daysSinceActive):(b.totalDrills-a.totalDrills))

  const totalActive      = dealers.filter(d=>d.daysSinceActive<=3).length
  const avgHealth        = dealers.length>0?Math.round(dealers.reduce((a,d)=>a+d.health,0)/dealers.length):0
  const totalDrills      = dealers.reduce((a,d)=>a+(d.totalDrills||0),0)
  const totalVoiceDrills = dealers.reduce((a,d)=>a+(d.voiceDrills||0),0)

  // ── Estimated cost per dealer ─────────────────────────────
  // Claude API: ~$0.003 per drill (haiku pricing)
  // OpenAI Realtime: ~$0.68 per live session (estimated 10% of drills)
  // ElevenLabs: $22/month flat split across dealers
  const MONTHLY_REVENUE  = 997
  const CLAUDE_PER_DRILL = 0.003
  const REALTIME_PER_SESSION = 0.68
  const ELEVENLABS_FLAT  = 22
  const elevenlabsPerDealer = dealers.length>0 ? ELEVENLABS_FLAT/dealers.length : 22

  const dealerCosts = dealers.map(d=>{
    const drills       = d.voiceDrills||0
    const liveSessions = Math.round(drills*0.10) // estimate 10% use live AI
    const claudeCost   = drills * CLAUDE_PER_DRILL
    const realtimeCost = liveSessions * REALTIME_PER_SESSION
    const totalCost    = claudeCost + realtimeCost + elevenlabsPerDealer
    const margin       = MONTHLY_REVENUE - totalCost
    return { ...d, estCost:totalCost, estMargin:margin, liveSessions }
  })
  const totalEstCost   = dealerCosts.reduce((a,d)=>a+d.estCost,0)
  const totalEstMargin = dealers.length * MONTHLY_REVENUE - totalEstCost
  const totalRevenue   = dealers.length * MONTHLY_REVENUE

  const exportMasterPDF = () => {
    const rows = sorted.map(d=>`
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:700;">${d.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px;color:#666;">${d.code}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:${d.health>=70?'#2d8a2d':d.health>=40?'#a07000':'#c03030'};font-weight:700;">${d.health}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${d.reps}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${d.totalDrills}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${d.weekDrills}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${d.winRate}%</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:${d.daysSinceActive<=3?'#2d8a2d':d.daysSinceActive<=7?'#a07000':'#c03030'};">${daysAgo(d.daysSinceActive)}</td>
      </tr>`).join('')
    printPDF('5-Minute Dealer Coach  -  Operator Report',`
      <h1>Operator Dashboard</h1>
      <div class="sub">5-Minute Dealer Coaching System</div>
      <div class="date">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
        <div class="card blue"><div class="label">Total Dealers</div><div style="font-size:28px;font-weight:900;color:#1a6bff;">${dealers.length}</div></div>
        <div class="card green"><div class="label">Active This Week</div><div style="font-size:28px;font-weight:900;color:#2d8a2d;">${totalActive}</div></div>
        <div class="card"><div class="label">Total Drills</div><div style="font-size:28px;font-weight:900;">${totalDrills}</div></div>
      </div>
      <h2>All Dealerships</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f0f4ff;">
          <th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Dealership</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Code</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Health</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Reps</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Total</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">This Wk</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Win%</th>
          <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Last Active</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `)
  }

  return(
    <div style={{fontFamily:fB,background:C.navy,minHeight:'100vh',color:C.white,maxWidth:960,margin:'0 auto',padding:'20px 16px 40px'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontFamily:fH,fontSize:13,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:C.green,marginBottom:4}}>Operator View</div>
          <div style={{fontFamily:fH,fontSize:32,fontWeight:900,textTransform:'uppercase',color:C.white,lineHeight:1}}>Master <span style={{color:C.green}}>Dashboard</span></div>
          <div style={{fontFamily:fH,fontSize:13,color:C.gray,marginTop:4}}>5-Minute Dealer Coaching System</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <PDFBtn onClick={exportMasterPDF} label="📄 Export Report"/>
          <button onClick={onExit} style={{background:'rgba(255,255,255,0.06)',border:`1px solid ${C.border}`,color:C.gray,fontFamily:fH,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:'uppercase',padding:'8px 14px',borderRadius:6,cursor:'pointer'}}>← Exit Admin</button>
        </div>
      </div>

      {loading&&<div style={{textAlign:'center',color:C.gray,padding:'60px 0',fontSize:14}}>Loading all dealerships...</div>}
      {error&&<div style={{background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:10,padding:'16px',color:C.red,marginBottom:20}}>{error==='Unauthorized'?'Invalid admin key  -  check your URL':'Error loading data: '+error}</div>}

      {!loading&&data&&(
        <>
          {/* KPI strip */}
          {/* KPI strip  -  row 1 */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
            {[
              {val:dealers.length,        label:'Total Dealers',   color:C.blue,   icon:'🏢'},
              {val:totalActive,           label:'Active 3 Days',   color:C.green,  icon:'🟢'},
              {val:dealers.filter(d=>d.health<40).length, label:'Need Attention', color:C.red, icon:'🔴'},
              {val:dealers.filter(d=>d.daysSinceActive>=2&&d.daysSinceActive<=7).length, label:'Streak Alert', color:C.yellow, icon:'🟡'},
              {val:totalDrills,           label:'Total Drills',    color:C.yellow, icon:'🎯'},
              {val:totalVoiceDrills,      label:'Voice Drills',    color:C.green,  icon:'🎙'},
            ].map(({val,label,color,icon})=>(
              <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:16,marginBottom:3}}>{icon}</div>
                <div style={{fontFamily:fH,fontSize:24,fontWeight:900,color,lineHeight:1}}>{val}</div>
                <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color,marginTop:3}}>{label}</div>
              </div>
            ))}
          </div>

          {/* KPI strip  -  row 2: financials */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
            <div style={{background:'rgba(184,255,60,0.06)',border:'1px solid rgba(184,255,60,0.2)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:16,marginBottom:3}}>💰</div>
              <div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:C.green,lineHeight:1}}>${totalRevenue.toLocaleString()}</div>
              <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green,marginTop:3}}>Monthly Revenue</div>
            </div>
            <div style={{background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:16,marginBottom:3}}>⚡</div>
              <div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:C.orange||'#ff9f43',lineHeight:1}}>${totalEstCost.toFixed(0)}</div>
              <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.orange||'#ff9f43',marginTop:3}}>Est. API Cost</div>
            </div>
            <div style={{background:'rgba(26,107,255,0.06)',border:'1px solid rgba(26,107,255,0.2)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:16,marginBottom:3}}>📈</div>
              <div style={{fontFamily:fH,fontSize:20,fontWeight:900,color:C.blueBright,lineHeight:1}}>${totalEstMargin.toFixed(0)}</div>
              <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blueBright,marginTop:3}}>Est. Net Margin</div>
            </div>
          </div>

          {/* Filters + sort */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[['all','All'],['healthy','🟢 Healthy'],['atrisk','🟡 At Risk'],['inactive','🔴 Inactive']].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?'rgba(184,255,60,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${filter===v?'rgba(184,255,60,0.4)':C.border}`,color:filter===v?C.green:C.gray,fontFamily:fH,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'6px 12px',borderRadius:6,cursor:'pointer'}}>{l}</button>
            ))}
            <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.gray}}>Sort:</span>
              {[['health','Health'],['drills','Drills'],['active','Recent']].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{background:sortBy===v?'rgba(26,107,255,0.2)':'transparent',border:`1px solid ${sortBy===v?C.blue:C.border}`,color:sortBy===v?C.blueBright:C.gray,fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'5px 10px',borderRadius:6,cursor:'pointer'}}>{l}</button>
              ))}
            </div>
          </div>

          {sorted.length===0&&<div style={{textAlign:'center',color:C.gray,padding:'40px 0',fontStyle:'italic'}}>No dealerships enrolled yet. Share the app and start enrolling.</div>}

          {/* Dealer cards */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sorted.map(d=>{
              const dc = dealerCosts.find(x=>x.code===d.code)||{...d,estCost:0,estMargin:997,liveSessions:0}
              const isExp = expanded===d.code
              const hc = healthColor(d.health)
              return(
                <div key={d.code} style={{background:C.card,border:`1px solid ${isExp?hc+'55':C.border}`,borderRadius:12,overflow:'hidden',transition:'border-color 0.2s'}}>
                  {/* Main row */}
                  <div onClick={()=>setExpanded(isExp?null:d.code)} style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:14}}>
                    {/* Health score circle */}
                    <div style={{width:52,height:52,borderRadius:'50%',background:`${hc}15`,border:`2px solid ${hc}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <div style={{fontFamily:fH,fontSize:16,fontWeight:900,color:hc,lineHeight:1}}>{d.health}</div>
                      <div style={{fontFamily:fH,fontSize:7,fontWeight:700,color:hc,letterSpacing:.5}}>HEALTH</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                        <div style={{fontFamily:fH,fontSize:16,fontWeight:900,textTransform:'uppercase',color:C.white}}>{d.name}</div>
                        <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:2,color:C.gray}}>{d.code}</div>
                        <div style={{fontFamily:fH,fontSize:10,fontWeight:700,color:hc}}>{healthLabel(d.health)}</div>
                      </div>
                      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,color:C.gray}}>👥 {d.reps} reps</span>
                        <span style={{fontSize:11,color:C.gray}}>🎯 {d.totalDrills} drills</span>
                        <span style={{fontSize:11,color:C.yellow}}>📅 {d.weekDrills} this week</span>
                        <span style={{fontSize:11,color:d.winRate>=50?C.green:C.orange}}>🏆 {d.winRate}% win rate</span>
                        <span style={{fontSize:11,color:d.daysSinceActive<=3?C.green:d.daysSinceActive<=7?C.yellow:C.red}}>⏰ {daysAgo(d.daysSinceActive)}</span>
                      </div>
                    </div>
                    <div style={{color:C.gray,fontSize:12,flexShrink:0}}>{isExp?'▲':'▼'}</div>
                  </div>

                  {/* Health bar */}
                  <div style={{height:3,background:'rgba(255,255,255,0.06)'}}>
                    <div style={{height:'100%',width:`${d.health}%`,background:hc,transition:'width 0.4s'}}/>
                  </div>

                  {/* Expanded detail */}
                  {isExp&&(
                    <div style={{padding:'14px 16px',borderTop:`1px solid ${C.border}`}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                        {[
                          {val:d.weekDrills,    label:'This Week',    color:C.blue},
                          {val:d.weekHuddles,   label:'Huddles/Wk',  color:C.green},
                          {val:d.voiceDrills,   label:'Voice Drills', color:C.yellow},
                          {val:`${d.winRate}%`, label:'Win Rate',     color:d.winRate>=50?C.green:C.orange},
                        ].map(({val,label,color})=>(
                          <div key={label} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 8px',textAlign:'center'}}>
                            <div style={{fontFamily:fH,fontSize:22,fontWeight:900,color,lineHeight:1}}>{val}</div>
                            <div style={{fontFamily:fH,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color,marginTop:3}}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Health breakdown */}
                      <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 12px',marginBottom:12}}>
                        <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:8}}>Health Score Breakdown</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {[
                            {label:'Weekly Activity',  val:d.weekDrills>=10?40:d.weekDrills>=5?25:d.weekDrills>=1?10:0, max:40},
                            {label:'Recency',           val:d.daysSinceActive<=1?25:d.daysSinceActive<=3?15:d.daysSinceActive<=7?5:0, max:25},
                            {label:'Huddle Completion', val:d.weekHuddles>=3?20:d.weekHuddles>=1?10:0, max:20},
                            {label:'Win Rate',          val:Math.min(15,Math.floor((d.winRate/100)*15)), max:15},
                          ].map(({label,val,max})=>(
                            <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{fontSize:10,color:C.gray,minWidth:130}}>{label}</div>
                              <div style={{flex:1,height:4,background:'rgba(255,255,255,0.06)',borderRadius:100,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${(val/max)*100}%`,background:val>=max*0.7?C.green:val>=max*0.4?C.yellow:C.red,borderRadius:100}}/>
                              </div>
                              <div style={{fontFamily:fH,fontSize:10,fontWeight:700,color:C.white,minWidth:40,textAlign:'right'}}>{val}/{max}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent activity */}
                      {d.recentActivity?.length>0&&(
                        <div>
                          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.gray,marginBottom:6}}>Recent Activity</div>
                          {d.recentActivity.map((a,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<d.recentActivity.length-1?`1px solid ${C.border}`:'none'}}>
                              <div style={{background:a.dept==='sales'?'rgba(26,107,255,0.15)':'rgba(184,255,60,0.1)',borderRadius:4,padding:'1px 5px',fontFamily:fH,fontSize:9,fontWeight:700,color:a.dept==='sales'?C.blueBright:C.green,flexShrink:0}}>
                                {a.dept==='sales'?'SALES':'SVC'}
                              </div>
                              <div style={{flex:1,fontSize:11,color:C.lightText}}>{a.repName}  -  {a.script}</div>
                              <div style={{fontSize:10,color:C.gray,flexShrink:0}}>{new Date(a.timestamp).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Estimated cost + margin for this dealer */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                        <div style={{background:'rgba(184,255,60,0.05)',border:'1px solid rgba(184,255,60,0.15)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green,marginBottom:3}}>Revenue</div>
                          <div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:C.green}}>$997</div>
                        </div>
                        <div style={{background:'rgba(255,107,107,0.05)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#ff9f43',marginBottom:3}}>Est. Cost</div>
                          <div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:'#ff9f43'}}>${dc.estCost.toFixed(0)}</div>
                          <div style={{fontSize:9,color:C.gray,marginTop:2}}>{dc.liveSessions} live sessions</div>
                        </div>
                        <div style={{background:'rgba(26,107,255,0.05)',border:'1px solid rgba(26,107,255,0.15)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.blueBright,marginBottom:3}}>Net Margin</div>
                          <div style={{fontFamily:fH,fontSize:18,fontWeight:900,color:dc.estMargin>800?C.green:dc.estMargin>600?C.yellow:'#ff9f43'}}>${dc.estMargin.toFixed(0)}</div>
                        </div>
                      </div>

                      {/* Streak protection + churn warnings */}
                      {d.daysSinceActive>=2&&d.daysSinceActive<=7&&(
                        <div style={{background:'rgba(255,201,71,0.08)',border:'1px solid rgba(255,201,71,0.2)',borderRadius:8,padding:'10px 12px',marginTop:10}}>
                          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.yellow,marginBottom:3}}>🟡 Streak Alert  -  {d.daysSinceActive} Days Inactive</div>
                          <div style={{fontSize:12,color:'#ffe08a'}}>No activity for {d.daysSinceActive} days. Send a check-in to re-engage before the habit breaks.</div>
                        </div>
                      )}
                      {d.daysSinceActive>7&&(
                        <div style={{background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:8,padding:'10px 12px',marginTop:10}}>
                          <div style={{fontFamily:fH,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.red,marginBottom:3}}>🔴 Churn Risk  -  {d.daysSinceActive} Days Inactive</div>
                          <div style={{fontSize:12,color:'#ffaaaa'}}>Account has gone dark. Immediate outreach needed  -  {d.daysSinceActive} days without a drill or huddle.</div>
                        </div>
                      )}

                      {/* Pull Monthly Report button */}
                      <button onClick={()=>{
                        const acts = d.recentActivity||[]
                        const now  = new Date()
                        const month = now.toLocaleDateString('en-US',{month:'long',year:'numeric'})
                        const reps  = [...new Set(acts.map(a=>a.repName))].filter(Boolean)
                        const won   = acts.filter(a=>a.result==='won'||a.result?.startsWith('A')||a.result?.startsWith('B')).length
                        const wr    = acts.length>0?Math.round((won/acts.length)*100):0
                        const topScript = (()=>{const sc={};acts.forEach(a=>{if(a.script)sc[a.script]=(sc[a.script]||0)+1});return Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'No data yet'})()
                        const repRows = reps.map(rep=>{
                          const ra=acts.filter(a=>a.repName===rep)
                          const w=ra.filter(a=>a.result==='won'||a.result?.startsWith('A')||a.result?.startsWith('B')).length
                          const r=ra.length>0?Math.round((w/ra.length)*100):0
                          const rc=r>=60?'#2d8a2d':r>=40?'#a07000':'#c03030'
                          return `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:700;">${rep}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${ra.length}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:#1a6bff;">${ra.filter(a=>a.dept==='sales').length}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;color:#5ca800;">${ra.filter(a=>a.dept==='service').length}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:${rc};">${r}%</td></tr>`
                        }).join('')
                        printPDF(`Monthly Report  -  ${d.name}`,`
                          <h1>Monthly Dealer Report Card</h1>
                          <div class="sub">${d.name} · Code: ${d.code}</div>
                          <div class="date">${month}</div>
                          <div class="divider"></div>
                          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
                            <div class="card" style="text-align:center;"><div style="font-size:32px;font-weight:900;color:#1a6bff;">${acts.length}</div><div class="label">Total Drills</div></div>
                            <div class="card" style="text-align:center;"><div style="font-size:32px;font-weight:900;color:${wr>=60?'#2d8a2d':wr>=40?'#a07000':'#c03030'};">${wr}%</div><div class="label">Win Rate</div></div>
                            <div class="card" style="text-align:center;"><div style="font-size:32px;font-weight:900;color:#b8682d;">${acts.filter(a=>a.type==='huddle').length}</div><div class="label">Huddles</div></div>
                            <div class="card" style="text-align:center;"><div style="font-size:32px;font-weight:900;color:#050d1f;">${d.reps}</div><div class="label">Active Reps</div></div>
                          </div>
                          <h2>Health Score: ${d.health}/100</h2>
                          <div class="card ${d.health>=70?'green':d.health>=40?'':'red'}">
                            <div style="font-size:13px;">Weekly Activity: ${d.weekDrills} drills · Huddles: ${d.weekHuddles} · Last Active: ${d.daysSinceActive===0?'Today':d.daysSinceActive===1?'Yesterday':d.daysSinceActive+' days ago'}</div>
                          </div>
                          ${reps.length>0?`<h2>Rep Performance</h2>
                          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                            <thead><tr style="background:#f0f4ff;">
                              <th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Rep</th>
                              <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#666;">Drills</th>
                              <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#1a6bff;">Sales</th>
                              <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#5ca800;">Service</th>
                              <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#333;">Win Rate</th>
                            </tr></thead>
                            <tbody>${repRows}</tbody>
                          </table>`:''}
                          <h2>Top Objection Drilled</h2>
                          <div class="card blue"><div style="font-size:14px;font-weight:700;">${topScript}</div></div>
                          ${acts.length>0?`<h2>Recent Activity</h2>${acts.slice(0,10).map(a=>`<div class="card"><div style="font-size:13px;font-weight:700;">${a.repName||' - '} <span style="color:${a.dept==='sales'?'#1a6bff':'#5ca800'}">[${(a.dept||'').toUpperCase()}]</span></div><div style="font-size:12px;color:#666;">${a.script||' - '}  -  ${a.timestamp?new Date(a.timestamp).toLocaleDateString():' - '}</div></div>`).join('')}`:''}
                        `)
                      }} style={{width:'100%',background:'linear-gradient(135deg,rgba(184,255,60,0.12),rgba(184,255,60,0.06))',border:'1px solid rgba(184,255,60,0.35)',color:C.green,fontFamily:fH,fontWeight:900,fontSize:13,letterSpacing:1,textTransform:'uppercase',padding:'11px 16px',borderRadius:8,cursor:'pointer',marginTop:12}}>
                        📄 Pull Monthly Report  -  {d.name}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.gray}}>
            {dealers.length} dealerships · Last refreshed {new Date().toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  // ── Admin mode detection  -  ?admin=KEY in URL ──────────────
  const adminKey = typeof window!=='undefined' ? new URLSearchParams(window.location.search).get('admin') : null

  const [dealer,setDealer]     = useState(()=>loadJSON('5md-dealer',null))
  const [tab,setTab]           = useState('home')
  const [results,setResults]   = useState(()=>loadJSON('5md-results',[]))
  const [stats,setStats]       = useState(()=>loadJSON('5md-stats',{drills:0,huddles:0,voices:0}))
  const [streak,setStreak]     = useState(()=>loadJSON('5md-streak',{count:0,lastDay:''}))
  const [milestone,setMilestone] = useState(null)
  const [preloadDrill,setPreloadDrill]   = useState(null)
  const [preloadHuddle,setPreloadHuddle] = useState(null)
  const [preloadTracker,setPreloadTracker] = useState('')
  const [schedule,setSchedule] = useState(()=>loadJSON('5md-schedule',{}))
  const [welcomeMsg,setWelcomeMsg] = useState(null)

  useEffect(()=>{
    if(window.speechSynthesis){
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices()
    }
  },[])

  // Show welcome message once per day
  useEffect(()=>{
    if(dealer){
      const k = `5md-ws-${getTodayKey()}`
      if(!loadJSON(k,false)){
        setWelcomeMsg(pickWelcome(dealer.repName,false))
        saveJSON(k,true)
        setTimeout(()=>setWelcomeMsg(null),5500)
      }
    }
  },[dealer?.repName])

  const handleDealerDone = (info,isNew) => {
    setDealer(info); saveJSON('5md-dealer',info)
    const msg = pickWelcome(info.repName,isNew)
    setWelcomeMsg(msg)
    saveJSON(`5md-ws-${getTodayKey()}`,true)
    setTimeout(()=>setWelcomeMsg(null),6000)
  }

  const handleScheduleChange = updated => { setSchedule(updated); saveJSON('5md-schedule',updated) }
  const handleDrillNow  = script => {
    setPreloadDrill(script||'random')
    setTab('drill')
    // livePhase gets reset inside launch()  -  no action needed here
  }
  const handleHuddleNow = script => { setPreloadHuddle(script); setTab('huddle') }

  const logResult = entry => {
    const repName = entry.rep || dealer?.repName
    const newEntry = {...entry,date:new Date().toLocaleDateString('en-US'),id:Date.now(),rep:repName}
    const newResults = [newEntry,...results]
    setResults(newResults); saveJSON('5md-results',newResults)
    const prevTotal = stats.drills||0
    const newStats  = {drills:prevTotal+1,huddles:(stats.huddles||0)+(entry.type==='huddle'?1:0),voices:(stats.voices||0)+(entry.type==='voice'?1:0)}
    setStats(newStats); saveJSON('5md-stats',newStats)
    const newStreak = updateStreak(streak)
    setStreak(newStreak); saveJSON('5md-streak',newStreak)
    const ms = getNewMilestone(prevTotal,prevTotal+1)
    if(ms){ setMilestone(ms); setTimeout(()=>setMilestone(null),8000) }
    // Sync ALL activity types to KV so dashboard reflects it
    if(dealer?.dealerId){
      dealerSync('logActivity',dealer.dealerId,repName,{
        type:entry.type==='voice'?'voice_drill':entry.type||'manual',
        script:entry.script||'',
        result:entry.result||'',
        dept:entry.dept||'sales',
      })
    }
    // Only navigate to dashboard for drill/huddle completions, not manual quick logs
    if(entry.type!=='manual'){
      setPreloadTracker(entry.script||'')
      setTab('tracker')
    }
  }

  const removeResult = id => { const u=results.filter(r=>r.id!==id); setResults(u); saveJSON('5md-results',u) }

  // Render master dashboard if ?admin=KEY present
  if(adminKey) return <MasterDashboard adminKey={adminKey} onExit={()=>window.location.href=window.location.pathname}/>

  if(!dealer) return <Onboarding onDone={handleDealerDone}/>

  const role  = dealer.role||'sales_rep'
  const isMgr = isManager(role)

  const TABS = [
    {id:'home',    label:'Home',    icon:'🏠'},
    {id:'scripts', label:'Scripts', icon:'📋'},
    {id:'drill',   label:'Drill',   icon:'🎙'},
    ...(isMgr?[{id:'huddle',label:'Huddle',icon:'⏱'}]:[]),
    {id:'tracker', label:'Dashboard',   icon:'📊'},
    ...(isMgr?[{id:'hub',label:'Mgr Hub',icon:'🏢'}]:[]),
  ]

  return(
    <div style={{fontFamily:fB,background:C.navy,minHeight:'100vh',color:C.white,maxWidth:480,margin:'0 auto',position:'relative'}}>
      <div style={{paddingBottom:72}}>
        {tab==='home'    &&<Home onNav={setTab} dealer={dealer} stats={stats} results={results} streak={streak} milestone={milestone} onDrillNow={handleDrillNow} onHuddleNow={handleHuddleNow} schedule={schedule} onScheduleChange={handleScheduleChange} welcomeMsg={welcomeMsg}/>}
        {tab==='scripts' &&<ScriptLibrary dealer={dealer}/>}
        {tab==='drill'   &&<VoiceDrill onLog={logResult} dealer={dealer} preloadScript={preloadDrill==='random'?null:preloadDrill} onClearPreload={()=>setPreloadDrill(null)}/>}
        {tab==='huddle'  &&isMgr&&<HuddleTimer onLog={logResult} dealer={dealer} preloadScript={preloadHuddle} onClearPreload={()=>setPreloadHuddle(null)}/>}
        {tab==='tracker' &&<TrackDash results={results} onRemove={removeResult} onLog={logResult} preloadScript={preloadTracker} dealer={dealer}/>}
        {tab==='hub'     &&isMgr&&<ManagerHub/>}
      </div>

      {/* Bottom nav  -  improved visibility */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:C.navyMid,borderTop:`1px solid ${C.border}`,display:'flex',zIndex:100}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?'rgba(184,255,60,0.07)':'none',border:'none',borderTop:tab===t.id?`2px solid ${C.green}`:'2px solid transparent',padding:'10px 2px 8px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
            <span style={{fontSize:16,opacity:tab===t.id?1:0.65}}>{t.icon}</span>
            <span style={{fontFamily:fH,fontSize:9,fontWeight:700,letterSpacing:.5,textTransform:'uppercase',color:tab===t.id?C.green:C.lightText}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
