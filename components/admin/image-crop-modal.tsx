'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, Check, RotateCcw, Move } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const PREVIEW_SIZE = 380
const DEFAULT_OUTPUT_SIZE = 800

interface ImageCropModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (blob: Blob, filename: string) => void
  file: File | null
  aspectRatio?: number
  outputSize?: number
  label?: string
}

export function ImageCropModal({
  open,
  onClose,
  onConfirm,
  file,
  aspectRatio = 1,
  outputSize = DEFAULT_OUTPUT_SIZE,
  label = 'Product Image',
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [processing, setProcessing] = useState(false)

  const previewW = PREVIEW_SIZE
  const previewH = Math.round(PREVIEW_SIZE / aspectRatio)

  useEffect(() => {
    if (!file || !open) return
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setProcessing(false)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => setImgEl(img)
    img.src = url
    return () => {
      URL.revokeObjectURL(url)
      setImgEl(null)
    }
  }, [file, open])

  const getDrawParams = useCallback((img: HTMLImageElement) => {
    const baseScale = Math.max(previewW / img.width, previewH / img.height)
    const scale = baseScale * zoom
    const w = img.width * scale
    const h = img.height * scale
    const x = (previewW - w) / 2 + offset.x
    const y = (previewH - h) / 2 + offset.y
    return { scale, w, h, x, y }
  }, [zoom, offset, previewW, previewH])

  useEffect(() => {
    if (!imgEl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = previewW
    canvas.height = previewH
    ctx.clearRect(0, 0, previewW, previewH)

    const { x, y, w, h } = getDrawParams(imgEl)
    ctx.drawImage(imgEl, x, y, w, h)

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 0.5
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo((previewW / 3) * i, 0)
      ctx.lineTo((previewW / 3) * i, previewH)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, (previewH / 3) * i)
      ctx.lineTo(previewW, (previewH / 3) * i)
      ctx.stroke()
    }
  }, [imgEl, zoom, offset, getDrawParams, previewW, previewH])

  const clampOffset = useCallback((rawX: number, rawY: number, img: HTMLImageElement) => {
    const baseScale = Math.max(previewW / img.width, previewH / img.height)
    const scale = baseScale * zoom
    const w = img.width * scale
    const h = img.height * scale
    const maxX = Math.max(0, (w - previewW) / 2)
    const maxY = Math.max(0, (h - previewH) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, rawX)),
      y: Math.max(-maxY, Math.min(maxY, rawY)),
    }
  }, [zoom, previewW, previewH])

  const startDrag = (clientX: number, clientY: number) => {
    setDragging(true)
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y })
  }

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragging || !imgEl) return
    const rawX = clientX - dragStart.x
    const rawY = clientY - dragStart.y
    setOffset(clampOffset(rawX, rawY, imgEl))
  }

  const handleConfirm = () => {
    if (!imgEl || processing) return
    setProcessing(true)

    const { x, y, w, h } = getDrawParams(imgEl)
    const sourceX = Math.max(0, -x / (w / imgEl.width))
    const sourceY = Math.max(0, -y / (h / imgEl.height))
    const sourceW = (previewW / w) * imgEl.width
    const sourceH = (previewH / h) * imgEl.height

    const out = document.createElement('canvas')
    out.width = outputSize
    out.height = Math.round(outputSize / aspectRatio)
    const ctx = out.getContext('2d')
    if (!ctx) { setProcessing(false); return }

    ctx.drawImage(
      imgEl,
      Math.max(0, sourceX), Math.max(0, sourceY),
      Math.min(sourceW, imgEl.width - Math.max(0, sourceX)),
      Math.min(sourceH, imgEl.height - Math.max(0, sourceY)),
      0, 0, out.width, out.height,
    )

    out.toBlob(blob => {
      if (blob) {
        const baseName = file!.name.replace(/\.[^.]+$/, '')
        onConfirm(blob, `${baseName}.webp`)
      }
      setProcessing(false)
    }, 'image/webp', 0.92)
  }

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
    if (imgEl) setOffset(prev => clampOffset(prev.x, prev.y, imgEl))
  }

  if (!open || !file) return null

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !processing) onClose() }}>
      <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold">Crop {label}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag to reposition · Zoom to fit · Output: {outputSize}×{Math.round(outputSize / aspectRatio)}px WebP
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 px-5 pb-4">
          <div
            className="relative overflow-hidden rounded-lg border-2 border-primary/40 cursor-grab active:cursor-grabbing select-none bg-muted"
            style={{ width: previewW, height: previewH }}
            onMouseDown={e => startDrag(e.clientX, e.clientY)}
            onMouseMove={e => moveDrag(e.clientX, e.clientY)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchEnd={() => setDragging(false)}
          >
            {!imgEl && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm">
                Loading…
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={previewW}
              height={previewH}
              style={{ display: 'block', width: previewW, height: previewH }}
            />
            <div className="absolute inset-0 pointer-events-none">
              {['top-0 left-0 border-t-[3px] border-l-[3px]',
                'top-0 right-0 border-t-[3px] border-r-[3px]',
                'bottom-0 left-0 border-b-[3px] border-l-[3px]',
                'bottom-0 right-0 border-b-[3px] border-r-[3px]'].map((cls, i) => (
                <div key={i} className={`absolute ${cls} border-primary w-6 h-6 rounded-[2px]`} />
              ))}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 text-white text-[10px] rounded-full px-2 py-0.5 pointer-events-none">
              <Move className="w-2.5 h-2.5" />
              <span>Drag to reposition</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(1, +(zoom - 0.1).toFixed(2)))}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1" max="3" step="0.05"
              value={zoom}
              onChange={e => handleZoomChange(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(Math.min(3, +(zoom + 0.1).toFixed(2)))}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground w-9 text-right font-mono">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Reset"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={processing || !imgEl}
            className="bg-primary text-primary-foreground gap-2"
          >
            {processing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Use This Crop
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
