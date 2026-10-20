import { MOODS, REFLECTION_QUESTIONS, CONNECTION_QUESTIONS, SCIENCE_LESSONS, MOON_PHASES } from './constants.js'

// Context-aware AI reply generation
// Uses the user's check-ins, journal, goals, and profile to build personalized responses
// Does NOT fabricate facts, memories, or patterns the user hasn't shared

export function buildContext({ profile, checkins, journal, goals, reflections, memories, interests }) {
  const ctx = {
    name: profile?.name || '',
    role: profile?.role || '',
    energy: checkins[0]?.energy ?? null,
    stress: checkins[0]?.stress ?? null,
    mood: checkins[0]?.mood ?? null,
    connection: checkins[0]?.connection ?? null,
    interestNames: interests?.map(i => i.name) || [],
    goalTitles: goals?.filter(g => g.status === 'active').map(g => g.title) || [],
    recentJournal: journal?.slice(0, 3).map(j => j.content).join(' ') || '',
    recentReflections: reflections?.slice(0, 3).map(r => r.answer).join(' ') || '',
    memoryContents: memories?.filter(m => m.approved).map(m => m.content) || [],
    checkinCount: checkins?.length || 0,
    streak: profile?.streak || 0,
    xp: profile?.xp || 0,
  }
  return ctx
}

export function generateReply(input, ctx) {
  const t = (input || '').toLowerCase()
  const name = ctx.name ? `${ctx.name}, ` : ''

  // Energy/stress-aware responses
  const lowEnergy = ctx.energy !== null && ctx.energy < 35
  const highStress = ctx.stress !== null && ctx.stress > 70

  if (t.includes('relationship') || t.includes('partner') || t.includes('friend') || t.includes('family') || t.includes('fight') || t.includes('conflict')) {
    return `${name}begin with what happened, what you felt, what you needed, and what you want next. You do not have to prove who was right to make the next conversation better. The Communication Lab in Explore can help you turn the messy version into words you can actually send.`
  }

  if (t.includes('stuck') || t.includes('overwhelm') || t.includes('overwhelmed') || t.includes('too much')) {
    return `${name}make the next step smaller than your brain thinks it needs to be. What can be done in ten minutes — or what can safely wait? ${highStress ? 'Your last check-in showed high stress. That is a signal to go smaller, not push harder.' : ''}`
  }

  if (t.includes('fun') || t.includes('play') || t.includes('bored') || t.includes('game')) {
    return `${name}try a Would You Rather round, a silly kids activity, a question from the deck, or explore something you have never tapped before. Play is not a waste of growth time — it is part of it.`
  }

  if (t.includes('astrology') || t.includes('zodiac') || t.includes('moon') || t.includes('star') || t.includes('chart')) {
    return `${name}astrology can be a playful mirror. Open Explore → Astrology to add birth details and wander through Sun, Moon, Rising and moon-cycle reflections. It is for reflection and fun, not scientific prediction.`
  }

  if (t.includes('reset') || t.includes('tired') || t.includes('exhausted') || t.includes('burnt') || t.includes('burnout')) {
    return `${name}drop your shoulders, take one slower breath, and choose only the next five minutes. ${lowEnergy ? 'Your energy has been low. Rest is not the opposite of growth — it is part of it.' : 'Nothing needs to be fixed right now.'}`
  }

  if (t.includes('goal') || t.includes('habit') || t.includes('track') || t.includes('progress')) {
    const goalsList = ctx.goalTitles.length ? ` You are currently working on: ${ctx.goalTitles.join(', ')}.` : ''
    return `${name}small repeated actions build more than grand gestures. ${goalsList} What is the smallest version of this that you could start in two minutes?`
  }

  if (t.includes('journal') || t.includes('write') || t.includes('reflect') || t.includes('feeling')) {
    return `${name}writing helps you see what thinking alone cannot. You can journal freely in Grow → Journal. ${ctx.recentJournal ? 'I can see you have reflected recently — you might notice what is similar or different today.' : 'You do not need to write a lot. One honest sentence is enough.'}`
  }

  if (t.includes('understand') || t.includes('myself') || t.includes('self') || t.includes('who am i') || t.includes('pattern')) {
    return `${name}self-understanding comes from noticing, not from one big answer. ${ctx.checkinCount > 3 ? `You have ${ctx.checkinCount} check-ins saved. Over time, patterns can emerge from what you notice.` : 'Try a reflection question in Grow, or check in daily for a week and see what repeats.'} The point is curiosity, not a verdict.`
  }

  if (t.includes('surprise') || t.includes('random') || t.includes('recommend')) {
    const interest = ctx.interestNames[Math.floor(Math.random() * Math.max(ctx.interestNames.length, 1))]
    if (interest) {
      return `${name}since you are curious about ${interest}, try exploring something adjacent to it. Or open a Would You Rather round, ask Novie a question you would not normally ask, or try a 3-minute kids activity. Wander freely.`
    }
    return `${name}try a Would You Rather round, a reflection question, or explore something you have never tapped before. You can always change direction.`
  }

  if (t.includes('anxious') || t.includes('anxiety') || t.includes('worried') || t.includes('worry') || t.includes('scared') || t.includes('afraid')) {
    return `${name}name what you are afraid of specifically, if you can. Vague fear feels bigger than specific fear. ${highStress ? 'Your stress has been high — a tiny reset might help before you try to think it through.' : ''} This is a feeling, not a forecast.`
  }

  if (t.includes('sad') || t.includes('depressed') || t.includes('down') || t.includes('lonely') || t.includes('alone')) {
    return `${name}I hear you. What you are feeling is real. ${ctx.connection !== null && ctx.connection < 45 ? 'Your check-in suggested you might be craving more connection. Even a small reach-out can help.' : ''} You do not have to fix this right now. One small, kind thing for yourself is enough.`
  }

  if (t.includes('grateful') || t.includes('gratitude') || t.includes('thankful')) {
    return `${name}gratitude works best when it is specific. Instead of "I am grateful for my friends," try "I am grateful that [name] texted me today." The detail is what changes the feeling.`
  }

  if (t.includes('help') || t.includes('what can you do') || t.includes('what do you do')) {
    return `${name}I can help you reflect, understand patterns, prepare for conversations, set small goals, explore astrology playfully, find activities, or just think out loud. Tell me what is on your mind, or pick one of the quick paths above.`
  }

  // Default — gentle, open
  return `${name}you do not need to solve everything today. Start with one honest question, one tiny experiment, or one thing that makes you curious. ${ctx.goalTitles.length ? `You have been working on: ${ctx.goalTitles.join(', ')}.` : ''} You can always change direction.`
}

