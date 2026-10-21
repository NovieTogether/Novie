import { ZODIAC_SIGNS, MOON_PHASES } from './constants.js'

// ─── Sun Sign ─────────────────────────────────────────────────────────────────
// Uses the existing getZodiacSign from ai.js but we re-implement here for
// self-containment. Date-only calculation is accurate to the day.

export function getSunSign(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T12:00:00')
  if (isNaN(date.getTime())) return null
  const month = date.getMonth() + 1
  const day = date.getDate()
  const ranges = [
    [3, 21, 'Aries'], [4, 20, 'Taurus'], [5, 21, 'Gemini'], [6, 21, 'Cancer'],
    [7, 23, 'Leo'], [8, 23, 'Virgo'], [9, 23, 'Libra'], [10, 23, 'Scorpio'],
    [11, 22, 'Sagittarius'], [12, 22, 'Capricorn'], [1, 20, 'Aquarius'], [2, 19, 'Pisces'],
  ]
  // Sort by month then day so we can find the correct sign
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [m, d, name] = ranges[i]
    if (month > m || (month === m && day >= d)) return name
  }
  return 'Capricorn'
}

// ─── Moon Sign ────────────────────────────────────────────────────────────────
// Simplified Meeus algorithm for lunar longitude. Accurate to ~1-2 degrees
// for modern dates. Good enough for sign determination (sign boundaries are
// 30 degrees apart), though a sign boundary cusp result should be flagged.

function normalize360(deg) {
  return ((deg % 360) + 360) % 360
}

function toRadians(deg) { return deg * Math.PI / 180 }

// Calculates the Moon's ecliptic longitude using a simplified version of
// Meeus' "Astronomical Algorithms" (Chapter 47, simplified).
export function getMoonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0

  // Moon's mean longitude (L')
  let Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
  Lp = normalize360(Lp)

  // Moon's mean elongation (D)
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
  D = normalize360(D)

  // Sun's mean anomaly (M)
  let M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T
  M = normalize360(M)

  // Moon's mean anomaly (M')
  let Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T
  Mp = normalize360(Mp)

  // Moon's argument of latitude (F)
  let F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T
  F = normalize360(F)

  // Major periodic terms (simplified — the 4 biggest terms from Table 47.A)
  let longitude = Lp
    + 6.289 * Math.sin(toRadians(Mp))
    - 1.274 * Math.sin(toRadians(2 * D - Mp))
    + 0.658 * Math.sin(toRadians(2 * D))
    - 0.186 * Math.sin(toRadians(M))
    - 0.059 * Math.sin(toRadians(2 * Mp - 2 * D))
    - 0.057 * Math.sin(toRadians(2 * D - M - Mp))
    + 0.053 * Math.sin(toRadians(2 * D + Mp))
    + 0.046 * Math.sin(toRadians(2 * D - M))
    + 0.041 * Math.sin(toRadians(Mp - M))
    - 0.035 * Math.sin(toRadians(D))
    - 0.031 * Math.sin(toRadians(M + Mp))
    - 0.015 * Math.sin(toRadians(2 * F - 2 * D))
    + 0.011 * Math.sin(toRadians(Mp - 2 * D))

  return normalize360(longitude)
}

// Convert a date/time to Julian Day Number
function toJulianDay(dateStr, timeStr) {
  let date
  if (timeStr) {
    date = new Date(`${dateStr}T${timeStr}`)
  } else {
    // Noon UTC if no time given (minimizes day-boundary error)
    date = new Date(`${dateStr}T12:00:00Z`)
  }
  if (isNaN(date.getTime())) return null
  return date.getTime() / 86400000 + 2440587.5
}

export function getMoonSign(dateStr, timeStr) {
  if (!dateStr) return null
  const jd = toJulianDay(dateStr, timeStr)
  if (!jd) return null
  const longitude = getMoonLongitude(jd)
  const signIndex = Math.floor(longitude / 30)
  const degreesInSign = longitude - (signIndex * 30)
  const sign = ZODIAC_SIGNS[signIndex]
  const nearCusp = degreesInSign < 1.5 || degreesInSign > 28.5

  return {
    sign: sign.name,
    symbol: sign.symbol,
    element: sign.element,
    degreesInSign: Math.round(degreesInSign * 10) / 10,
    longitude: Math.round(longitude * 10) / 10,
    nearCusp,
    accuracy: timeStr ? 'Good (birth time used)' : 'Approximate (no birth time — Moon may shift ±1 sign near cusps)',
  }
}

