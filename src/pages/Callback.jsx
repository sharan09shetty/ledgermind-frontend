import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

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
  }, [])

  return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0F172A',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '32px', color: '#10B981' }}>◈</span>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '12px' }}>Signing you in...</p>
        </div>
      </div>
  )
}