import { MOODS, REFLECTION_QUESTIONS, CONNECTION_QUESTIONS, SCIENCE_LESSONS, MOON_PHASES, AFFIRMATIONS, EMOTIONS_CREATE, CREATIVE_ACTIVITIES } from './constants.js'

// Context-aware AI reply generation
// Uses the user's check-ins, journal, goals, and profile to build personalized responses
// Does NOT fabricate facts, memories, or patterns the user hasn't shared

// Default privacy settings — used when no saved settings exist yet.
// All categories default to enabled EXCEPT astrology, matching the original UI defaults.
const DEFAULT_PRIVACY = {
  checkins_enabled: true,
  journal_enabled: true,
  goals_enabled: true,
  interests_enabled: true,
  astrology_enabled: false,
  memories_enabled: true,
  reflections_enabled: true,
  habits_enabled: true,
  artwork_enabled: true,
}

export function buildContext({ profile, checkins, journal, goals, reflections, memories, interests, habits, artworkCount, privacySettings }) {
  const p = { ...DEFAULT_PRIVACY, ...(privacySettings || {}) }

  const ctx = {
    name: profile?.name || '',
    role: profile?.role || '',
    energy: p.checkins_enabled ? (checkins[0]?.energy ?? null) : null,
    stress: p.checkins_enabled ? (checkins[0]?.stress ?? null) : null,
    mood: p.checkins_enabled ? (checkins[0]?.mood ?? null) : null,
    connection: p.checkins_enabled ? (checkins[0]?.connection ?? null) : null,
    interestNames: p.interests_enabled ? (interests?.map(i => i.name) || []) : [],
    goalTitles: p.goals_enabled ? (goals?.filter(g => g.status === 'active').map(g => g.title) || []) : [],
    goalCount: p.goals_enabled ? (goals?.filter(g => g.status === 'active').length || 0) : 0,
    completedGoals: p.goals_enabled ? (goals?.filter(g => g.status === 'completed').length || 0) : 0,
    recentJournal: p.journal_enabled ? (journal?.slice(0, 3).map(j => j.content).join(' ') || '') : '',
    journalCount: p.journal_enabled ? (journal?.length || 0) : 0,
    recentReflections: p.reflections_enabled ? (reflections?.slice(0, 3).map(r => r.answer).join(' ') || '') : '',
    reflectionCount: p.reflections_enabled ? (reflections?.length || 0) : 0,
    memoryContents: p.memories_enabled ? (memories?.filter(m => m.approved).map(m => m.content) || []) : [],
    memoryCount: p.memories_enabled ? (memories?.length || 0) : 0,
    habitNames: p.habits_enabled ? (habits?.filter(h => h.active).map(h => h.name) || []) : [],
    habitStreaks: p.habits_enabled ? (habits?.map(h => h.streak_count || 0) || []) : [],
    artworkCount: p.artwork_enabled ? (artworkCount || 0) : 0,
    checkinCount: p.checkins_enabled ? (checkins?.length || 0) : 0,
    streak: profile?.streak || 0,
    xp: profile?.xp || 0,
    checkins: p.checkins_enabled ? checkins : [],
    astrologyEnabled: p.astrology_enabled,
    privacySettings: p,
  }
  return ctx
}

