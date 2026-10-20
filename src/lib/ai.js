import { MOODS, REFLECTION_QUESTIONS, CONNECTION_QUESTIONS, SCIENCE_LESSONS, MOON_PHASES, AFFIRMATIONS, EMOTIONS_CREATE, CREATIVE_ACTIVITIES } from './constants.js'

// Context-aware AI reply generation
// Uses the user's check-ins, journal, goals, and profile to build personalized responses
// Does NOT fabricate facts, memories, or patterns the user hasn't shared

// Default privacy settings — used when no saved settings exist yet.
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
    // Rich data for cross-feature analysis
    journalEntries: p.journal_enabled ? (journal || []) : [],
    goalList: p.goals_enabled ? (goals || []) : [],
    habitList: p.habits_enabled ? (habits || []) : [],
    reflectionList: p.reflections_enabled ? (reflections || []) : [],
  }
  return ctx
}

// ─── Pattern Analysis ──────────────────────────────────────────────────────

function avg(nums) {
  if (!nums || nums.length === 0) return null
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

function trend(nums) {
  if (!nums || nums.length < 2) return null
  const firstHalf = nums.slice(Math.ceil(nums.length / 2))
  const secondHalf = nums.slice(0, Math.ceil(nums.length / 2))
  const a = avg(firstHalf.map(n => n))
  const b = avg(secondHalf.map(n => n))
  if (a === null || b === null) return null
  return b - a
}

function confidenceLabel(count) {
  if (count >= 5) return 'moderate'
  if (count >= 3) return 'low'
  return 'very low'
}

export function getPatternExplanation(ctx) {
  if (!ctx || ctx.checkinCount < 3) return null
  const explanations = []
  const recent = ctx.checkins?.slice(0, 8)
  if (!recent || recent.length < 3) return null

  const energies = recent.map(c => c.energy || 50)
  const stresses = recent.map(c => c.stress || 30)
  const connections = recent.map(c => c.connection ?? null)
  const avgEnergy = avg(energies)
  const avgStress = avg(stresses)
  const energyTrend = trend(energies)
  const stressTrend = trend(stresses)

  // Energy pattern
  if (avgEnergy !== null && avgEnergy < 40) {
    explanations.push({
      type: 'energy',
      title: 'Energy has been lower',
      observation: `Your average energy across ${recent.length} recent check-ins is ${Math.round(avgEnergy)}%.`,
      interpretation: 'This could reflect poor sleep, stress, or a demanding period. It is an observation, not a diagnosis.',
      suggestion: 'Consider whether rest, hydration, or a smaller to-do list might help. A check-in with a healthcare provider is always valid if low energy persists.',
      confidence: confidenceLabel(recent.length),
      evidence: `${recent.length} check-ins, average energy ${Math.round(avgEnergy)}%`,
    })
  }

  // Energy trend — declining or improving
  if (energyTrend !== null && Math.abs(energyTrend) > 12) {
    if (energyTrend < 0) {
      explanations.push({
        type: 'energy_trend',
        title: 'Energy appears to be declining',
        observation: `Your energy in earlier check-ins was higher than in more recent ones, dropping by about ${Math.abs(Math.round(energyTrend))} points on average.`,
        interpretation: 'This could mean something is draining your energy recently. It might be worth checking what changed — sleep, workload, stress, or something else.',
        suggestion: 'Consider what was different when your energy was higher. Even one small change back toward that pattern could help.',
        confidence: confidenceLabel(recent.length),
        evidence: `Trend across ${recent.length} check-ins, shift of ${Math.abs(Math.round(energyTrend))} points`,
      })
    } else {
      explanations.push({
        type: 'energy_trend',
        title: 'Energy appears to be improving',
        observation: `Your energy in more recent check-ins is higher than earlier ones, rising by about ${Math.round(energyTrend)} points on average.`,
        interpretation: 'Something may be working — rest, a change in routine, or a shift in circumstances. This is a positive sign, not a fluke.',
        suggestion: 'Notice what changed. Whatever you are doing differently, it might be worth keeping.',
        confidence: confidenceLabel(recent.length),
        evidence: `Trend across ${recent.length} check-ins, shift of ${Math.round(energyTrend)} points`,
      })
    }
  }

  // Stress pattern
  if (avgStress !== null && avgStress > 65) {
    explanations.push({
      type: 'stress',
      title: 'Stress has been running high',
      observation: `Your average stress across ${recent.length} recent check-ins is ${Math.round(avgStress)}%.`,
      interpretation: 'Chronic stress can affect sleep, mood, and relationships. This pattern is worth paying attention to.',
      suggestion: 'A tiny reset, slower breathing, or simplifying one commitment might help. If stress feels unmanageable, reaching out to someone you trust is a good step.',
      confidence: confidenceLabel(recent.length),
      evidence: `${recent.length} check-ins, average stress ${Math.round(avgStress)}%`,
    })
  }

  // Stress trend
  if (stressTrend !== null && Math.abs(stressTrend) > 12) {
    if (stressTrend > 0) {
      explanations.push({
        type: 'stress_trend',
        title: 'Stress appears to be increasing',
        observation: `Your stress in more recent check-ins is higher than earlier ones, rising by about ${Math.round(stressTrend)} points on average.`,
        interpretation: 'Something may be adding pressure recently. It is worth identifying what changed if you can.',
        suggestion: 'If you can name the source of the pressure, it often feels more manageable. Try journaling about what is different right now.',
        confidence: confidenceLabel(recent.length),
        evidence: `Trend across ${recent.length} check-ins, shift of ${Math.round(stressTrend)} points`,
      })
    } else {
      explanations.push({
        type: 'stress_trend',
        title: 'Stress appears to be easing',
        observation: `Your stress in more recent check-ins is lower than earlier ones, dropping by about ${Math.abs(Math.round(stressTrend))} points on average.`,
        interpretation: 'Something may be helping — a change in routine, a resolved situation, or better boundaries. This is a positive direction.',
        suggestion: 'Notice what eased. Whatever reduced the pressure, it is worth recognizing and continuing.',
        confidence: confidenceLabel(recent.length),
        evidence: `Trend across ${recent.length} check-ins, shift of ${Math.abs(Math.round(stressTrend))} points`,
      })
    }
  }

  // Mood frequency
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
      confidence: topMood[1] >= 3 ? 'low' : 'very low',
      evidence: `${topMood[1]} of ${recent.length} check-ins`,
    })
  }

  // Cross-feature: stress-energy inverse correlation
  if (avgEnergy !== null && avgStress !== null && avgEnergy < 45 && avgStress > 60) {
    explanations.push({
      type: 'correlation',
      title: 'Low energy and high stress together',
      observation: `Your recent check-ins show both low energy (${Math.round(avgEnergy)}%) and high stress (${Math.round(avgStress)}%) at the same time.`,
      interpretation: 'These often go together — stress can drain energy, and low energy can make stress feel heavier. This is a possible connection, not a certainty.',
      suggestion: 'Addressing either one might help the other. A short walk, a few slow breaths, or reducing one commitment could break the cycle gently.',
      confidence: confidenceLabel(recent.length),
      evidence: `Both metrics from ${recent.length} check-ins`,
    })
  }

  // Cross-feature: connection and mood
  const validConnections = connections.filter(c => c !== null)
  if (validConnections.length >= 3) {
    const avgConn = avg(validConnections)
    if (avgConn !== null && avgConn < 45 && topMood && (topMood[0] === 'Lonely' || topMood[0] === 'Sad' || topMood[0] === 'Overwhelmed')) {
      explanations.push({
        type: 'correlation',
        title: 'Low connection scores alongside difficult moods',
        observation: `Your connection scores have been low (average ${Math.round(avgConn)}%) and you have felt ${topMood[0].toLowerCase()} most often recently.`,
        interpretation: 'Feeling disconnected can amplify difficult emotions. This is a possible link worth exploring, not a conclusion.',
        suggestion: 'Even a small reach-out — a text, a walk with someone, a shared activity — can help. The Connect tab has ways to think through relationships.',
        confidence: 'low',
        evidence: `${validConnections.length} check-ins with connection data, mood frequency ${topMood[1]}`,
      })
    }
  }

  // Cross-feature: journaling and stress
  if (ctx.journalCount > 0 && ctx.journalEnabled !== false && avgStress !== null) {
    const journalAfterStress = ctx.journalEntries?.some(j => {
      const jDate = new Date(j.created_at).toDateString()
      const matchingCheckin = ctx.checkins?.find(c => new Date(c.created_at).toDateString() === jDate)
      return matchingCheckin && (matchingCheckin.stress || 0) > 60
    })
    if (journalAfterStress) {
      explanations.push({
        type: 'correlation',
        title: 'You journal on high-stress days',
        observation: 'You have written journal entries on days when your check-in stress was elevated.',
        interpretation: 'Writing on hard days can be a healthy way to process. It might be helping you manage even if it does not feel like it is fixing anything.',
        suggestion: 'Continue this habit. Re-reading those entries later might show you what helped and what did not.',
        confidence: 'low',
        evidence: 'Matched journal entries to check-in dates with stress > 60%',
      })
    }
  }

  // Cross-feature: habits and streak
  if (ctx.habitStreaks && ctx.habitStreaks.length > 0) {
    const maxStreak = Math.max(...ctx.habitStreaks)
    if (maxStreak >= 7) {
      explanations.push({
        type: 'habit',
        title: `Strong habit streak — ${maxStreak} days`,
        observation: `Your longest habit streak is ${maxStreak} days.`,
        interpretation: 'Sustaining a habit for over a week is real momentum. This is behavioral evidence of consistency, not a fluke.',
        suggestion: 'Acknowledge this. You are proving you can build something. If you want, add one more tiny habit alongside it.',
        confidence: 'moderate',
        evidence: `Habit streak of ${maxStreak} days`,
      })
    }
  }

  return explanations.length > 0 ? explanations : null
}

