import { useRef, useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const ACTIONS_WIDTH = 144 // two 72px buttons revealed behind the row

/**
 * Touch-swipeable list row: swipe left to reveal Edit / Delete actions,
 * swipe right (or tap the row) to close. Only one row should be open at a
 * time — the parent passes `open` and gets `onOpenChange` callbacks.
 */
export default function SwipeableRow({ open, onOpenChange, onEdit, onDelete, deleting, children }) {
  const [drag, setDrag] = useState(null) // live px offset while dragging
  const touch = useRef(null)

  // `drag` is only non-null during an active touch (cleared on touchend),
  // so parent-driven open/close always snaps cleanly via `base`.
  const base = open ? -ACTIONS_WIDTH : 0
  const offset = drag ?? base

  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null }
  }

  const onTouchMove = (e) => {
    if (!touch.current) return
    const t = e.touches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    // Decide the gesture's axis once, so vertical scrolling stays untouched
    if (touch.current.horizontal == null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      touch.current.horizontal = Math.abs(dx) > Math.abs(dy)
    }
    if (!touch.current.horizontal) return
    setDrag(Math.max(-ACTIONS_WIDTH - 16, Math.min(0, base + dx)))
  }

  const onTouchEnd = () => {
    if (touch.current?.horizontal && drag != null) {
      onOpenChange(drag < -ACTIONS_WIDTH / 2)
    }
    touch.current = null
    setDrag(null)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Revealed actions */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTIONS_WIDTH }} aria-hidden={!open}>
        <button
          onClick={() => {
            onOpenChange(false)
            onEdit()
          }}
          tabIndex={open ? 0 : -1}
          className="flex w-1/2 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-info text-[11px] font-semibold text-white"
        >
          <Pencil size={17} />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          tabIndex={open ? 0 : -1}
          className="flex w-1/2 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-danger text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {deleting ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
          Delete
        </button>
      </div>

      {/* Foreground content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={open ? () => onOpenChange(false) : undefined}
        className="relative bg-card"
        style={{
          transform: `translateX(${offset}px)`,
          transition: drag == null ? 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}
