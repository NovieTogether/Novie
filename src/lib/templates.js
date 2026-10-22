// Coloring templates — each draws black outlines on a canvas context.
// All templates assume an 800x400 canvas (matching DrawingCanvas dimensions).
// Line width is kept generous for visibility on mobile.

export const COLORING_TEMPLATES = [
  {
    id: 'flower',
    name: 'Flower',
    icon: '🌷',
    draw: drawFlower,
  },
  {
    id: 'leaf',
    name: 'Leaf',
    icon: '🍃',
    draw: drawLeaf,
  },
  {
    id: 'mandala',
    name: 'Mandala',
    icon: '🌀',
    draw: drawMandala,
  },
  {
    id: 'mountains',
    name: 'Mountain Scene',
    icon: '⛰️',
    draw: drawMountains,
  },
  {
    id: 'geometric',
    name: 'Geometric',
    icon: '🔷',
    draw: drawGeometric,
  },
  {
    id: 'celestial',
    name: 'Celestial',
    icon: '🌙',
    draw: drawCelestial,
  },
]

const OUTLINE = '#2d3a32'
const LW = 3

function drawFlower(ctx) {
  const cx = 400, cy = 200
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Center circle
  ctx.beginPath()
  ctx.arc(cx, cy, 35, 0, Math.PI * 2)
  ctx.stroke()

  // 8 petals
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const px = cx + Math.cos(angle) * 70
    const py = cy + Math.sin(angle) * 70
    ctx.beginPath()
    ctx.ellipse(px, py, 40, 25, angle, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Stem
  ctx.beginPath()
  ctx.moveTo(cx, cy + 35)
  ctx.lineTo(cx, 380)
  ctx.stroke()

  // Leaves on stem
  ctx.beginPath()
  ctx.ellipse(cx - 30, 300, 25, 12, -0.5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx + 30, 340, 25, 12, 0.5, 0, Math.PI * 2)
  ctx.stroke()
}

function drawLeaf(ctx) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Main leaf shape
  ctx.beginPath()
  ctx.moveTo(400, 40)
  ctx.bezierCurveTo(560, 80, 600, 280, 400, 370)
  ctx.bezierCurveTo(200, 280, 240, 80, 400, 40)
  ctx.stroke()

  // Central vein
  ctx.beginPath()
  ctx.moveTo(400, 40)
  ctx.lineTo(400, 370)
  ctx.stroke()

  // Side veins
  for (let i = 1; i <= 5; i++) {
    const y = 40 + (i / 6) * 330
    const w = 120 - Math.abs(i - 3) * 20
    ctx.beginPath()
    ctx.moveTo(400, y)
    ctx.quadraticCurveTo(400 + w * 0.6, y + 15, 400 + w, y + 30)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(400, y)
    ctx.quadraticCurveTo(400 - w * 0.6, y + 15, 400 - w, y + 30)
    ctx.stroke()
  }
}

function drawMandala(ctx) {
  const cx = 400, cy = 200
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Concentric circles
  [30, 65, 100, 140, 175].forEach(r => {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Petals at each ring
  const rings = [
    { r: 65, count: 8, petalR: 18 },
    { r: 100, count: 12, petalR: 16 },
    { r: 140, count: 16, petalR: 14 },
  ]
  rings.forEach(ring => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2
      const px = cx + Math.cos(angle) * ring.r
      const py = cy + Math.sin(angle) * ring.r
      ctx.beginPath()
      ctx.ellipse(px, py, ring.petalR, ring.petalR * 0.6, angle, 0, Math.PI * 2)
      ctx.stroke()
    }
  })

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.stroke()
}