// ─── Personalized Suggestions ──────────────────────────────────────────────

export function getPersonalizedSuggestions(ctx) {
  const suggestions = []
  const patterns = getPatternExplanation(ctx)

  // Based on patterns — connect to specific features
  if (patterns) {
    const energyPattern = patterns.find(p => p.type === 'energy' || p.type === 'energy_trend')
    if (energyPattern && energyPattern.observation?.includes('lower') || energyPattern?.title?.includes('declining')) {
      suggestions.push({
        text: `Your energy has been lower. Try a 3-minute breathing exercise in Explore → Wellness, or write one sentence about what might be draining you in Grow → Journal.`,
        nav: 'explore',
        reason: 'Low energy pattern detected from check-ins',
      })
    }
    const stressPattern = patterns.find(p => p.type === 'stress' || p.type === 'stress_trend')
    if (stressPattern && (stressPattern.title?.includes('high') || stressPattern.title?.includes('increasing'))) {
      suggestions.push({
        text: `Stress is elevated. Open the Communication Lab if it is relationship-related, or try Create → Mandala — repetitive patterns can calm a racing mind.`,
        nav: 'explore',
        reason: 'High stress pattern detected from check-ins',
      })
    }
    const connPattern = patterns.find(p => p.type === 'correlation' && p.title?.includes('connection'))
    if (connPattern) {
      suggestions.push({
        text: `Connection scores have been low. Open Connect to think through a relationship, or try a question from the Play → Question Deck with someone you trust.`,
        nav: 'connect',
        reason: 'Low connection pattern detected from check-ins',
      })
    }
  }

  // Based on goals
  if (ctx.goalCount > 0) {
    suggestions.push({
      text: `You are working on ${ctx.goalTitles[0]}. What is the smallest step you could take in the next two minutes? Open Grow → Goals to track it.`,
      nav: 'grow',
      reason: 'Active goal detected',
    })
  }

  // Based on habits
  if (ctx.habitNames.length > 0) {
    const longestStreak = Math.max(...ctx.habitStreaks)
    if (longestStreak >= 3) {
      suggestions.push({
        text: `Your habit "${ctx.habitNames[0]}" has a ${longestStreak}-day streak. Keep it going — open Grow to check it off today.`,
        nav: 'grow',
        reason: 'Active habit streak detected',
      })
    }
  }

  // Based on journaling
  if (ctx.journalCount === 0 && ctx.checkinCount > 0) {
    suggestions.push({
      text: 'You have checked in but not journaled. Try writing one sentence in Grow → Journal. Seeing your own words later can reveal things check-ins cannot.',
      nav: 'grow',
      reason: 'No journal entries despite active check-ins',
    })
  } else if (ctx.journalCount > 0 && ctx.reflectionCount === 0) {
    suggestions.push({
      text: 'You have journaled but not tried a reflection question. Open Grow → Self-discovery for a prompt that might surface something new.',
      nav: 'grow',
      reason: 'No reflections despite journaling',
    })
  }

  // Based on artwork
  if (ctx.artworkCount === 0) {
    suggestions.push({
      text: 'You have not tried Create yet. Drawing or coloring can be a way to feel without needing words. Open Create from Today or Explore.',
      nav: 'today',
      reason: 'No artwork created yet',
    })
  }

  // Based on interests
  if (ctx.interestNames.length > 0) {
    const interest = ctx.interestNames[0]
    const learnPaths = getLearningSuggestion(ctx)
    if (learnPaths && learnPaths.length > 0) {
      suggestions.push({
        text: `Since you are curious about ${interest}, the World Map has a learning path that might interest you: ${learnPaths[0].pathId.replace(/_/g, ' ')}. ${learnPaths[0].reason}`,
        nav: 'world',
        reason: 'Interest detected, matching learning path available',
      })
    }
  }

  // Reflection suggestion
  suggestions.push({
    text: `Today's reflection question is waiting in Grow. You do not have to answer it — but if something surfaces, one honest sentence is enough.`,
    nav: 'grow',
    reason: 'Daily reflection available',
  })

  // Play suggestion
  suggestions.push({
    text: 'Try a Would You Rather round in Play. Two minutes, no stakes, just fun.',
    nav: 'play',
    reason: 'Always available',
  })

  return suggestions.length > 0 ? suggestions : [{ text: 'Wander freely. Check in, journal, create, or ask me anything.', nav: 'today', reason: 'Default' }]
}

