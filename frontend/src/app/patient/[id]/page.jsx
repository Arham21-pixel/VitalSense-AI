'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Droplets,
  FlaskConical,
  Heart,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Thermometer,
  TrendingUp,
  Users,
  Wind,
} from 'lucide-react';
import RiskGauge from '../../../components/RiskGauge';
import ShapExplainer from '../../../components/ShapExplainer';
import VitalsChart from '../../../components/VitalsChart';
import { getAlerts, getPatientHistory, getPatients } from '../../../lib/api';
import { connectWebSocket, onRiskUpdate } from '../../../lib/websocket';

const getPredictionAccent = (riskLevel) => {
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') return '#DC2626';
  if (riskLevel === 'MEDIUM') return '#F59E0B';
  return '#0E6B50';
};

const buildFallbackPrediction = (patient) => {
  if (!patient) {
    return {
      risk_score: 0.15,
      risk_level: 'LOW',
      priority: 'NORMAL',
      top_factors: ['Normal vitals baseline'],
    };
  }

  const isCritical = patient.lactate > 2.0 && (patient.heart_rate > 100 || patient.spo2 < 92);
  const isHigh = isCritical || patient.lactate > 2.0 || patient.heart_rate > 100 || patient.temperature > 38.3;
  return {
    risk_score: isCritical ? 0.92 : isHigh ? 0.74 : 0.15,
    risk_level: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW',
    priority: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'NORMAL',
    top_factors: isHigh
      ? ['Elevated Lactate', 'High Heart Rate', 'Elevated Temperature'].filter((factor) => {
          if (factor === 'Elevated Lactate') return patient.lactate > 2.0;
          if (factor === 'High Heart Rate') return patient.heart_rate > 100;
          if (factor === 'Elevated Temperature') return patient.temperature > 38.3;
          return false;
        })
      : ['Normal vitals baseline'],
  };
};

