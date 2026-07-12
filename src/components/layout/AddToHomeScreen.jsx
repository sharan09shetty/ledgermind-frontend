import { useEffect, useState } from 'react'
import { Share, SquarePlus, Smartphone, MoreVertical, Download } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { LogoMark } from '../brand/Logo'

const DISMISS_KEY = 'lm-a2hs-dismissed'
const SHOW_DELAY_MS = 1500

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)')?.matches ||
  window.navigator.standalone === true

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-strong">
        {n}
      </span>
      <span className="flex flex-wrap items-center gap-1 pt-0.5 text-[13px] leading-relaxed text-sub">
        {children}
      </span>
    </li>
  )
}

/**
 * One-time "install LedgerMind" prompt for mobile browser users.
 * On Android/Chrome it drives the native install prompt (beforeinstallprompt);
 * on iOS (no install API) it shows the Share → Add to Home Screen steps.
 * Never shown inside the installed app, and never again once dismissed.
 */
export default function AddToHomeScreen() {
  const [open, setOpen] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallEvent(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    const id = setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => {
      clearTimeout(id)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  if (!open) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setOpen(false)
  }

  const installNatively = async () => {
    try {
      installEvent.prompt()
      await installEvent.userChoice
    } finally {
      dismiss()
    }
  }

  return (
    <Modal title="Get the app experience" subtitle="Add LedgerMind to your home screen" onClose={dismiss}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-elev p-3">
          <LogoMark size={38} />
          <p className="m-0 text-[13px] leading-relaxed text-sub">
            Full-screen, faster to open, and just like a native app — no app store needed.
          </p>
        </div>

        {installEvent ? (
          <Button className="w-full" onClick={installNatively}>
            <Download size={15} /> Install LedgerMind
          </Button>
        ) : isIOS() ? (
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            <Step n={1}>
              Tap the <Share size={14} className="text-accent-strong" /> <b className="text-text">Share</b> button in
              Safari's toolbar
            </Step>
            <Step n={2}>
              Scroll down and tap <SquarePlus size={14} className="text-accent-strong" />{' '}
              <b className="text-text">Add to Home Screen</b>
            </Step>
            <Step n={3}>
              Tap <b className="text-text">Add</b> — then open LedgerMind from your home screen
            </Step>
          </ol>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            <Step n={1}>
              Tap the <MoreVertical size={14} className="text-accent-strong" /> <b className="text-text">menu</b> in
              your browser
            </Step>
            <Step n={2}>
              Tap <Smartphone size={14} className="text-accent-strong" />{' '}
              <b className="text-text">Add to Home screen</b> (or <b className="text-text">Install app</b>)
            </Step>
          </ol>
        )}

        <Button variant="secondary" className="w-full" onClick={dismiss}>
          Maybe later
        </Button>
      </div>
    </Modal>
  )
}
