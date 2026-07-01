import { getGoogleLoginUrl } from '../api/endpoints'

export default function Login() {
  const handleLogin = () => {
    // Plain Google sign-in — no Gmail scope is requested here. Gmail access
    // is a separate, consent-screen-gated step handled later from Settings.
    window.location.href = getGoogleLoginUrl()
  }

  return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 20%, #1E293B 0%, #0F172A 50%, #020617 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '380px', width: '100%', padding: '0 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '34px', color: '#10B981' }}>◈</span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>LedgerMind</span>
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginBottom: '40px' }}>
            Your finances, understood automatically
          </p>

          <div style={{
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px', padding: '32px 28px', backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {[
                { icon: '🔒', text: 'Secure sign-in with your Google account' },
                { icon: '🤖', text: 'AI-powered spending insights via chat' },
                { icon: '📊', text: 'Beautiful dashboards & analytics' },
              ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{text}</span>
                  </div>
              ))}
            </div>

            <button
                onClick={handleLogin}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  background: 'white', color: '#1E293B', fontWeight: 600, fontSize: '14px',
                  padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{
            marginTop: '18px', padding: '12px 16px', borderRadius: '14px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
            <p style={{ fontSize: '12px', color: '#FCD34D', margin: 0, lineHeight: 1.5 }}>
              LedgerMind is in early access. Google sign-in currently only works for approved test accounts while we complete verification.
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '20px' }}>
            This just signs you in. You'll be asked to connect additional access later, from Settings.
          </p>
        </div>
      </div>
  )
}