export function generateReply(input, ctx) {
  const t = (input || '').toLowerCase()
  const name = ctx.name ? `${ctx.name}, ` : ''
  const lowEnergy = ctx.energy !== null && ctx.energy < 35
  const highStress = ctx.stress !== null && ctx.stress > 70

  // Memory-aware: if the user references something we have a memory about
  if (ctx.memoryContents.length > 0 && t.length > 8) {
    const matchedMemory = ctx.memoryContents.find(m => {
      const words = m.toLowerCase().split(/\s+/)
      return words.some(w => w.length > 4 && t.includes(w))
    })
    if (matchedMemory && !t.includes('help') && !t.includes('what can you do')) {
      return `${name}you shared this with me: "${matchedMemory}" — I will treat that as context, not a conclusion. How does that connect to what is on your mind right now?`
    }
  }

  if (t.includes('relationship') || t.includes('partner') || t.includes('friend') || t.includes('family') || t.includes('fight') || t.includes('conflict') || t.includes('communicat')) {
    const connHint = ctx.mood === 'Frustrated' ? ' You seem frustrated in your last check-in. That is worth acknowledging before the conversation.' : ''
    return `${name}begin with what happened, what you felt, what you needed, and what you want next. You do not have to prove who was right to make the next conversation better.${connHint} The Communication Lab in Explore can help you turn the messy version into words you can actually send.`
  }

  if (t.includes('stuck') || t.includes('overwhelm') || t.includes('overwhelmed') || t.includes('too much')) {
    return `${name}make the next step smaller than your brain thinks it needs to be. What can be done in ten minutes — or what can safely wait? ${highStress ? 'Your last check-in showed high stress. That is a signal to go smaller, not push harder.' : ''} If you want, I can suggest a tiny creative activity — drawing can help when words feel like too much.`
  }

  if (t.includes('fun') || t.includes('play') || t.includes('bored') || t.includes('game')) {
    return `${name}try a Would You Rather round in Play, a silly kids activity, a question from the deck, or explore something you have never tapped before. Play is not a waste of growth time — it is part of it.`
  }

  if (t.includes('astrology') || t.includes('zodiac') || t.includes('moon') || t.includes('star') || t.includes('chart') || t.includes('horoscope')) {
    return `${name}astrology can be a playful mirror. Open Explore → Astrology to add birth details and wander through Sun, Moon, Rising and moon-cycle reflections. It is for reflection and fun, not scientific prediction. I will not invent placements — only work with what you share.`
  }

  if (t.includes('reset') || t.includes('tired') || t.includes('exhausted') || t.includes('burnt') || t.includes('burnout') || t.includes('rest')) {
    return `${name}drop your shoulders, take one slower breath, and choose only the next five minutes. ${lowEnergy ? 'Your energy has been low. Rest is not the opposite of growth — it is part of it.' : 'Nothing needs to be fixed right now.'} You could also try Create for how you feel — a mandala or free drawing can be a gentle reset without needing words.`
  }

  if (t.includes('goal') || t.includes('habit') || t.includes('track') || t.includes('progress')) {
    const goalsList = ctx.goalTitles.length ? ` You are currently working on: ${ctx.goalTitles.join(', ')}.` : ''
    const habitInfo = ctx.habitNames.length ? ` Your habits: ${ctx.habitNames.join(', ')}${ctx.habitStreaks.some(s => s > 0) ? `. Some have streaks going — that is real momentum.` : '.'}` : ''
    return `${name}small repeated actions build more than grand gestures.${goalsList}${habitInfo} What is the smallest version of this that you could start in two minutes? You can track goals and habits in Grow.`
  }

  if (t.includes('journal') || t.includes('write') || t.includes('reflect') || t.includes('feeling')) {
    return `${name}writing helps you see what thinking alone cannot. You can journal freely in Grow → Journal. ${ctx.journalCount > 0 ? `You have ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} saved — you might notice what is similar or different today.` : 'You do not need to write a lot. One honest sentence is enough.'}`
  }

  if (t.includes('understand') || t.includes('myself') || t.includes('self') || t.includes('who am i') || t.includes('pattern') || t.includes('notice')) {
    const patterns = getPatternExplanation(ctx)
    let patternText = ''
    if (patterns && patterns.length > 0) {
      const p = patterns[0]
      patternText = ` Here is something I noticed: ${p.observation} ${p.interpretation} ${p.suggestion} (Confidence: ${p.confidence} — this is an observation, not a diagnosis.)`
    }
    return `${name}self-understanding comes from noticing, not from one big answer. ${ctx.checkinCount > 3 ? `You have ${ctx.checkinCount} check-ins saved.${patternText}` : 'Try a reflection question in Grow, or check in daily for a week and see what repeats.'} The point is curiosity, not a verdict.`
  }

  if (t.includes('surprise') || t.includes('random') || t.includes('recommend')) {
    const suggestions = getCrossAppSuggestions(ctx)
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)]
    return `${name}${pick.text}`
  }

  if (t.includes('anxious') || t.includes('anxiety') || t.includes('worried') || t.includes('worry') || t.includes('scared') || t.includes('afraid') || t.includes('nervous')) {
    return `${name}name what you are afraid of specifically, if you can. Vague fear feels bigger than specific fear. ${highStress ? 'Your stress has been high — a tiny reset might help before you try to think it through.' : ''} This is a feeling, not a forecast. If anxiety feels overwhelming, reaching out to someone you trust or a professional is always the right call.`
  }

  if (t.includes('sad') || t.includes('depressed') || t.includes('down') || t.includes('lonely') || t.includes('alone') || t.includes('grief') || t.includes('grieving')) {
    return `${name}I hear you. What you are feeling is real. ${ctx.connection !== null && ctx.connection < 45 ? 'Your check-in suggested you might be craving more connection. Even a small reach-out can help.' : ''} You do not have to fix this right now. One small, kind thing for yourself is enough. If you are in crisis, please contact a crisis line — Novie is not a substitute for professional support.`
  }

  if (t.includes('grateful') || t.includes('gratitude') || t.includes('thankful')) {
    return `${name}gratitude works best when it is specific. Instead of "I am grateful for my friends," try "I am grateful that [name] texted me today." The detail is what changes the feeling. You can write this in Grow → Journal.`
  }

  if (t.includes('creat') || t.includes('draw') || t.includes('art') || t.includes('color') || t.includes('paint')) {
    return `${name}you can draw, color, or create in Create for how you feel — accessible from Today or Explore. ${ctx.artworkCount > 0 ? `You have saved ${ctx.artworkCount} ${ctx.artworkCount === 1 ? 'piece' : 'pieces'} of artwork.` : 'No artistic ability needed. It is about expression, not the result.'} Mandala, nature scenes, free canvas, and celestial themes are all available.`
  }

  if (t.includes('garden') || t.includes('plant') || t.includes('tree') || t.includes('grow')) {
    return `${name}your Garden is at ${ctx.xp} XP. You can choose your plant and seasonal theme in Grow → Garden — flowers, trees, bonsai, cactus, and more. Halloween, Christmas, and other seasonal themes are optional layers. Changing your plant never resets XP or achievements.`
  }

  if (t.includes('learn') || t.includes('teach') || t.includes('study') || t.includes('knowledge') || t.includes('skill')) {
    const learn = getLearningSuggestion(ctx)
    if (learn && learn.length > 0) {
      return `${name}the World Map has learning paths. ${learn[0].reason} Open the World tab to explore ${learn[0].pathId.replace(/_/g, ' ')} and other paths.`
    }
    return `${name}the World Map has destinations like Seedling Grove, River of Understanding, and the Celestial Observatory. Open the World tab to explore.`
  }

  if (t.includes('help') || t.includes('what can you do') || t.includes('what do you do')) {
    return `${name}I can help you reflect, understand patterns from your check-ins, prepare for conversations, set small goals, explore astrology playfully, find creative activities, or just think out loud. I use what you have shared — ${ctx.checkinCount} check-ins, ${ctx.journalCount} journal entries, ${ctx.memoryCount} memories, ${ctx.goalCount} active goals — but only to suggest, never to decide for you. Tell me what is on your mind, or pick one of the quick paths above.`
  }

  // Default — gentle, open, uses available context
  const contextBits = []
  if (ctx.goalTitles.length) contextBits.push(`working on: ${ctx.goalTitles.join(', ')}`)
  if (ctx.habitNames.length) contextBits.push(`building habits: ${ctx.habitNames.slice(0, 2).join(', ')}`)
  if (ctx.checkinCount > 0 && ctx.mood) contextBits.push(`last mood: ${ctx.mood}`)
  const contextText = contextBits.length ? ` I can see you are ${contextBits.join('; ')}.` : ''
  return `${name}you do not need to solve everything today. Start with one honest question, one tiny experiment, or one thing that makes you curious.${contextText} You can always change direction.`
}