// ─── Moon Phase (re-exported from ai.js logic, kept here for consolidation) ──

export function getCurrentMoonPhase(date = new Date()) {
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const days = (date - known) / 86400000
  const phaseNum = ((days % synodic) + synodic) % synodic
  const phaseFraction = phaseNum / synodic
  const index = Math.floor(phaseFraction * 8) % 8
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phaseFraction)) / 2 * 100)
  return {
    ...MOON_PHASES[index],
    illumination: illumination,
    phaseFraction: Math.round(phaseFraction * 100) / 100,
  }
}

// ─── Element & Modality helpers ───────────────────────────────────────────────

export const ELEMENTS = {
  Fire: { signs: ['Aries', 'Leo', 'Sagittarius'], trait: 'Passionate, active, initiating. Driven by inspiration and the desire to move.' },
  Earth: { signs: ['Taurus', 'Virgo', 'Capricorn'], trait: 'Grounded, practical, patient. Values stability and tangible results.' },
  Air: { signs: ['Gemini', 'Libra', 'Aquarius'], trait: 'Intellectual, communicative, social. Processes through ideas and connection.' },
  Water: { signs: ['Cancer', 'Scorpio', 'Pisces'], trait: 'Emotional, intuitive, deep. Experiences life through feeling and inner knowing.' },
}

