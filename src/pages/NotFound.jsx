import { useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { LogoMark } from '../components/brand/Logo'
import Button from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="animate-fade-in-up">
        <div className="mx-auto mb-6 w-fit opacity-90">
          <LogoMark size={52} />
        </div>
        <p className="m-0 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
          <Compass size={14} /> 404
        </p>
        <h1 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-text">
          This page wandered off the ledger
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-sub">
          The page you're looking for doesn't exist or has moved. Let's get you back to your money.
        </p>
        <Button className="mt-7" icon={ArrowLeft} onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
