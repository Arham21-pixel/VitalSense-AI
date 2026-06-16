'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  Shield, 
  Cpu, 
  Briefcase, 
  Layers, 
  BarChart3, 
  Menu, 
  X, 
  Star, 
  Check, 
  Globe, 
  ChevronRight, 
  HeartPulse,
  Sparkles,
  PieChart,
  Lock,
  RefreshCw,
  Bell,
  Stethoscope,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState('patients');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Stats Counters state for mock animation
  const [stats, setStats] = useState({ accuracy: 0, hospitals: 0, patients: 0 });

  useEffect(() => {
    const interval = setTimeout(() => {
      setStats({ accuracy: 99.2, hospitals: 50, patients: 10 });
    }, 100);
    return () => clearTimeout(interval);
  }, []);

  const handleCTA = (e) => {
    e.preventDefault();
    if (emailInput) {
      setIsSubmitted(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="fintech-body">
      {/* 1. NAVIGATION */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5%'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--vs-gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}>
            <HeartPulse size={20} color="#fff" />
          </div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
            color: 'var(--vs-text-main)'
          }}>
            VitalSense AI
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--vs-text-muted)',
                transition: 'color 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--vs-text-main)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--vs-text-muted)'}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="desktop-ctas" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a 
            href="/login"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--vs-text-main)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '10px 20px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Sign In
          </a>
          <a 
            href="/login"
            className="ft-btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px', fontSize: '0.95rem' }}
          >
            Get Started
          </a>
        </div>

        {/* Mobile Hamburger Menu Icon */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vs-text-main)',
            cursor: 'pointer',
            display: 'none'
          }}
          className="mobile-toggle-btn"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '24px 5%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 49,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--vs-text-main)'
                }}
              >
                {item}
              </a>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '4px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  background: 'none',
                  border: '1px solid #E2E8F0',
                  color: 'var(--vs-text-main)',
                  borderRadius: '9999px',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign In
              </a>
              <a 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="ft-btn-primary"
                style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', padding: '12px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: '160px 5% 100px 5%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '60px',
        position: 'relative'
      }}>
        {/* Left text column */}
        <div style={{ flex: '1 1 500px', maxWidth: '620px', zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--vs-accent-sage)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '9999px',
            padding: '6px 16px',
            marginBottom: '28px'
          }}>
            <Sparkles size={14} color="var(--vs-accent-dark)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--vs-accent-dark)' }}>
              INTRODUCING VITALSENSE AI PLATFORM
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: '0 0 24px 0',
            fontFamily: "'Outfit', sans-serif",
            color: 'var(--vs-text-main)'
          }}>
            Change the way <br />
            you predict <span className="ft-text-gradient-cyan-purple">sepsis</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: '1.15rem',
            lineHeight: 1.6,
            color: 'var(--vs-text-muted)',
            margin: '0 0 40px 0',
            maxWidth: '520px'
          }}>
            From proactive patient monitoring to real-time risk scores. VitalSense AI helps your ICU team identify high-risk patients before deterioration occurs.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '48px' }}>
            <a href="/login" className="ft-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '16px 36px', fontSize: '1rem' }}>
              Access Dashboard <ArrowRight size={18} />
            </a>
            <a href="/login" className="ft-btn-ghost" style={{ display: 'inline-flex', textDecoration: 'none', padding: '16px 36px', fontSize: '1rem' }}>
              Request EMR Integration
            </a>
          </div>

          {/* Trust proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80',
                'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=100&q=80',
                'https://images.unsplash.com/photo-1594824436998-058a236688d5?auto=format&fit=crop&w=100&q=80'
              ].map((src, index) => (
                <img 
                  key={index} 
                  src={src} 
                  alt="Doctor avatar" 
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                    marginLeft: index === 0 ? '0' : '-12px',
                    objectFit: 'cover'
                  }}
                />
              ))}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
                background: 'var(--vs-accent-sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '-12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'var(--vs-accent-dark)'
              }}>
                +50
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />
                ))}
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--vs-text-main)', marginLeft: '6px' }}>5.0</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)' }}>from Leading ICU Directors</span>
            </div>
          </div>
        </div>

        {/* Right dashboard mockup column */}
        <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          {/* Main Dashboard Widget Mockup */}
          <div className="ft-glass-card ft-animate-float" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--vs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>SEPSIS RISK SCORE</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--vs-text-main)' }}>84.5%</h3>
              </div>
              <div style={{
                background: '#FEE2E2',
                color: '#DC2626',
                borderRadius: '9999px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <TrendingUp size={14} /> CRITICAL
              </div>
            </div>

            {/* Simulated graph / SVG */}
            <div style={{ width: '100%', height: '140px', position: 'relative', marginBottom: '24px' }}>
              <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area path */}
                <path 
                  d="M0 100 Q 80 110, 160 80 T 320 20 T 400 10 L 400 120 L 0 120 Z" 
                  fill="url(#gradient-line)" 
                />
                {/* Stroke path */}
                <path 
                  d="M0 100 Q 80 110, 160 80 T 320 20 T 400 10" 
                  fill="none" 
                  stroke="#EF4444" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />
                {/* Pulsing coordinate pointer */}
                <circle cx="320" cy="20" r="6" fill="#EF4444" />
                <circle cx="320" cy="20" r="12" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.5" className="animate-pulse" />
              </svg>
            </div>

            {/* Bottom details list */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--vs-card-border)', paddingTop: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>Heart Rate</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--vs-text-main)', marginTop: '2px' }}>128 bpm</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>Temperature</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--vs-text-main)', marginTop: '2px' }}>39.2°C</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>WBC</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--vs-text-main)', marginTop: '2px' }}>18.5</div>
              </div>
            </div>
          </div>

          {/* Floating Widget 1: Patients */}
          <div className="ft-glass-card ft-animate-float-slow" style={{
            position: 'absolute',
            top: '-30px',
            right: '-20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '20px',
            zIndex: 3
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--vs-accent-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color="var(--vs-accent-dark)" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--vs-text-main)' }}>Ward A</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--vs-text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>12 Active Patients</span>
            </div>
          </div>

          {/* Floating Widget 2: Recent Alert */}
          <div className="ft-glass-card" style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-20px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderRadius: '20px',
            zIndex: 3,
            animation: 'ft-float 8s ease-in-out infinite'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={20} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>Alert: Patient P003</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--vs-text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Intervention Req. <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUSTED BY SECTION */}
      <section style={{
        padding: '60px 5%',
        borderTop: '1px solid var(--vs-card-border)',
        borderBottom: '1px solid var(--vs-card-border)',
        background: '#FFFFFF',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--vs-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '36px'
        }}>
          TRUSTED BY LEADING HOSPITALS WORLDWIDE
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '60px',
          opacity: 0.6
        }}>
          {/* Custom SVG Company Logos inspired by Healthcare brands */}
          {/* Mount Sinai */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={24} color="var(--vs-text-main)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--vs-text-main)', fontFamily: "'Outfit', sans-serif" }}>General Hospital</span>
          </div>
          {/* Cleveland Clinic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--vs-text-main)', fontFamily: "'Outfit', sans-serif" }}>MedCare</span>
          </div>
          {/* Mayo Clinic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={24} color="var(--vs-text-main)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--vs-text-main)', fontFamily: "'Outfit', sans-serif" }}>Cedars Health</span>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" style={{ padding: '120px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--vs-accent-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            SUPERPOWERED FEATURES
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            marginTop: '12px',
            marginBottom: '20px',
            fontFamily: "'Outfit', sans-serif",
            color: 'var(--vs-text-main)'
          }}>
            One platform for all your ICU metrics
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--vs-text-muted)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Remove all the friction that stands in the way of timely interventions. Identify high-risk patients with automation, security, and smart analytics.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            {
              title: "Real-time EMR Sync",
              desc: "Get instant metrics on all patient vitals. Make faster clinical evaluations with clean interactive charts.",
              icon: <BarChart3 size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            },
            {
              title: "AI Predictive Risk Scores",
              desc: "Unlock predictive recommendations to identify sepsis outliers and forecast patient deterioration.",
              icon: <Cpu size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            },
            {
              title: "Automated ICU Alerts",
              desc: "Build customized thresholds to trigger instant notifications directly to attending staff pagers.",
              icon: <Bell size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            },
            {
              title: "HIPAA Compliant Security",
              desc: "End-to-end security with biometric multi-factor access, instant auditing, and zero-liability coverage.",
              icon: <Shield size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            },
            {
              title: "Ward Analytics",
              desc: "Establish category bounds for divisions and squads. Instantly capture alerts on ward overload.",
              icon: <Layers size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            },
            {
              title: "Smart Shift Reports",
              desc: "Instantly compile patient status templates and handover worksheets with a single click.",
              icon: <Briefcase size={24} color="var(--vs-accent-dark)" />,
              gradient: 'var(--vs-accent-sage)'
            }
          ].map((feat, i) => (
            <div key={i} className="ft-glass-card" style={{
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '240px'
            }}>
              <div>
                {/* Floating Icon Box */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: feat.gradient,
                  border: `1px solid rgba(16, 185, 129, 0.1)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--vs-text-main)', margin: '0 0 12px 0' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--vs-text-muted)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE DASHBOARD SHOWCASE */}
      <section id="solutions" style={{
        padding: '100px 5%',
        background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--vs-accent-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            PRODUCT IN ACTION
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            marginTop: '12px',
            marginBottom: '20px',
            fontFamily: "'Outfit', sans-serif",
            color: 'var(--vs-text-main)'
          }}>
            Institutional-grade patient management
          </h2>
          {/* Tab switcher */}
          <div style={{
            display: 'inline-flex',
            background: '#FFFFFF',
            border: '1px solid var(--vs-card-border)',
            borderRadius: '9999px',
            padding: '4px',
            gap: '4px',
            marginTop: '10px'
          }}>
            {[
              { id: 'patients', label: 'Patient Vitals' },
              { id: 'risk', label: 'Risk Forecast' },
              { id: 'alerts', label: 'Recent Alerts' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--vs-text-main)' : 'none',
                  border: 'none',
                  color: activeTab === tab.id ? '#fff' : 'var(--vs-text-muted)',
                  borderRadius: '9999px',
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === tab.id ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Large Central Product Mockup */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
          <div className="ft-glass-card" style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            padding: '0',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
          }}>
            {/* Dashboard Mockup Top Bar */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--vs-card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              {/* Window Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
              </div>
              {/* Mock Address */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--vs-card-border)',
                borderRadius: '8px',
                padding: '4px 20px',
                fontSize: '0.75rem',
                color: 'var(--vs-text-muted)',
                width: '40%',
                textAlign: 'center',
                fontWeight: 600
              }}>
                app.vitalsense.ai/overview
              </div>
              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={16} color="var(--vs-text-muted)" />
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--vs-gradient-primary)' }} />
              </div>
            </div>

            {/* Dashboard Inner Layout */}
            <div style={{ display: 'flex', minHeight: '420px', flexWrap: 'wrap', background: '#FFFFFF' }}>
              {/* Sidebar */}
              <div style={{
                flex: '1 1 180px',
                borderRight: '1px solid var(--vs-card-border)',
                padding: '24px',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Overview', active: true },
                    { label: 'Patients', active: false },
                    { label: 'Alerts', active: false },
                    { label: 'Reports', active: false },
                    { label: 'Integrations', active: false }
                  ].map((sLink, idx) => (
                    <div key={idx} style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: sLink.active ? 'var(--vs-text-main)' : 'var(--vs-text-muted)',
                      background: sLink.active ? '#FFFFFF' : 'none',
                      boxShadow: sLink.active ? '0 2px 5px rgba(0,0,0,0.02)' : 'none',
                      cursor: 'pointer'
                    }}>
                      {sLink.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div style={{ flex: '3 1 500px', padding: '32px' }}>
                {/* KPI Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  {[
                    { label: 'Active Patients', val: '42', pct: 'Stable' },
                    { label: 'Critical Alerts', val: '3', pct: 'Needs Review' },
                    { label: 'Prediction Acc.', val: '99.2%', pct: '+0.5%' }
                  ].map((kpi, kIdx) => (
                    <div key={kIdx} style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--vs-card-border)',
                      borderRadius: '16px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>{kpi.label}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--vs-text-main)', marginTop: '6px' }}>{kpi.val}</div>
                      <div style={{ fontSize: '0.75rem', color: kIdx === 1 ? '#EF4444' : '#10B981', fontWeight: 700, marginTop: '4px' }}>{kpi.pct}</div>
                    </div>
                  ))}
                </div>

                {/* Tab Target Rendering */}
                {activeTab === 'patients' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--vs-text-main)' }}>Ward 4 Vitals Overview</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>Updated 2m ago</span>
                    </div>
                    {/* SVG Curve */}
                    <div style={{ width: '100%', height: '200px' }}>
                      <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <g stroke="#E2E8F0" strokeWidth="1">
                          <line x1="0" y1="50" x2="600" y2="50" />
                          <line x1="0" y1="100" x2="600" y2="100" />
                          <line x1="0" y1="150" x2="600" y2="150" />
                        </g>
                        <path 
                          d="M0 160 C 100 150, 150 100, 250 110 C 350 120, 400 40, 500 50 C 550 55, 570 30, 600 10 L 600 200 L 0 200 Z" 
                          fill="url(#rev-grad)" 
                        />
                        <path 
                          d="M0 160 C 100 150, 150 100, 250 110 C 350 120, 400 40, 500 50 C 550 55, 570 30, 600 10" 
                          fill="none" 
                          stroke="#10B981" 
                          strokeWidth="4" 
                        />
                        <defs>
                          <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <circle cx="600" cy="10" r="5" fill="#064E3B" />
                      </svg>
                    </div>
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--vs-text-main)' }}>Real-time Alerts Feed</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>Live updates enabled</span>
                    </div>
                    {/* Simulated list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { name: 'Patient P001', time: 'Just now', score: '88% Sepsis Risk', status: 'CRITICAL', color: '#EF4444' },
                        { name: 'Patient P042', time: '12m ago', score: '45% Sepsis Risk', status: 'MONITOR', color: '#F59E0B' },
                        { name: 'Patient P015', time: '1h ago', score: '12% Sepsis Risk', status: 'STABLE', color: '#10B981' }
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--vs-text-main)' }}>{item.name}</div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--vs-text-muted)', fontWeight: 500 }}>{item.time}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: item.color }}>
                              {item.score}
                            </div>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--vs-text-muted)'
                            }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STATISTICS SECTION */}
      <section style={{ padding: '80px 5%', position: 'relative', background: '#FFFFFF' }}>
        <div className="ft-glass-card" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '50px 30px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: '40px',
          textAlign: 'center',
          background: '#F8FAFC'
        }}>
          <div>
            <h2 className="ft-text-gradient-cyan-purple" style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {stats.accuracy}%
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--vs-text-main)', margin: '8px 0 0 0', fontWeight: 700 }}>
              Prediction Accuracy
            </p>
          </div>
          <div style={{ width: '1px', height: '60px', background: '#E2E8F0' }} className="stat-divider" />
          <div>
            <h2 className="ft-text-gradient-cyan-purple" style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {stats.hospitals}+
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--vs-text-main)', margin: '8px 0 0 0', fontWeight: 700 }}>
              Hospital Networks
            </p>
          </div>
          <div style={{ width: '1px', height: '60px', background: '#E2E8F0' }} className="stat-divider" />
          <div>
            <h2 className="ft-text-gradient-cyan-purple" style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {stats.patients}K+
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--vs-text-main)', margin: '8px 0 0 0', fontWeight: 700 }}>
              Patients Monitored
            </p>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section id="resources" style={{ padding: '120px 5%', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--vs-accent-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            VETTED TESTIMONIALS
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            marginTop: '12px',
            marginBottom: '20px',
            fontFamily: "'Outfit', sans-serif",
            color: 'var(--vs-text-main)'
          }}>
            What medical directors say
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            {
              quote: "VitalSense AI revolutionized our ICU. Integrating with our EMR stack took hours, and proactive sepsis alerts have reduced mortality by 14%.",
              name: "Dr. Sarah Jenkins",
              role: "ICU Director, Gen Hospital",
              avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
            },
            {
              quote: "Monitoring patients used to be highly reactive. With VitalSense's AI dashboard, we predict deterioration hours before symptoms physically manifest.",
              name: "Dr. David Chen",
              role: "Chief Medical Officer",
              avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=120&q=80"
            },
            {
              quote: "The interface is beautiful and functions seamlessly for our nursing staff. It's an absolute game-changer for critical care software.",
              name: "Olivia Martinez, RN",
              role: "Head of Nursing",
              avatar: "https://images.unsplash.com/photo-1594824436998-058a236688d5?auto=format&fit=crop&w=120&q=80"
            }
          ].map((t, index) => (
            <div key={index} className="ft-glass-card" style={{
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                {/* Rating stars */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: 'var(--vs-text-main)',
                  fontStyle: 'italic',
                  margin: 0,
                  fontWeight: 500
                }}>
                  "{t.quote}"
                </p>
              </div>

              {/* Profile details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px' }}>
                <img 
                  src={t.avatar} 
                  alt={t.name} 
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #E2E8F0'
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--vs-text-main)', margin: 0 }}>{t.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--vs-text-muted)', fontWeight: 600 }}>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CTA BANNER SECTION */}
      <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          background: 'var(--vs-gradient-primary)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '32px',
          padding: '80px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '20px',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
            position: 'relative',
            zIndex: 1
          }}>
            Ready to revolutionize ICU monitoring?
          </h2>
          <p style={{
            fontSize: '1.15rem',
            color: '#D1FAE5',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            lineHeight: 1.6,
            position: 'relative',
            zIndex: 1,
            fontWeight: 500
          }}>
            Join the leading hospitals and healthcare providers who trust VitalSense AI to improve patient outcomes. 
          </p>

          <a 
            href="/login"
            className="ft-btn-ghost"
            style={{ display: 'inline-block', textDecoration: 'none', padding: '16px 36px', fontSize: '1.05rem' }}
          >
            Access Dashboard
          </a>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={{
        padding: '80px 5% 40px 5%',
        borderTop: '1px solid var(--vs-card-border)',
        background: '#F8FAFC'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto 60px auto'
        }}>
          {/* Logo column */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'var(--vs-gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartPulse size={16} color="#fff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--vs-text-main)', fontFamily: "'Outfit', sans-serif" }}>
                VitalSense AI
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--vs-text-muted)', lineHeight: 1.6, maxWidth: '240px', fontWeight: 500 }}>
              Luxury institutional healthcare capabilities simplified for modern intensive care units.
            </p>
          </div>

          {/* Links columns */}
          {[
            {
              title: "Product",
              links: ["Overview", "Vitals Dash", "AI Forecasting", "Pricing plans", "SLA Assurances"]
            },
            {
              title: "Company",
              links: ["About us", "Careers", "Newsroom", "Press Kit", "Brand Guidelines"]
            },
            {
              title: "Resources",
              links: ["Documentation", "Healthcare APIs", "Help Desk", "Service Status", "Contact Vetted Support"]
            },
            {
              title: "Security & Legal",
              links: ["HIPAA Policies", "Terms of Use", "GDPR compliance", "SOC 2 Reports", "Vulnerability Program"]
            }
          ].map((col, idx) => (
            <div key={idx}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--vs-text-main)', marginBottom: '20px' }}>
                {col.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map((link) => (
                  <a 
                    key={link} 
                    href={link === 'Vitals Dash' ? '/login' : '#'}
                    style={{ fontSize: '0.9rem', color: 'var(--vs-text-muted)', transition: 'color 0.2s', fontWeight: 500 }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--vs-text-main)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--vs-text-muted)'}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom footer row */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '40px',
          borderTop: '1px solid var(--vs-card-border)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--vs-text-muted)', fontWeight: 500 }}>
            &copy; 2026 VitalSense AI. All rights reserved. Built with premium design standards.
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Twitter', 'LinkedIn', 'GitHub', 'Discord'].map((social) => (
              <a 
                key={social} 
                href="#" 
                style={{ fontSize: '0.85rem', color: 'var(--vs-text-muted)', transition: 'color 0.2s', fontWeight: 500 }}
                onMouseEnter={(e) => e.target.style.color = 'var(--vs-text-main)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--vs-text-muted)'}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
