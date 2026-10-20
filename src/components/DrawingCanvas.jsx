import { useRef, useState, useEffect, useCallback } from 'react'
import { DRAWING_COLORS } from '../lib/constants.js'

export default function DrawingCanvas({ onSave, activityType = 'free', compact = false }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const [color, setColor] = useState(DRAWING_COLORS[0])
  const [brushSize, setBrushSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState([])
  const [saved, setSaved] = useState(false)

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

  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setHistory(prev => [...prev.slice(-20), canvas.toDataURL()])
  }, [])

  const startDraw = (e) => {
    e.preventDefault()
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
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
    const last = history[history.length - 1]
    const img = new Image()
    img.onload = () => {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fffdf9'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = last
    setHistory(prev => prev.slice(0, -1))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    saveState()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fffdf9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (onSave) {
      onSave(dataUrl)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctxRef.current = ctx
    ctx.fillStyle = '#fffdf9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const canvasHeight = compact ? 300 : 400

  return (
    <div className="drawingCanvas">
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
            background: '#fffdf9',
            cursor: 'crosshair',
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
        <div className="colorPicker">
          {DRAWING_COLORS.map(c => (
            <button
              key={c}
              className={`colorDot ${color === c ? 'active' : ''}`}
              style={{ background: c, border: color === c ? '2px solid var(--deep)' : '1px solid var(--line)' }}
              onClick={() => setColor(c)}
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
          <button className="secondary" onClick={undo}>↩ Undo</button>
          <button className="secondary" onClick={clear}>Clear</button>
          <button className="primary" onClick={save}>{saved ? '✓ Saved' : 'Save artwork'}</button>
        </div>
      </div>
    </div>
  )
}
