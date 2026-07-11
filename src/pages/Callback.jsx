import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/brand/Logo'

export default function Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh items-center justify-center" style={{ background: '#0F172A' }}>
      <div className="animate-fade-in text-center">
        <div className="animate-pop mx-auto w-fit">
          <LogoMark size={48} />
        </div>
        <p className="mt-4 text-[13px] text-slate-400">Signing you in…</p>
      </div>
    </div>
  )
}
