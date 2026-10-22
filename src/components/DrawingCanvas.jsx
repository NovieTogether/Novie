import { useRef, useState, useEffect, useCallback } from 'react'
import { DRAWING_COLORS } from '../lib/constants.js'
import { COLORING_TEMPLATES } from '../lib/templates.js'

const BG = '#fffdf9'

export default function DrawingCanvas({ onSave, activityType = 'free', compact = false }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const [color, setColor] = useState(DRAWING_COLORS[0])
  const [brushSize, setBrushSize] = useState(4)
  const [tool, setTool] = useState('brush') // brush | eraser | fill
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [saved, setSaved] = useState(false)
  const [template, setTemplate] = useState(null)

  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const fillBackground = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setHistory(prev => [...prev.slice(-20), canvas.toDataURL()])
    setRedoStack([])
  }, [])

  const redrawTemplate = useCallback((tmplId) => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    fillBackground()
    const tmpl = COLORING_TEMPLATES.find(t => t.id === tmplId)
    if (tmpl) tmpl.draw(ctx)
  }, [fillBackground])

  const loadTemplate = (tmplId) => {
    saveState()
    setTemplate(tmplId)
    redrawTemplate(tmplId)
  }

  // Flood fill — BFS from the clicked pixel, matching the target color within tolerance.
  const floodFill = (startX, startY, fillHex) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const w = canvas.width
    const h = canvas.height
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data

    const sx = Math.floor(startX)
    const sy = Math.floor(startY)
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return

    const idx = (sy * w + sx) * 4
    const target = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]

    // Convert fill hex to RGB
    const fillRgb = hexToRgb(fillHex)
    if (!fillRgb) return

    // If clicking on the same color, skip
    if (target[0] === fillRgb[0] && target[1] === fillRgb[1] && target[2] === fillRgb[2]) return

    const tolerance = 32
    const matches = (i) => {
      return Math.abs(data[i] - target[0]) <= tolerance &&
        Math.abs(data[i + 1] - target[1]) <= tolerance &&
        Math.abs(data[i + 2] - target[2]) <= tolerance &&
        Math.abs(data[i + 3] - target[3]) <= tolerance
    }

    const stack = [[sx, sy]]
    const filled = new Uint8Array(w * h)

    while (stack.length > 0) {
      const [x, y] = stack.pop()
      if (x < 0 || x >= w || y < 0 || y >= h) continue
      const fi = y * w + x
      if (filled[fi]) continue
      const di = fi * 4
      if (!matches(di)) continue

      filled[fi] = 1
      data[di] = fillRgb[0]
      data[di + 1] = fillRgb[1]
      data[di + 2] = fillRgb[2]
      data[di + 3] = 255

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    ctx.putImageData(imgData, 0, 0)
  }

  const startDraw = (e) => {
    e.preventDefault()
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)

    if (tool === 'fill') {
      saveState()
      floodFill(pos.x, pos.y, color)
      return
    }

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = tool === 'eraser' ? BG : color
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize
    setIsDrawing(true)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = (e) => {
    if (e) e.preventDefault()
    if (isDrawing) {
      saveState()
      setIsDrawing(false)
    }
  }

  const undo = () => {
    if (history.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const current = canvas.toDataURL()
    const last = history[history.length - 1]
    const newHistory = history.slice(0, -1)
    setRedoStack(prev => [...prev, current].slice(-20))
    const img = new Image()
    img.onload = () => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = last
    setHistory(newHistory)
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const current = canvas.toDataURL()
    const next = redoStack[redoStack.length - 1]
    const newRedo = redoStack.slice(0, -1)
    setHistory(prev => [...prev, current].slice(-20))
    const img = new Image()
    img.onload = () => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = next
    setRedoStack(newRedo)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    saveState()
    fillBackground()
    setTemplate(null)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (onSave) {
      onSave(dataUrl, template)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctxRef.current = ctx
    fillBackground()
  }, [])

  const canvasHeight = compact ? 300 : 400

  const toolBtn = (id, label, icon) => (
    <button
      key={id}
      className={tool === id ? 'chip selected' : 'chip'}
      onClick={() => setTool(id)}
      style={{ fontSize: '13px' }}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="drawingCanvas">
      {/* Template picker */}
      <div style={{ marginBottom: '12px' }}>
        <small className="muted" style={{ display: 'block', marginBottom: '6px' }}>COLORING PAGES (optional)</small>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`chip ${template === null ? 'selected' : ''}`}
            onClick={() => { saveState(); fillBackground(); setTemplate(null) }}
            style={{ fontSize: '13px' }}
          >
            ✏️ Blank
          </button>
          {COLORING_TEMPLATES.map(t => (
            <button
              key={t.id}
              className={`chip ${template === t.id ? 'selected' : ''}`}
              onClick={() => loadTemplate(t.id)}
              style={{ fontSize: '13px' }}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="canvasWrap" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={canvasHeight}
          style={{
            width: '100%',
            height: canvasHeight,
            touchAction: 'none',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            background: BG,
            cursor: tool === 'fill' ? 'cell' : 'crosshair',
            display: 'block',
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="drawTools">
        {/* Tools */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {toolBtn('brush', 'Brush', '🖌️')}
          {toolBtn('fill', 'Fill', '🪣')}
          {toolBtn('eraser', 'Eraser', '🧹')}
        </div>

        {/* Current color indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <small className="muted">Current color:</small>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: color, border: '2px solid var(--deep)',
          }} />
        </div>

        <div className="colorPicker">
          {DRAWING_COLORS.map(c => (
            <button
              key={c}
              className={`colorDot ${color === c ? 'active' : ''}`}
              style={{ background: c, border: color === c ? '2px solid var(--deep)' : '1px solid var(--line)' }}
              onClick={() => { setColor(c); setTool('brush') }}
            />
          ))}
        </div>

        <div className="brushControl">
          <label>Brush size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="24"
            value={brushSize}
            onChange={e => setBrushSize(+e.target.value)}
          />
        </div>

        <div className="drawActions">
          <button className="secondary" onClick={undo} disabled={history.length === 0}>↩ Undo</button>
          <button className="secondary" onClick={redo} disabled={redoStack.length === 0}>↪ Redo</button>
          <button className="secondary" onClick={clear}>Clear</button>
          <button className="primary" onClick={save}>{saved ? '✓ Saved' : 'Save artwork'}</button>
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ] : null
}