export function generateInsight(ctx) {
  const insights = []

  if (ctx.checkinCount >= 3) {
    const recent = ctx.checkins?.slice(0, 5)
    const avgEnergy = recent.reduce((s, c) => s + (c.energy || 50), 0) / recent.length
    const avgStress = recent.reduce((s, c) => s + (c.stress || 30), 0) / recent.length
    if (avgEnergy < 40) {
      insights.push({ type: 'energy', text: 'Your energy has been lower in recent check-ins. Rest is not a setback — it is part of the rhythm.' })
    }
    if (avgStress > 65) {
      insights.push({ type: 'stress', text: 'Stress has been running high. A smaller next step might help more than pushing through.' })
    }
    const moodCounts = {}
    recent.forEach(c => { if (c.mood) moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1 })
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
    if (topMood && topMood[1] >= 2) {
      insights.push({ type: 'mood', text: `You have felt ${topMood[0].toLowerCase()} most often in recent check-ins. That is worth noticing — not a label, just a clue.` })
    }
  }

  if (ctx.goalTitles.length > 0) {
    insights.push({ type: 'goals', text: `You are working on ${ctx.goalTitles.length} goal${ctx.goalTitles.length > 1 ? 's' : ''}. What is the smallest step you could take today?` })
  }

  if (ctx.interestNames.length > 0) {
    insights.push({ type: 'interests', text: `You are curious about ${ctx.interestNames.slice(0, 3).join(', ')}. Explore could have something new for you.` })
  }

  if (insights.length === 0) {
    insights.push({ type: 'welcome', text: 'Novie is learning your rhythm. Check in daily, journal when you want, and the patterns will start to surface.' })
  }

  return insights
}

export function getDailyReflection(ctx) {
  const pool = [...REFLECTION_QUESTIONS, ...CONNECTION_QUESTIONS]
  const dayIndex = Math.floor(Date.now() / 86400000) % pool.length
  return pool[dayIndex]
}

export function rewriteMessage(text, style) {
  const base = text || 'I want to talk about what happened without making this worse.'
  const map = {
    Gentle: `I care about us, and I want to talk about this when we both have room to listen. ${base}`,
    Direct: `I want to be clear about what I need. ${base}`,
    Loving: `I love and care about you, and I do not want this to sit between us. ${base}`,
    'Firm boundary': `I want to communicate clearly about what I can and cannot accept. ${base}`,
    'Short text': base,
    'Repair-focused': `I do not need us to agree on everything. I would like us to understand each other and figure out what comes next. ${base}`,
    Playful: `Okay, tiny serious moment before we overthink this: ${base}`,
    Reassuring: `We can talk about this without assuming the worst. ${base}`,
  }
  return map[style] || base
}

export function getZodiacSign(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const ranges = [
    [3, 21, 'Aries'], [4, 20, 'Taurus'], [5, 21, 'Gemini'], [6, 21, 'Cancer'],
    [7, 23, 'Leo'], [8, 23, 'Virgo'], [9, 23, 'Libra'], [10, 23, 'Scorpio'],
    [11, 22, 'Sagittarius'], [12, 22, 'Capricorn'], [1, 20, 'Aquarius'], [2, 19, 'Pisces'],
  ]
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [m, d, name] = ranges[i]
    if (month > m || (month === m && day >= d)) return name
  }
  return 'Capricorn'
}

export function getMoonPhase(date = new Date()) {
  const phases = MOON_PHASES
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const days = (date - known) / 86400000
  const phaseNum = ((days % synodic) + synodic) % synodic
  const index = Math.floor((phaseNum / synodic) * 8) % 8
  return phases[index]
}