export const MODALITIES = {
  Cardinal: { signs: ['Aries', 'Cancer', 'Libra', 'Capricorn'], trait: 'Initiators. They start things and respond to new seasons with action.' },
  Fixed: { signs: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'], trait: 'Stabilizers. They sustain what was started and resist unnecessary change.' },
  Mutable: { signs: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'], trait: 'Adapters. They are flexible and help transition from one phase to the next.' },
}

export function getSignElement(signName) {
  const entry = Object.entries(ELEMENTS).find(([_, val]) => val.signs.includes(signName))
  return entry ? entry[0] : null
}

export function getSignModality(signName) {
  const entry = Object.entries(MODALITIES).find(([_, val]) => val.signs.includes(signName))
  return entry ? entry[0] : null
}

// ─── In-depth sign interpretations ────────────────────────────────────────────
// Authored content. Clearly framed as interpretive practice, not science.

export const SIGN_INTERPRETATIONS = {
  Aries: {
    archetype: 'The Pioneer',
    coreDrive: 'To initiate, to be first, to move energy into action.',
    strengths: 'Courageous, direct, honest, energetic, natural leader. You thrive when you can start something new and see immediate momentum.',
    challenges: 'Impatience with slower processes, anger that flares and passes quickly, a tendency to start more than you finish.',
    emotionalTendency: 'Emotions arrive fast and intensely. You feel things in the moment and may need to learn to pause before expressing.',
    needs: 'Autonomy, challenge, the freedom to act, physical movement, and honest direct communication.',
    communicationStyle: 'Direct and assertive. You say what you think and expect the same. You may need to slow down for people who need context first.',
    growthEdge: 'Channeling your initiative into sustained follow-through. Finishing what you start can be more courageous than beginning.',
    reflectionQuestions: [
      'Where in your life are you holding back the impulse to start something?',
      'What would it look like to finish one thing you began with passion?',
      'How do you handle anger — does it serve you or surprise you?',
    ],
  },
  Taurus: {
    archetype: 'The Builder',
    coreDrive: 'To create stability, beauty, and comfort that lasts.',
    strengths: 'Patient, reliable, sensual, grounded, loyal. You excel at building something solid over time and savoring life\'s pleasures.',
    challenges: 'Resistance to change, possessiveness, stubbornness when pushed. Comfort can become stagnation.',
    emotionalTendency: 'Emotions build slowly and run deep. You process through the body and senses before through words.',
    needs: 'Security, beauty, touch, consistency, time to adjust to change, and a sense of ownership over your environment.',
    communicationStyle: 'Deliberate and practical. You do not waste words. You show care through presence and tangible acts, not declarations.',
    growthEdge: 'Learning that change can bring stability too. Sometimes letting go of the familiar opens space for something even more secure.',
    reflectionQuestions: [
      'What are you holding onto that has stopped being a source of comfort?',
      'Where might change actually create more security, not less?',
      'How do you express care through action rather than words?',
    ],
  },
  Gemini: {
    archetype: 'The Messenger',
    coreDrive: 'To learn, connect ideas, and share information.',
    strengths: 'Curious, adaptable, quick-witted, versatile, communicative. You see connections others miss and can talk to anyone.',
    challenges: 'Scattered attention, overthinking, inconsistency, difficulty committing to one path when many are interesting.',
    emotionalTendency: 'Emotions are processed through thinking. You may intellectualize feelings before feeling them, which can create distance.',
    needs: 'Mental stimulation, variety, conversation, movement, and the freedom to change your mind.',
    communicationStyle: 'Fast, varied, and engaging. You connect through words and ideas. You may need to slow down for emotional depth.',
    growthEdge: 'Sustained depth. Choosing one thread and following it further than the next interesting distraction.',
    reflectionQuestions: [
      'What is one interest worth going deep on instead of wide?',
      'When do you intellectualize a feeling instead of feeling it?',
      'What helps you stay present when your mind wants to move on?',
    ],
  },
  Cancer: {
    archetype: 'The Nurturer',
    coreDrive: 'To create safety, care for others, and protect what matters.',
    strengths: 'Empathetic, intuitive, loyal, protective, emotionally intelligent. You create spaces where people feel safe.',
    challenges: 'Moodiness, over-identification with others\' emotions, retreating into your shell when hurt, holding onto the past.',
    emotionalTendency: 'Deep and tidal. Your emotions shift with the moon. You feel others\' feelings as if they were your own.',
    needs: 'Emotional safety, a sense of home, trusted people, privacy to process, and permission to retreat when overwhelmed.',
    communicationStyle: 'Indirect and emotionally attuned. You communicate through feeling, not just words. You may need to practice saying what you need directly.',
    growthEdge: 'Caring for yourself as deeply as you care for others. Learning that your needs are not less important.',
    reflectionQuestions: [
      'Where are you caring for others at the expense of your own needs?',
      'What does emotional safety look like for you right now?',
      'When you retreat, what helps you come back?',
    ],
  },
  Leo: {
    archetype: 'The Performer',
    coreDrive: 'To express, create, and be seen for who you truly are.',
    strengths: 'Warm, generous, creative, confident, loyal. You bring light to rooms and naturally encourage others to shine.',
    challenges: 'Need for recognition, pride that hides vulnerability, taking things personally, performing instead of being authentic.',
    emotionalTendency: 'Emotions are expressed boldly and dramatically. You feel deeply and want others to witness and validate what you feel.',
    needs: 'Recognition (genuine, not flattery), creative expression, play, warmth, and the freedom to be center stage sometimes.',
    communicationStyle: 'Expressive, warm, and theatrical. You communicate with presence and heart. You may need to make space for quieter voices.',
    growthEdge: 'Worth that does not depend on applause. Letting yourself be seen without performing.',
    reflectionQuestions: [
      'Where are you performing instead of being authentic?',
      'What would it feel like to be valued for who you are, not what you produce?',
      'How do you respond when you are not the center of attention?',
    ],
  },
  Virgo: {
    archetype: 'The Craftsperson',
    coreDrive: 'To refine, improve, and be of practical service.',
    strengths: 'Analytical, detail-oriented, reliable, humble, genuinely helpful. You see what needs fixing and quietly fix it.',
    challenges: 'Perfectionism, self-criticism, anxiety about getting it wrong, focusing on flaws at the expense of the whole.',
    emotionalTendency: 'Emotions are processed through analysis. You may try to solve feelings before feeling them.',
    needs: 'Usefulness, order, competence, recognition of effort (not just results), and a manageable scope.',
    communicationStyle: 'Precise, practical, and sometimes critical. You communicate to improve. You may need to lead with appreciation before suggestions.',
    growthEdge: 'Self-compassion. Treating yourself with the care you give to others. Letting "good enough" be good enough.',
    reflectionQuestions: [
      'Where is perfectionism preventing you from starting or finishing?',
      'How would you treat a friend who made the mistake you are criticizing yourself for?',
      'What would it look like to appreciate the whole before fixing the parts?',
    ],
  },
  Libra: {
    archetype: 'The Diplomat',
    coreDrive: 'To create harmony, beauty, and fair partnership.',
    strengths: 'Diplomatic, fair, charming, collaborative, aesthetically sensitive. You naturally mediate and seek solutions that work for everyone.',
    challenges: 'Indecision, avoiding conflict, losing yourself in others\' preferences, people-pleasing at the expense of your own needs.',
    emotionalTendency: 'Emotions are filtered through relationships. You feel best in harmony and may suppress your own feelings to maintain peace.',
    needs: 'Balance, partnership, beauty, fairness, time alone to find your own opinion, and the freedom to disagree.',
    communicationStyle: 'Gracious and considerate. You frame things to avoid offense. You may need to practice being direct even when it creates friction.',
    growthEdge: 'Knowing your own opinion without needing someone else\'s first. Conflict that leads to truth is better than harmony that hides it.',
    reflectionQuestions: [
      'Where are you hiding your own preference to keep the peace?',
      'What would it look like to disagree kindly but clearly?',
      'When was the last time you made a decision without consulting anyone?',
    ],
  },
  Scorpio: {
    archetype: 'The Detective',
    coreDrive: 'To understand deeply, to transform, and to find truth beneath the surface.',
    strengths: 'Deep, perceptive, loyal, brave, transformative. You see what others hide and can hold darkness without flinching.',
    challenges: 'Jealousy, control, holding grudges, suspicion, intensity that can overwhelm. You may test people before trusting them.',
    emotionalTendency: 'Emotions run extremely deep. You feel everything, but you may not show it. You process in private and take time to trust.',
    needs: 'Depth, honesty, privacy, emotional intensity, loyalty, and the freedom to be in control of what you share.',
    communicationStyle: 'Penetrating and selective. You ask questions that go straight to the core. You may need to share more of yourself, not just observe.',
    growthEdge: 'Letting go. Trust that releasing control does not mean losing power. Vulnerability is not weakness.',
    reflectionQuestions: [
      'What are you holding onto that you know you need to release?',
      'Where is control a defense against being hurt again?',
      'What would it look like to trust before you have proof?',
    ],
  },
  Sagittarius: {
    archetype: 'The Explorer',
    coreDrive: 'To seek meaning, expand horizons, and find truth through experience.',
    strengths: 'Optimistic, adventurous, philosophical, honest, generous. You inspire others with vision and a sense of possibility.',
    challenges: 'Overpromising, restlessness, bluntness that hurts without meaning to, commitment avoidance.',
    emotionalTendency: 'Emotions are processed through meaning-making. You look for the lesson. You may skip past the feeling to get to the insight.',
    needs: 'Freedom, adventure, meaning, honesty, learning, and the space to change plans.',
    communicationStyle: 'Enthusiastic and direct. You share ideas with conviction. You may need to check whether your honesty serves the listener or just your need to say it.',
    growthEdge: 'Staying with discomfort. Some feelings do not have a lesson. Being present without seeking the meaning can be its own wisdom.',
    reflectionQuestions: [
      'Where are you seeking the lesson instead of feeling the feeling?',
      'What would it look like to commit to one path without knowing where it leads?',
      'When does your honesty serve you more than the other person?',
    ],
  },
  Capricorn: {
    archetype: 'The Architect',
    coreDrive: 'To build something lasting through discipline and long vision.',
    strengths: 'Disciplined, responsible, strategic, patient, dry-witted. You excel at long-term goals and leading by example.',
    challenges: 'Emotional reserve, overworking, measuring worth by achievement, difficulty asking for help.',
    emotionalTendency: 'Emotions are held in check. You may see feelings as a distraction from the goal. You process privately and slowly.',
    needs: 'Structure, respect, purpose, tangible progress, competence, and recognition earned through work.',
    communicationStyle: 'Measured and practical. You communicate to get things done. You may need to make space for emotional expression, not just logistics.',
    growthEdge: 'Worth that does not depend on productivity. Rest that is not earned. Allowing yourself to be cared for.',
    reflectionQuestions: [
      'Where is your sense of worth tied to what you produce?',
      'What would rest look like if you did not have to earn it first?',
      'Who would you let in if being strong did not mean being alone?',
    ],
  },
  Aquarius: {
    archetype: 'The Visionary',
    coreDrive: 'To innovate, connect communities, and see beyond the current paradigm.',
    strengths: 'Original, humanitarian, independent, intellectually brave, community-minded. You see possibilities others cannot.',
    challenges: 'Emotional detachment, contrarianism for its own sake, valuing the collective over the individual in front of you.',
    emotionalTendency: 'Emotions are processed intellectually. You may understand your feelings from a distance without feeling them in your body.',
    needs: 'Freedom, intellectual stimulation, community, a cause, and the space to be different.',
    communicationStyle: 'Unconventional and idea-driven. You communicate to connect minds. You may need to slow down for emotional and relational presence.',
    growthEdge: 'Intimacy. Allowing yourself to be known by one person, not just understood by many. Feelings are not a disruption to your ideals.',
    reflectionQuestions: [
      'Where are you detaching from a feeling you need to actually feel?',
      'What would it look like to be known by one person, not just understood by many?',
      'When does being different become a wall instead of a contribution?',
    ],
  },
  Pisces: {
    archetype: 'The Mystic',
    coreDrive: 'To merge, to imagine, and to connect with something beyond the visible.',
    strengths: 'Compassionate, artistic, intuitive, gentle, spiritually sensitive. You feel the unseen and can hold space for others\' pain.',
    challenges: 'Boundary dissolution, escapism, over-sensitivity, difficulty distinguishing your feelings from others\'.',
    emotionalTendency: 'Emotions are fluid and permeable. You absorb the atmosphere of a room. You may not know where your feelings end and others\' begin.',
    needs: 'Solitude, beauty, spiritual connection, creative expression, gentle environments, and clear boundaries.',
    communicationStyle: 'Poetic and indirect. You communicate through feeling, imagery, and presence. You may need to practice concrete, direct language.',
    growthEdge: 'Boundaries as compassion, not walls. Knowing where you end and others begin protects your ability to care.',
    reflectionQuestions: [
      'Whose feelings are you carrying that are not yours?',
      'What would a compassionate boundary look like in your life right now?',
      'Where are you escaping instead of feeling?',
    ],
  },
}

// ─── Planet interpretations ───────────────────────────────────────────────────
// Used for educational display — we only calculate Sun and Moon placements
// reliably. Other planets are explained as concepts.

export const PLANET_MEANINGS = [
  { symbol: '☉', name: 'Sun', theme: 'Core identity, ego, life purpose, how you shine. The essence of who you are.' },
  { symbol: '☽', name: 'Moon', theme: 'Emotional inner world, instincts, comfort, what you need to feel safe. Your emotional operating system.' },
  { symbol: '☿', name: 'Mercury', theme: 'How you think, communicate, and process information. Your mental style and how you learn.' },
  { symbol: '♀', name: 'Venus', theme: 'What you value, how you love, what brings pleasure and beauty. Your approach to relationships and aesthetics.' },
  { symbol: '♂', name: 'Mars', theme: 'Drive, desire, anger, how you take action. Your energy and how you pursue what you want.' },
  { symbol: '♃', name: 'Jupiter', theme: 'Growth, expansion, meaning, optimism. Where you seek wisdom and where you may overextend.' },
  { symbol: '♄', name: 'Saturn', theme: 'Discipline, structure, limitation, responsibility. Where you are tested and where you build mastery.' },
  { symbol: '♅', name: 'Uranus', theme: 'Innovation, freedom, sudden change, rebellion. Where you break patterns and seek authenticity.' },
  { symbol: '♆', name: 'Neptune', theme: 'Dreams, illusion, spirituality, compassion. Where you merge with the infinite and where you may lose yourself.' },
  { symbol: '♇', name: 'Pluto', theme: 'Transformation, power, death and rebirth, the deepest truths. Where you are remade.' },
]

// ─── House meanings (educational) ─────────────────────────────────────────────

export const HOUSE_MEANINGS = [
  { num: 1, theme: 'Self, identity, how others see you first. The mask you wear and the energy you walk into a room with.' },
  { num: 2, theme: 'Values, resources, money, self-worth. What you own and what owns you.' },
  { num: 3, theme: 'Communication, learning, siblings, short journeys. How you process and share information.' },
  { num: 4, theme: 'Home, family, roots, inner foundation. Where you come from and what makes you feel safe.' },
  { num: 5, theme: 'Creativity, play, children, romance. How you express yourself for joy.' },
  { num: 6, theme: 'Work, health, daily routines, service. How you maintain yourself day to day.' },
  { num: 7, theme: 'Partnership, marriage, close relationships. What you seek in others and what they mirror.' },
  { num: 8, theme: 'Transformation, intimacy, shared resources, the shadow. Where you go deep and where you are changed.' },
  { num: 9, theme: 'Higher education, travel, philosophy, meaning. How you seek truth beyond the personal.' },
  { num: 10, theme: 'Career, public role, reputation, legacy. What you are known for in the world.' },
  { num: 11, theme: 'Community, friendships, hopes, groups. Where you belong to something larger.' },
  { num: 12, theme: 'The unconscious, solitude, spirituality, hidden things. Where you rest, retreat, and dissolve.' },
]

// ─── Aspect meanings (educational) ────────────────────────────────────────────

export const ASPECT_MEANINGS = [
  { name: 'Conjunction (0°)', theme: 'Two energies merge and amplify. They act together — sometimes harmoniously, sometimes with tension.' },
  { name: 'Sextile (60°)', theme: 'Flowing opportunity. Two energies support each other with gentle ease. Requires awareness to activate.' },
  { name: 'Square (90°)', theme: 'Tension and growth. Two energies conflict, creating pressure that drives development. Uncomfortable but productive.' },
  { name: 'Trine (120°)', theme: 'Natural harmony. Two energies flow effortlessly. Gifts that may be taken for granted if not consciously used.' },
  { name: 'Opposition (180°)', theme: 'Polarity and awareness. Two energies pull in opposite directions, requiring integration. Often projected onto others.' },
]

// ─── Element combination descriptions (for Sun/Moon pairing) ──────────────────

export function getSunMoonElementDescription(sunSign, moonSign) {
  const sunEl = getSignElement(sunSign)
  const moonEl = getSignElement(moonSign)

  if (sunEl === moonEl) {
    return `Your Sun and Moon share the ${sunEl} element. This creates internal consistency — your identity and emotional needs speak the same language. You may rarely feel at odds with yourself, but you may also benefit from exploring qualities outside your element for balance.`
  }

  const combos = {
    'Fire-Earth': 'Your identity is fired by vision (Fire Sun) while your emotions seek stability (Earth Moon). You feel deeply but process practically. The tension is between your desire to move and your need for security.',
    'Earth-Fire': 'Your identity is grounded and practical (Earth Sun) while your emotions are fired by passion (Fire Moon). You present as steady but feel intensely. You may surprise people with your inner heat.',
    'Fire-Air': 'Your identity is fired by action (Fire Sun) while your emotions process through ideas (Air Moon). You are energetic and intellectual. The risk is living in your head or your impulses without touching your body.',
    'Air-Fire': 'Your identity is mental and social (Air Sun) while your emotions are passionate and quick (Fire Moon). You think fast and feel fast. The challenge is slowing down enough to integrate both.',
    'Fire-Water': 'Your identity is bold and direct (Fire Sun) while your emotions are deep and sensitive (Water Moon). You have a warm exterior and a tender interior. You may protect your vulnerability with outward strength.',
    'Water-Fire': 'Your identity is sensitive and intuitive (Water Sun) while your emotions are passionate and quick (Fire Moon). You feel everything, deeply and fast. You may need to learn to sit with intensity without acting on it immediately.',
    'Earth-Air': 'Your identity is practical and grounded (Earth Sun) while your emotions process through ideas (Air Moon). You are sensible and thoughtful. The challenge is connecting your mind to your body and feelings.',
    'Air-Earth': 'Your identity is mental and social (Air Sun) while your emotions seek stability (Earth Moon). You think broadly but feel quietly. You may intellectualize your needs instead of meeting them.',
    'Earth-Water': 'Your identity is practical and patient (Earth Sun) while your emotions are deep and fluid (Water Moon). You are grounded and tender. You feel things slowly but profoundly.',
    'Water-Earth': 'Your identity is sensitive and intuitive (Water Sun) while your emotions seek stability (Earth Moon). You are gentle and steady. You may absorb others\' emotions and need time alone to distinguish yours.',
    'Air-Water': 'Your identity is mental and social (Air Sun) while your emotions are deep and intuitive (Water Moon). You understand feelings from both the mind and the heart. The risk is over-processing emotions instead of feeling them.',
    'Water-Air': 'Your identity is sensitive and intuitive (Water Sun) while your emotions process through ideas (Air Moon). You feel deeply and think clearly. You may analyze your feelings instead of sitting with them.',
  }

  return combos[`${sunEl}-${moonEl}`] || `Your Sun in ${sunEl} and Moon in ${moonEl} create a dynamic inner relationship between your identity and your emotional needs.`
}