export default function PatientPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [patient, setPatient] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [username, setUsername] = useState('Doctor');

  const loadData = async () => {
    try {
      const [patients, patientHistory, alertHistory] = await Promise.all([
        getPatients(),
        getPatientHistory(id),
        getAlerts({ includeDismissed: true }),
      ]);

      const currentPatient = patients.find((item) => item.patient_id === id) || null;
      setPatient(currentPatient);
      setHistory(patientHistory);
      setAlerts(alertHistory.filter((alert) => alert.patient_id === id));
      setPrediction((prev) => prev || buildFallbackPrediction(currentPatient));
    } catch (error) {
      console.error('Failed to load patient page:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('username');
      if (stored) setUsername(stored);
    }

    loadData();
    connectWebSocket();
    const unsubscribe = onRiskUpdate((updates) => {
      const match = updates.find((item) => item.patient_id === id);
      if (match) {
        setPrediction(match);
        loadData();
      }
    });

    return () => unsubscribe();
  }, [id]);

  const currentPrediction = prediction || buildFallbackPrediction(patient);
  const accent = getPredictionAccent(currentPrediction.risk_level);

  const topFactors = useMemo(() => {
    const factors = currentPrediction.top_factors || [];
    return factors.length > 0 ? factors : ['Normal vitals baseline'];
  }, [currentPrediction]);

  const formattedUsername = username
    .split(/[_.-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const VitalCard = ({ icon, label, value, unit, highlight }) => (
    <div
      className="hb-card"
      style={{
        padding: '20px',
        background: highlight ? '#FEF2F2' : '#FFFFFF',
        borderColor: highlight ? '#FCA5A5' : 'var(--hb-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--hb-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
        {icon}
        {label}
      </div>
      <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: highlight ? '#DC2626' : 'var(--hb-text-main)' }}>
        {value}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--hb-text-muted)', marginLeft: '4px' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="hb-dashboard-container fade-in-page">
      <aside className="hb-sidebar">
        <div className="hb-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HeartPulse size={24} color="var(--hb-primary)" />
          VitalSense AI
        </div>

        <div className="hb-sidebar-menu">
          <div className="hb-menu-group-title">Main Menu</div>
          <Link href="/dashboard" className="hb-menu-item">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/dashboard" className="hb-menu-item active">
            <Users size={18} /> Patients
          </Link>
          <Link href="/alerts" className="hb-menu-item">
            <ShieldAlert size={18} /> Alerts
          </Link>
        </div>

        <div className="hb-sidebar-menu" style={{ marginTop: 'auto' }}>
          <div className="hb-menu-group-title">Other</div>
          <a href="#" className="hb-menu-item"><Settings size={18} /> Settings</a>
          <a href="#" className="hb-menu-item"><HelpCircle size={18} /> Help center</a>
          <a
            href="#"
            className="hb-menu-item"
            style={{ color: '#DC2626' }}
            onClick={(event) => {
              event.preventDefault();
              localStorage.removeItem('username');
              router.push('/login');
            }}
          >
            <LogOut size={18} /> Logout
          </a>
        </div>
      </aside>

      <main className="hb-main">
        <header className="hb-header">
          <div className="hb-header-greeting">
            <h2>Patient Detail • <span style={{ color: 'var(--hb-primary)' }}>{id}</span></h2>
            <p>{formattedUsername} viewing {patient?.bed_number || 'ICU bed'} • live telemetry active</p>
          </div>

          <Link
            href="/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--hb-primary)', fontWeight: 700 }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </header>

        <div className="hb-content-body">
          {(currentPrediction.risk_level === 'CRITICAL' || currentPrediction.risk_level === 'HIGH') && (
            <div className="flash-banner">
              Patient {id} is currently {currentPrediction.risk_level}. Immediate clinical review recommended.
            </div>
          )}

          <div className="hb-demo-banner">
            LIVE DEMO - Simulated ICU Data Stream Active
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0 24px 0' }}>
            <span className="hb-badge" style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33` }}>
              {currentPrediction.risk_level} RISK
            </span>
            <span className="hb-badge" style={{ background: '#F3F4F6', color: '#4B5563' }}>
              {currentPrediction.priority} PRIORITY
            </span>
            <span className="hb-badge" style={{ background: '#ECFDF5', color: '#0E6B50' }}>
              {patient?.bed_number || 'ICU bed'}
            </span>
            <span className="hb-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
              {patient?.status || 'STABLE'}
            </span>
          </div>

          <div className="patient-detail-grid">
            <div className="hb-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 22px 0', fontSize: '1.1rem', fontWeight: 700 }}>Current Vitals</h3>
              <div className="patient-vitals-grid">
                {patient && (
                  <>
                    <VitalCard icon={<Heart size={12} />} label="Heart Rate" value={patient.heart_rate} unit="bpm" highlight={patient.heart_rate > 100} />
                    <VitalCard icon={<Thermometer size={12} />} label="Temperature" value={patient.temperature} unit="°C" highlight={patient.temperature > 38.3} />
                    <VitalCard icon={<Activity size={12} />} label="SpO2" value={patient.spo2} unit="%" highlight={patient.spo2 < 92} />
                    <VitalCard icon={<Droplets size={12} />} label="Lactate" value={patient.lactate} unit="mmol/L" highlight={patient.lactate > 2.0} />
                    <VitalCard icon={<TrendingUp size={12} />} label="Systolic BP" value={patient.systolic_bp} unit="mmHg" highlight={patient.systolic_bp < 90} />
                    <VitalCard icon={<Wind size={12} />} label="Resp. Rate" value={patient.respiratory_rate} unit="/min" highlight={patient.respiratory_rate > 22} />
                    <VitalCard icon={<FlaskConical size={12} />} label="WBC" value={patient.wbc} unit="k/uL" highlight={patient.wbc > 12} />
                    <VitalCard icon={<FlaskConical size={12} />} label="Creatinine" value={patient.creatinine} unit="mg/dL" highlight={patient.creatinine > 1.2} />
                  </>
                )}
              </div>
            </div>

            <div className="hb-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Risk Gauge</h3>
              <RiskGauge value={currentPrediction.risk_score || 0} />
              <div style={{ fontWeight: 800, color: accent, letterSpacing: '0.05em' }}>{currentPrediction.risk_level}</div>
              <div style={{ color: 'var(--hb-text-muted)', fontSize: '0.82rem' }}>Patient ID {id}</div>
            </div>
          </div>

          <div className="hb-card" style={{ padding: '32px', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>Vitals History (Last 10 Readings)</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.82rem', color: 'var(--hb-text-muted)' }}>
              Real-time telemetry history streamed every 15 seconds.
            </p>
            <VitalsChart history={history} />
          </div>

          <div className="patient-detail-grid" style={{ marginTop: '24px' }}>
            <div className="hb-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>SHAP Explainability</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: 'var(--hb-text-muted)' }}>
                Positive bars increase sepsis risk. Negative bars reduce it.
              </p>
              {topFactors[0] !== 'Normal vitals baseline' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--hb-text-muted)', fontWeight: 700, alignSelf: 'center' }}>Triggered by:</span>
                  {topFactors.map((factor) => (
                    <span key={factor} style={{ padding: '4px 10px', borderRadius: '9999px', background: '#FEE2E2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700 }}>
                      {factor} ↑
                    </span>
                  ))}
                </div>
              )}
              <ShapExplainer top_factors={topFactors} />
            </div>

            <div className="hb-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700 }}>Alert History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.length === 0 && (
                  <div style={{ color: 'var(--hb-text-muted)', fontSize: '0.9rem' }}>No alerts recorded for this patient yet.</div>
                )}
                {alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className={alert.priority === 'CRITICAL' ? 'critical-alert-pulse' : ''}
                    style={{
                      border: '1px solid var(--hb-border)',
                      borderLeft: `4px solid ${getPredictionAccent(alert.risk_level)}`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={14} color={getPredictionAccent(alert.risk_level)} />
                        {alert.risk_level} • {alert.priority}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--hb-text-muted)' }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', color: 'var(--hb-text-main)', lineHeight: 1.5 }}>{alert.message}</p>
                    {alert.top_factors?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {alert.top_factors.map((factor) => (
                          <span key={`${alert.alert_id}-${factor}`} style={{ padding: '4px 8px', borderRadius: '9999px', background: '#FFF7ED', color: '#C2410C', fontSize: '0.72rem', fontWeight: 700 }}>
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
