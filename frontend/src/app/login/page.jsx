'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Activity, CheckCircle, Plus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      if (username.trim() && password.trim()) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('username', username.trim());
        }
        router.push('/dashboard');
      } else {
        setError('Please enter both username and password.');
      }
    }, 800);
  };

  return (
    <div className="login-split-container">
      <div className="login-card-left">
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #059669, #10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>VitalSense AI</span>
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
            Welcome to your<br />ICU command center
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15, color: '#64748B', lineHeight: 1.5 }}>
            Real-time sepsis prediction, SHAP explanations,<br />and live patient telemetry.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 20,
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', fontSize: 13, fontWeight: 500,
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="doctor@hospital.com"
              style={{ boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 44, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ft-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', margin: '0 0 24px' }}>
          Don&apos;t have an account?{' '}
          <span style={{ color: '#059669', fontWeight: 600, cursor: 'pointer' }}>Contact Admin</span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button className="social-btn">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button className="social-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </button>
          <button className="social-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="login-card-right">
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🏥</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#065F46' }}>Real-Time ICU Monitoring</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32, textAlign: 'left', maxWidth: 280 }}>
            {[
              'Live sepsis risk predictions every 15 seconds',
              'XGBoost + LSTM ensemble ML models',
              'SHAP explainability for every alert',
              'WebSocket streaming to clinician dashboard',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, color: '#065F46', fontWeight: 500, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#047857', fontWeight: 600 }}>
              &ldquo;We don&apos;t wait for sepsis. We predict it.&rdquo;
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6B7280' }}>— Team GIT SUMMER</p>
          </div>
        </div>
      </div>
    </div>
  );
}