// ─── Scripted Reply Generation ─────────────────────────────────────────────

export function generateReply(input, ctx) {
  const t = (input || '').toLowerCase()
  const name = ctx.name ? `${ctx.name}, ` : ''
  const lowEnergy = ctx.energy !== null && ctx.energy < 35
  const highStress = ctx.stress !== null && ctx.stress > 70
  const patterns = getPatternExplanation(ctx)

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

  // Pattern-aware: if user asks about patterns and we have real ones
  if ((t.includes('pattern') || t.includes('notice') || t.includes('trend') || t.includes('change')) && patterns && patterns.length > 0) {
    const lines = patterns.slice(0, 3).map(p => {
      return `${p.title}: ${p.observation} ${p.interpretation} (Confidence: ${p.confidence}. Evidence: ${p.evidence}.)`
    })
    return `${name}here is what I can see from your data:\n\n${lines.join('\n\n')}\n\nThese are observations from your permitted check-in data, not diagnoses. You can explore these in Explore → My patterns, or tell me which one feels most relevant.`
  }

  // Self-understanding with real patterns
  if (t.includes('understand') || t.includes('myself') || t.includes('self') || t.includes('who am i')) {
    let patternSection = ''
    if (patterns && patterns.length > 0) {
      const p = patterns[0]
      patternSection = ` Here is something from your data: ${p.observation} ${p.interpretation} (Confidence: ${p.confidence} — this is an observation, not a diagnosis.)`
    }
    const reflectionNote = ctx.reflectionCount > 0
      ? ` You have answered ${ctx.reflectionCount} reflection question${ctx.reflectionCount === 1 ? '' : 's'} — re-reading them might reveal how your thinking has shifted.`
      : ' Try a reflection question in Grow → Self-discovery, or check in daily for a week and see what repeats.'
    return `${name}self-understanding comes from noticing, not from one big answer.${patternSection}${reflectionNote} The point is curiosity, not a verdict.`
  }

  // Relationship / communication
  if (t.includes('relationship') || t.includes('partner') || t.includes('friend') || t.includes('family') || t.includes('fight') || t.includes('conflict') || t.includes('communicat')) {
    const connHint = ctx.mood === 'Frustrated' ? ' Your last check-in showed frustration — that is worth acknowledging before the conversation.' : ''
    const connData = ctx.connection !== null && ctx.connection < 45 ? ' Your connection scores have been low recently, which might be relevant.' : ''
    return `${name}begin with what happened, what you felt, what you needed, and what you want next. You do not have to prove who was right to make the next conversation better.${connHint}${connData} The Communication Lab in Explore can help you turn the messy version into words you can actually send.`
  }

  // Stuck / overwhelmed
  if (t.includes('stuck') || t.includes('overwhelm') || t.includes('overwhelmed') || t.includes('too much')) {
    const stressData = highStress ? ` Your last check-in showed stress at ${ctx.stress}%. That is a signal to go smaller, not push harder.` : ''
    const suggestion = ctx.artworkCount > 0 ? ' You have used Create before — drawing might help again when words feel like too much.' : ' If you want, I can suggest a tiny creative activity — drawing can help when words feel like too much.'
    return `${name}make the next step smaller than your brain thinks it needs to be. What can be done in ten minutes — or what can safely wait?${stressData}${suggestion}`
  }

  // Fun / play
  if (t.includes('fun') || t.includes('play') || t.includes('bored') || t.includes('game')) {
    return `${name}try a Would You Rather round in Play, a silly kids activity, a question from the deck, or explore something you have never tapped before. Play is not a waste of growth time — it is part of it.`
  }

  // Astrology
  if (t.includes('astrology') || t.includes('zodiac') || t.includes('moon') || t.includes('star') || t.includes('chart') || t.includes('horoscope')) {
    const astroAccess = ctx.astrologyEnabled ? '' : ' You have astrology data disabled in your privacy settings — enable it in Grow → AI memory & privacy if you want me to use your birth info.'
    return `${name}astrology can be a playful mirror. Open Explore → Astrology to add birth details and wander through Sun, Moon, Rising and moon-cycle reflections. It is for reflection and fun, not scientific prediction. I will not invent placements — only work with what you share.${astroAccess}`
  }

  // Reset / tired
  if (t.includes('reset') || t.includes('tired') || t.includes('exhausted') || t.includes('burnt') || t.includes('burnout') || t.includes('rest')) {
    const energyData = lowEnergy ? ` Your energy has been at ${ctx.energy}%.` : ''
    return `${name}drop your shoulders, take one slower breath, and choose only the next five minutes.${energyData} Rest is not the opposite of growth — it is part of it. You could also try Create for how you feel — a mandala or free drawing can be a gentle reset without needing words.`
  }

  // Goals / habits
  if (t.includes('goal') || t.includes('habit') || t.includes('track') || t.includes('progress')) {
    const goalsList = ctx.goalTitles.length ? ` You are currently working on: ${ctx.goalTitles.join(', ')}.` : ' You have no active goals right now — that is fine.'
    const habitInfo = ctx.habitNames.length ? ` Your habits: ${ctx.habitNames.join(', ')}${ctx.habitStreaks.some(s => s > 0) ? `. Your longest streak is ${Math.max(...ctx.habitStreaks)} days — that is real momentum.` : '.'}` : ''
    return `${name}small repeated actions build more than grand gestures.${goalsList}${habitInfo} What is the smallest version of this that you could start in two minutes? You can track goals and habits in Grow.`
  }

  // Journal / write
  if (t.includes('journal') || t.includes('write') || t.includes('reflect') || t.includes('feeling')) {
    const journalData = ctx.journalCount > 0
      ? ` You have ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} saved. You might notice what is similar or different today by re-reading one.`
      : ' You do not need to write a lot. One honest sentence is enough.'
    return `${name}writing helps you see what thinking alone cannot. You can journal freely in Grow → Journal.${journalData}`
  }

  // Surprised / recommend
  if (t.includes('surprise') || t.includes('random') || t.includes('recommend')) {
    const suggestions = getPersonalizedSuggestions(ctx)
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)]
    return `${name}${pick.text}`
  }

  // Anxious
  if (t.includes('anxious') || t.includes('anxiety') || t.includes('worried') || t.includes('worry') || t.includes('scared') || t.includes('afraid') || t.includes('nervous')) {
    const stressData = highStress ? ` Your stress has been at ${ctx.stress}% — a tiny reset might help before you try to think it through.` : ''
    return `${name}name what you are afraid of specifically, if you can. Vague fear feels bigger than specific fear.${stressData} This is a feeling, not a forecast. If anxiety feels overwhelming, reaching out to someone you trust or a professional is always the right call.`
  }

  // Sad / lonely
  if (t.includes('sad') || t.includes('depressed') || t.includes('down') || t.includes('lonely') || t.includes('alone') || t.includes('grief') || t.includes('grieving')) {
    const connData = ctx.connection !== null && ctx.connection < 45 ? ' Your check-in suggested you might be craving more connection. Even a small reach-out can help.' : ''
    const moodFreq = patterns?.find(p => p.type === 'mood')
    const moodNote = moodFreq ? ` You have felt ${moodFreq.title.split(' ')[0].toLowerCase()} in ${moodFreq.evidence}.` : ''
    return `${name}I hear you. What you are feeling is real.${connData}${moodNote} You do not have to fix this right now. One small, kind thing for yourself is enough. If you are in crisis, please contact a crisis line — Novie is not a substitute for professional support.`
  }

  // Gratitude
  if (t.includes('grateful') || t.includes('gratitude') || t.includes('thankful')) {
    return `${name}gratitude works best when it is specific. Instead of "I am grateful for my friends," try "I am grateful that [name] texted me today." The detail is what changes the feeling. You can write this in Grow → Journal.`
  }

  // Create / draw
  if (t.includes('creat') || t.includes('draw') || t.includes('art') || t.includes('color') || t.includes('paint')) {
    const artData = ctx.artworkCount > 0 ? ` You have saved ${ctx.artworkCount} ${ctx.artworkCount === 1 ? 'piece' : 'pieces'} of artwork.` : ' No artistic ability needed. It is about expression, not the result.'
    return `${name}you can draw, color, or create in Create for how you feel — accessible from Today or Explore.${artData} Mandala, nature scenes, free canvas, and celestial themes are all available.`
  }

  // Garden
  if (t.includes('garden') || t.includes('plant') || t.includes('tree') || t.includes('grow')) {
    const stageInfo = ctx.streak > 0 ? ` Your streak is ${ctx.streak} days.` : ''
    return `${name}your Garden is at ${ctx.xp} XP with ${ctx.streak} leaves.${stageInfo} You can choose your plant and seasonal theme in Grow → Garden — flowers, trees, bonsai, cactus, and more. Changing your plant or theme never resets XP or achievements.`
  }

  // Learn
  if (t.includes('learn') || t.includes('teach') || t.includes('study') || t.includes('knowledge') || t.includes('skill')) {
    const learn = getLearningSuggestion(ctx)
    if (learn && learn.length > 0) {
      return `${name}the World Map has learning paths. ${learn[0].reason} Open the World tab to explore ${learn[0].pathId.replace(/_/g, ' ')} and other paths.`
    }
    return `${name}the World Map has destinations like Seedling Grove, River of Understanding, and the Celestial Observatory. Open the World tab to explore.`
  }

  // Help / what can you do
  if (t.includes('help') || t.includes('what can you do') || t.includes('what do you do')) {
    const dataSummary = `${ctx.checkinCount} check-ins, ${ctx.journalCount} journal entries, ${ctx.memoryCount} memories, ${ctx.goalCount} active goals, ${ctx.habitNames.length} habits, ${ctx.reflectionCount} reflections, ${ctx.artworkCount} artworks`
    const patternNote = patterns && patterns.length > 0 ? ` I can see ${patterns.length} possible pattern${patterns.length === 1 ? '' : 's'} from your data — ask me about them.` : ''
    return `${name}I can help you reflect, understand patterns from your check-ins, prepare for conversations, set small goals, explore astrology playfully, find creative activities, or just think out loud. I use what you have shared — ${dataSummary} — but only to suggest, never to decide for you.${patternNote} Tell me what is on your mind, or pick one of the quick paths above.`
  }

  // Default — uses available context, offers specific suggestions
  const contextBits = []
  if (ctx.goalTitles.length) contextBits.push(`working on: ${ctx.goalTitles.join(', ')}`)
  if (ctx.habitNames.length) contextBits.push(`building habits: ${ctx.habitNames.slice(0, 2).join(', ')}`)
  if (ctx.checkinCount > 0 && ctx.mood) contextBits.push(`last mood: ${ctx.mood}`)
  if (ctx.checkinCount > 0 && ctx.energy !== null) contextBits.push(`energy: ${ctx.energy}%`)
  const contextText = contextBits.length ? ` I can see you are ${contextBits.join('; ')}.` : ''

  // Add a specific suggestion based on what is most relevant
  const suggestions = getPersonalizedSuggestions(ctx)
  const topSuggestion = suggestions[0]
  const suggestionText = topSuggestion ? `\n\nIf you want a starting point: ${topSuggestion.text}` : ''

  return `${name}you do not need to solve everything today. Start with one honest question, one tiny experiment, or one thing that makes you curious.${contextText}${suggestionText} You can always change direction.`
}

// ─── Cross-app suggestions (backward compatible) ───────────────────────────

export function getCrossAppSuggestions(ctx) {
  return getPersonalizedSuggestions(ctx)
}

// ─── Insights for Today screen ─────────────────────────────────────────────

export function generateInsight(ctx) {
  const insights = []
  const patterns = getPatternExplanation(ctx)

  if (patterns) {
    for (const p of patterns.slice(0, 3)) {
      insights.push({ type: p.type, text: `${p.title}: ${p.observation} ${p.interpretation}` })
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

// ─── Remaining utility functions (unchanged) ───────────────────────────────

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