function drawMountains(ctx) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Sun
  ctx.beginPath()
  ctx.arc(650, 80, 35, 0, Math.PI * 2)
  ctx.stroke()
  // Sun rays
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(650 + Math.cos(angle) * 45, 80 + Math.sin(angle) * 45)
    ctx.lineTo(650 + Math.cos(angle) * 60, 80 + Math.sin(angle) * 60)
    ctx.stroke()
  }

  // Mountain 1 (left, bigger)
  ctx.beginPath()
  ctx.moveTo(50, 350)
  ctx.lineTo(250, 120)
  ctx.lineTo(400, 350)
  ctx.stroke()

  // Mountain 2 (right)
  ctx.beginPath()
  ctx.moveTo(300, 350)
  ctx.lineTo(500, 160)
  ctx.lineTo(650, 350)
  ctx.stroke()

  // Snow caps
  ctx.beginPath()
  ctx.moveTo(210, 160)
  ctx.lineTo(250, 120)
  ctx.lineTo(290, 160)
  ctx.lineTo(270, 150)
  ctx.lineTo(250, 140)
  ctx.lineTo(230, 150)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(470, 195)
  ctx.lineTo(500, 160)
  ctx.lineTo(530, 195)
  ctx.lineTo(510, 185)
  ctx.lineTo(500, 175)
  ctx.lineTo(490, 185)
  ctx.closePath()
  ctx.stroke()

  // Ground line
  ctx.beginPath()
  ctx.moveTo(0, 350)
  ctx.lineTo(800, 350)
  ctx.stroke()

  // Trees
  drawTree(ctx, 100, 350, 30)
  drawTree(ctx, 720, 350, 25)
}

function drawTree(ctx, x, baseY, size) {
  // Trunk
  ctx.beginPath()
  ctx.moveTo(x - size * 0.15, baseY)
  ctx.lineTo(x - size * 0.15, baseY - size * 0.8)
  ctx.lineTo(x + size * 0.15, baseY - size * 0.8)
  ctx.lineTo(x + size * 0.15, baseY)
  ctx.stroke()

  // Triangular foliage layers
  for (let layer = 0; layer < 3; layer++) {
    const y = baseY - size * 0.8 - layer * size * 0.5
    const w = size * (0.8 - layer * 0.15)
    ctx.beginPath()
    ctx.moveTo(x - w, y)
    ctx.lineTo(x, y - size * 0.6)
    ctx.lineTo(x + w, y)
    ctx.stroke()
  }
}

function drawGeometric(ctx) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Overlapping circles
  const circles = [
    { x: 300, y: 200, r: 100 },
    { x: 500, y: 200, r: 100 },
    { x: 400, y: 130, r: 80 },
    { x: 400, y: 270, r: 80 },
    { x: 200, y: 130, r: 60 },
    { x: 600, y: 270, r: 60 },
  ]
  circles.forEach(c => {
    ctx.beginPath()
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Squares
  ctx.beginPath()
  ctx.rect(120, 120, 60, 60)
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(620, 120, 60, 60)
  ctx.stroke()

  // Triangle
  ctx.beginPath()
  ctx.moveTo(400, 50)
  ctx.lineTo(370, 110)
  ctx.lineTo(430, 110)
  ctx.closePath()
  ctx.stroke()

  // Hexagon
  const hx = 400, hy = 350, hr = 35
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const px = hx + Math.cos(a) * hr
    const py = hy + Math.sin(a) * hr
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
}

function drawCelestial(ctx) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = LW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Crescent moon
  ctx.beginPath()
  ctx.arc(400, 140, 60, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(430, 125, 55, 0, Math.PI * 2)
  ctx.stroke()

  // Stars (5-pointed)
  drawStar(ctx, 150, 100, 25)
  drawStar(ctx, 650, 80, 20)
  drawStar(ctx, 100, 250, 18)
  drawStar(ctx, 700, 250, 22)
  drawStar(ctx, 250, 300, 15)
  drawStar(ctx, 550, 320, 16)

  // Constellation dots and lines
  const constellation = [
    { x: 350, y: 280 }, { x: 380, y: 310 }, { x: 420, y: 300 },
    { x: 450, y: 330 }, { x: 470, y: 360 },
  ]
  ctx.beginPath()
  constellation.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.stroke()
  constellation.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Horizon line
  ctx.beginPath()
  ctx.moveTo(0, 380)
  ctx.lineTo(800, 380)
  ctx.stroke()

  // Small hills
  ctx.beginPath()
  ctx.moveTo(0, 380)
  ctx.quadraticCurveTo(200, 340, 400, 380)
  ctx.quadraticCurveTo(600, 340, 800, 380)
  ctx.stroke()
}

function drawStar(ctx, cx, cy, size) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? size : size * 0.4
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
}