export function getCrossAppSuggestions(ctx) {
  const suggestions = []

  if (ctx.checkinCount === 0) {
    suggestions.push({ text: 'Start with a check-in on the Today tab. It takes ten seconds and gives me something real to work with.', nav: 'today' })
  }
  if (ctx.checkinCount > 0 && ctx.journalCount === 0) {
    suggestions.push({ text: 'You have checked in but not journaled yet. Try writing one sentence in Grow → Journal. Seeing your own words later can reveal things.', nav: 'grow' })
  }
  if (ctx.checkinCount >= 3) {
    const patterns = getPatternExplanation(ctx)
    if (patterns && patterns.length > 0) {
      suggestions.push({ text: `I noticed something across your check-ins: ${patterns[0].title}. Open Explore → My patterns to see more.`, nav: 'explore' })
    }
  }
  if (ctx.artworkCount === 0) {
    suggestions.push({ text: 'You have not tried Create yet. Drawing or coloring can be a way to feel without needing words. Open Create from Today or Explore.', nav: 'today' })
  }
  if (ctx.interestNames.length > 0) {
    const interest = ctx.interestNames[Math.floor(Math.random() * ctx.interestNames.length)]
    suggestions.push({ text: `Since you are curious about ${interest}, try exploring something adjacent in Explore, or open the World Map to find a learning path.`, nav: 'explore' })
  }
  if (ctx.goalCount === 0) {
    suggestions.push({ text: 'You have no active goals. That is fine — but if something matters next, Grow → Goals is where to plant it.', nav: 'grow' })
  }
  suggestions.push({ text: 'Try a Would You Rather round in Play. Two minutes, no stakes, just fun.', nav: 'play' })
  suggestions.push({ text: 'Open the World Map. New destinations unlock as your XP grows.', nav: 'world' })

  return suggestions.length > 0 ? suggestions : [{ text: 'Wander freely. Check in, journal, create, or ask me anything.', nav: 'today' }]
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

export function getDailyAffirmation() {
  const dayIndex = Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length
  return AFFIRMATIONS[dayIndex]
}

export function recommendPlant(ctx) {
  if (!ctx) return null
  const reasons = []
  let recommended = 'seedling'

  if (ctx.interestNames?.includes('Nature') || ctx.interestNames?.includes('Outdoors')) {
    recommended = 'tree'
    reasons.push('Your interest in nature and the outdoors pairs well with a tree.')
  } else if (ctx.interestNames?.includes('Art') || ctx.interestNames?.includes('Creativity')) {
    recommended = 'flower'
    reasons.push('Your creative interests match a flowering plant that blooms expressively.')
  } else if (ctx.interestNames?.includes('Meditation') || ctx.interestNames?.includes('Writing')) {
    recommended = 'bonsai'
    reasons.push('Your reflective interests suit a bonsai — patient, intentional growth.')
  } else if (ctx.interestNames?.includes('Fitness') || ctx.interestNames?.includes('Animals')) {
    recommended = 'cactus'
    reasons.push('Your active interests match a resilient cactus that thrives with energy.')
  } else if (ctx.goalTitles?.length > 2) {
    recommended = 'vine'
    reasons.push('You are pursuing multiple goals — a vine climbs in many directions, like you.')
  } else if (ctx.checkinCount < 3) {
    recommended = 'seedling'
    reasons.push('You are just starting. A seedling grows alongside you.')
  } else {
    recommended = 'leafy'
    reasons.push('You are building steadily. A leafy plant fills out as you do.')
  }

  return { plantId: recommended, reasons }
}

export function getCreativeSuggestion(emotionId, ctx) {
  const emotion = EMOTIONS_CREATE.find(e => e.id === emotionId)
  if (!emotion) return null
  const activity = CREATIVE_ACTIVITIES.find(a => a.id === emotion.suggestion)
  return {
    emotion,
    activity,
    reason: emotion.reason,
  }
}

export function getPatternExplanation(ctx) {
  if (!ctx || ctx.checkinCount < 3) {
    return null
  }
  const explanations = []
  const recent = ctx.checkins?.slice(0, 5)
  if (!recent || recent.length < 3) return null

  const avgEnergy = recent.reduce((s, c) => s + (c.energy || 50), 0) / recent.length
  const avgStress = recent.reduce((s, c) => s + (c.stress || 30), 0) / recent.length

  if (avgEnergy < 40) {
    explanations.push({
      type: 'energy',
      title: 'Energy has been lower',
      observation: `Your average energy across ${recent.length} recent check-ins is ${Math.round(avgEnergy)}%.`,
      interpretation: 'This could reflect poor sleep, stress, or a demanding period. It is an observation, not a diagnosis.',
      suggestion: 'Consider whether rest, hydration, or a smaller to-do list might help. A check-in with a healthcare provider is always valid if low energy persists.',
      confidence: 'moderate',
    })
  }

  if (avgStress > 65) {
    explanations.push({
      type: 'stress',
      title: 'Stress has been running high',
      observation: `Your average stress across ${recent.length} recent check-ins is ${Math.round(avgStress)}%.`,
      interpretation: 'Chronic stress can affect sleep, mood, and relationships. This pattern is worth paying attention to.',
      suggestion: 'A tiny reset, slower breathing, or simplifying one commitment might help. If stress feels unmanageable, reaching out to someone you trust is a good step.',
      confidence: 'moderate',
    })
  }

  const moodCounts = {}
  recent.forEach(c => { if (c.mood) moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1 })
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
  if (topMood && topMood[1] >= 2) {
    explanations.push({
      type: 'mood',
      title: `${topMood[0]} appears most often`,
      observation: `You selected "${topMood[0]}" in ${topMood[1]} of your last ${recent.length} check-ins.`,
      interpretation: 'A recurring mood can be a clue about what is present in your life right now. It is not a permanent label.',
      suggestion: 'Consider what situations tend to accompany this feeling. Journaling about it might reveal a pattern worth understanding.',
      confidence: topMood[1] >= 3 ? 'higher' : 'low',
    })
  }

  return explanations.length > 0 ? explanations : null
}

export function getLearningSuggestion(ctx) {
  if (!ctx) return null
  const suggestions = []

  if (ctx.checkinCount >= 3 && ctx.stress > 60) {
    suggestions.push({ pathId: 'emotional_awareness', reason: 'Your stress has been elevated — learning to notice and name what you feel can create more space to respond.' })
  }
  if (ctx.goalTitles?.length > 0) {
    suggestions.push({ pathId: 'habits_growth', reason: 'You are working on goals — understanding how habits form can help you make real progress.' })
  }
  if (ctx.interestNames?.includes('Astrology')) {
    suggestions.push({ pathId: 'astrology_basics', reason: 'You are curious about astrology — start with the foundations.' })
  }
  if (ctx.interestNames?.includes('Art') || ctx.interestNames?.includes('Creativity')) {
    suggestions.push({ pathId: 'creativity', reason: 'Your creative interests open a path into mindful expression.' })
  }
  if (connectionsCount(ctx) > 0) {
    suggestions.push({ pathId: 'communication', reason: 'You have connections in Novie — communication skills can deepen those relationships.' })
  }
  if (suggestions.length === 0) {
    suggestions.push({ pathId: 'emotional_awareness', reason: 'A great starting point for understanding yourself better.' })
  }
  return suggestions
}

function connectionsCount(ctx) {
  return ctx.connection !== null && ctx.connection !== undefined ? 1 : 0
}
