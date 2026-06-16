'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dismissAlert, getAlerts, getPatients, predict } from '../../lib/api';
import { connectWebSocket, onConnectionStatus, onRiskUpdate } from '../../lib/websocket';

const FALLBACK_PREDICTION = {
  risk_score: 0.15,
  risk_level: 'LOW',
  priority: 'NORMAL',
  alert: false,
  top_factors: [],
};

const getPredictionAccent = (riskLevel) => {
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    return '#DC2626';
  }
  if (riskLevel === 'MEDIUM') {
    return '#F59E0B';
  }
  return '#0E6B50';
};

export default function DashboardPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [systemStatus, setSystemStatus] = useState('OFFLINE');
  const [simulatedAlert, setSimulatedAlert] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [username, setUsername] = useState('Doctor');
  const notifiedRef = useRef({});

  const fetchData = async () => {
    try {
      const [patientsData, alertsData] = await Promise.all([getPatients(), getAlerts()]);
      setPatients(patientsData);
      setAlerts(alertsData);

      setPredictions((prev) => {
        const next = { ...prev };
        patientsData.forEach((patient) => {
          if (!next[patient.patient_id]) {
            const isCritical = patient.lactate > 2.0 && patient.heart_rate > 100;
            const isHigh = patient.lactate > 2.0 || patient.heart_rate > 100 || patient.temperature > 38.3;
            next[patient.patient_id] = {
              patient_id: patient.patient_id,
              risk_score: isCritical ? 0.91 : isHigh ? 0.74 : 0.15,
              risk_level: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW',
              priority: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'NORMAL',
              alert: isHigh,
              top_factors: [],
            };
          }
        });
        return next;
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('username');
      if (storedUser) {
        setUsername(storedUser);
      }
    }

    fetchData();
    const pollInterval = setInterval(fetchData, 15000);

    connectWebSocket();
    const unsubscribeRisk = onRiskUpdate((updates) => {
      setPredictions((prev) => {
        const next = { ...prev };
        updates.forEach((item) => {
          next[item.patient_id] = item;
        });
        return next;
      });
      setLastUpdated(new Date());
      getPatients().then(setPatients).catch(() => {});
      getAlerts().then(setAlerts).catch(() => {});
    });
    const unsubscribeStatus = onConnectionStatus(setSystemStatus);

    return () => {
      clearInterval(pollInterval);
      unsubscribeRisk();
      unsubscribeStatus();
    };
  }, []);

  const addToast = (message, patientId, severity) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, patientId, severity }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    Object.entries(predictions).forEach(([patientId, prediction]) => {
      const isHigh = prediction.risk_level === 'CRITICAL' || prediction.risk_level === 'HIGH';
      const alreadyNotified = notifiedRef.current[patientId];

      if (isHigh && !alreadyNotified) {
        addToast(
          `Patient ${patientId} is now ${prediction.risk_level} at ${Math.round((prediction.risk_score || 0) * 100)}% sepsis risk.`,
          patientId,
          prediction.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
        );
        notifiedRef.current[patientId] = true;
      }

      if (!isHigh && alreadyNotified) {
        notifiedRef.current[patientId] = false;
      }
    });
  }, [predictions]);

  const handleDismissAlert = async (alertId) => {
    try {
      await dismissAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.alert_id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleSimulateSepsis = async () => {
    if (simulatedAlert) {
      return;
    }

    setSimulatedAlert(true);
    try {
      await predict({
        patient_id: 'P001',
        heart_rate: 124.0,
        temperature: 39.5,
        respiratory_rate: 29.0,
        spo2: 89.0,
        systolic_bp: 82.0,
        wbc: 18.2,
        lactate: 4.4,
        creatinine: 2.1,
      });

      setPredictions((prev) => ({
        ...prev,
        P001: {
          patient_id: 'P001',
          risk_score: 0.94,
          risk_level: 'CRITICAL',
          priority: 'CRITICAL',
          alert: true,
          top_factors: ['Elevated Lactate', 'High Heart Rate', 'Elevated Temperature', 'Low SpO2'],
        },
      }));
      addToast('Patient P001 forced to 94% CRITICAL risk for live demo.', 'P001', 'CRITICAL');
      await fetchData();

      setTimeout(async () => {
        try {
          await predict({
            patient_id: 'P001',
            heart_rate: 79.0,
            temperature: 37.0,
            respiratory_rate: 17.0,
            spo2: 98.0,
            systolic_bp: 118.0,
            wbc: 7.4,
            lactate: 1.1,
            creatinine: 0.9,
          });
          setPredictions((prev) => ({
            ...prev,
            P001: {
              patient_id: 'P001',
              risk_score: 0.15,
              risk_level: 'LOW',
              priority: 'NORMAL',
              alert: false,
              top_factors: ['Normal vitals baseline'],
            },
          }));
          await fetchData();
        } finally {
          setSimulatedAlert(false);
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to simulate sepsis:', error);
      setSimulatedAlert(false);
    }
  };

  const highRiskCount = useMemo(
    () =>
      patients.filter((patient) => {
        const prediction = predictions[patient.patient_id] || FALLBACK_PREDICTION;
        return prediction.risk_level === 'CRITICAL' || prediction.risk_level === 'HIGH';
      }).length,
    [patients, predictions]
  );

  const chartData = useMemo(
    () =>
      patients.map((patient) => ({
        name: patient.patient_id,
        value: Math.round(((predictions[patient.patient_id] || FALLBACK_PREDICTION).risk_score || 0) * 100),
      })),
    [patients, predictions]
  );

  const formatUsername = username
    .split(/[_.-]/)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(' ');

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  const renderTableRows = () =>
    patients.map((patient) => {
      const prediction = predictions[patient.patient_id] || FALLBACK_PREDICTION;
      const riskPercent = Math.round((prediction.risk_score || 0) * 100);
      const accent = getPredictionAccent(prediction.risk_level);
      const rowClassName =
        prediction.risk_level === 'CRITICAL' || prediction.risk_level === 'HIGH'
          ? 'hb-row-high'
          : prediction.risk_level === 'MEDIUM'
            ? 'hb-row-medium'
            : 'hb-row-low';

      return (
        <tr key={patient.patient_id} className={rowClassName}>
          <td>
            <div style={{ fontWeight: 800 }}>{patient.patient_id}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--hb-text-muted)', marginTop: '4px' }}>{patient.bed_number}</div>
          </td>
          <td>{patient.heart_rate} bpm</td>
          <td>{patient.temperature} °C</td>
          <td>{patient.spo2}%</td>
          <td>{patient.lactate} mmol/L</td>
          <td style={{ minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong style={{ minWidth: '42px' }}>{riskPercent}%</strong>
              <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${riskPercent}%`,
                    height: '100%',
                    background: accent,
                    transition: 'width 0.8s ease',
                  }}
                ></div>
              </div>
            </div>
          </td>
          <td>
            <span className="hb-badge" style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33` }}>
              {prediction.risk_level}
            </span>
          </td>
          <td>
            <span
              className={`hb-badge ${prediction.priority === 'CRITICAL' ? 'critical-alert-pulse' : ''}`}
              style={{
                background: prediction.priority === 'CRITICAL' ? '#FEE2E2' : '#F3F4F6',
                color: prediction.priority === 'CRITICAL' || prediction.priority === 'HIGH' ? '#DC2626' : '#6B7280',
                border: '1px solid rgba(220,38,38,0.18)',
              }}
            >
              {prediction.priority}
            </span>
          </td>
          <td>
            <Link href={`/patient/${patient.patient_id}`} style={{ color: 'var(--hb-primary)', fontWeight: 700 }}>
              View
            </Link>
          </td>
        </tr>
      );
    });

  const renderMobileCards = () => (
    <div className="hb-mobile-cards">
      {patients.map((patient) => {
        const prediction = predictions[patient.patient_id] || FALLBACK_PREDICTION;
        const riskPercent = Math.round((prediction.risk_score || 0) * 100);
        const accent = getPredictionAccent(prediction.risk_level);

        return (
          <Link
            href={`/patient/${patient.patient_id}`}
            key={patient.patient_id}
            className="hb-card"
            style={{ padding: '20px', borderLeft: `4px solid ${accent}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{patient.patient_id}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--hb-text-muted)' }}>{patient.bed_number} • {patient.status}</div>
              </div>
              <span className="hb-badge" style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33` }}>
                {prediction.risk_level}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', color: 'var(--hb-text-main)' }}>
              <div><strong>{patient.heart_rate}</strong> bpm</div>
              <div><strong>{patient.temperature}</strong> °C</div>
              <div><strong>{patient.spo2}</strong>% SpO2</div>
              <div><strong>{patient.lactate}</strong> lactate</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${riskPercent}%`, height: '100%', background: accent, transition: 'width 0.8s ease' }}></div>
              </div>
              <strong style={{ color: accent }}>{riskPercent}%</strong>
            </div>
          </Link>
        );
      })}
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
          <Link href="/dashboard" className="hb-menu-item active">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/dashboard" className="hb-menu-item">
            <Users size={18} /> Patients
          </Link>
          <Link href="/alerts" className="hb-menu-item">
            <ShieldAlert size={18} /> Alerts
          </Link>
        </div>

        <div className="hb-sidebar-menu" style={{ marginTop: 'auto' }}>
          <div className="hb-menu-group-title">Other</div>
          <a href="#" className="hb-menu-item">
            <Settings size={18} /> Settings
          </a>
          <a href="#" className="hb-menu-item">
            <HelpCircle size={18} /> Help center
          </a>
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
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${toast.severity === 'CRITICAL' ? 'critical-alert-pulse' : ''}`}
              style={{ borderLeftColor: toast.severity === 'CRITICAL' ? '#DC2626' : '#F59E0B' }}
            >
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.875rem' }}>
                  {toast.severity === 'CRITICAL' ? 'CRITICAL SEPSIS WARNING' : 'HIGH RISK UPDATE'}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.4 }}>{toast.message}</p>
              </div>
            </div>
          ))}
        </div>

        <header className="hb-header">
          <div className="hb-header-greeting">
            <h2>Good morning, <span style={{ color: 'var(--hb-primary)' }}>{formatUsername}</span></h2>
            <p>
              {lastUpdated
                ? lastUpdated.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : 'Loading date...'}
              {' '}• ICU live telemetry mode
            </p>
          </div>

          <div className="hb-header-actions">
            <button className="hb-icon-btn"><Bell size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9999px', background: '#ECFDF5', color: '#0E6B50', fontWeight: 700, fontSize: '0.8rem' }}>
              <span className="pulse-dot"></span> LIVE
            </div>
          </div>
        </header>

        <div className="hb-content-body">
          <div className="hb-demo-banner">LIVE DEMO - Simulated ICU Data Stream Active</div>

          {simulatedAlert && (
            <div className="flash-banner">
              LIVE DEMO - Patient P001 forced to 94% CRITICAL risk for the next 30 seconds
            </div>
          )}

          <div className="hb-grid-top">
            <div className="hb-card hb-stat-card">
              <div className="hb-stat-header"><div className="hb-stat-icon"><Users size={16} /></div> Total Patients</div>
              <div className="hb-stat-value">{loading ? '...' : patients.length}</div>
              <div className="hb-stat-trend" style={{ color: 'var(--hb-text-muted)' }}>Monitored ICU beds</div>
            </div>

            <div className="hb-card hb-stat-card">
              <div className="hb-stat-header"><div className="hb-stat-icon"><AlertTriangle size={16} /></div> High Risk Count</div>
              <div className="hb-stat-value" style={{ color: highRiskCount > 0 ? '#DC2626' : 'var(--hb-text-main)' }}>{loading ? '...' : highRiskCount}</div>
              <div className="hb-stat-trend" style={{ color: 'var(--hb-text-muted)' }}>Live sepsis predictions</div>
            </div>

            <div className="hb-card hb-stat-card">
              <div className="hb-stat-header"><div className="hb-stat-icon"><ShieldAlert size={16} /></div> Active Alerts</div>
              <div className="hb-stat-value">{loading ? '...' : activeAlerts.length}</div>
              <div className="hb-stat-trend" style={{ color: 'var(--hb-text-muted)' }}>Critical alerts sorted first</div>
            </div>

            <div className="hb-card hb-stat-card">
              <div className="hb-stat-header"><div className="hb-stat-icon"><Activity size={16} /></div> System Status</div>
              <div className="hb-stat-value" style={{ color: systemStatus === 'ONLINE' ? '#10B981' : '#DC2626', fontSize: '1.7rem' }}>{systemStatus}</div>
              <div className="hb-stat-trend" style={{ color: 'var(--hb-text-muted)' }}>
                {systemStatus === 'ONLINE' ? 'WebSocket telemetry connected' : 'Attempting reconnect'}
              </div>
            </div>
          </div>

          <div className="hb-grid-middle">
            <div className="hb-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Real-Time Sepsis Risk</h3>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--hb-text-muted)' }}>Every patient is rescored every 15 seconds.</p>
                </div>
                <MoreHorizontal size={20} color="var(--hb-text-muted)" />
              </div>
              <div style={{ width: '100%', minWidth: 0, height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hb-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.value >= 70 ? '#DC2626' : entry.value >= 40 ? '#F59E0B' : '#0E6B50'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="hb-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', fontWeight: 700 }}>Quick Actions</h3>
              <div className="hb-quick-actions-grid">
                <button
                  className="hb-action-btn primary"
                  onClick={handleSimulateSepsis}
                  disabled={simulatedAlert}
                  style={{ background: '#DC2626', opacity: simulatedAlert ? 0.7 : 1, cursor: simulatedAlert ? 'not-allowed' : 'pointer' }}
                >
                  <AlertTriangle size={24} />
                  Simulate Sepsis Event
                </button>
                <Link href="/alerts" className="hb-action-btn secondary">
                  <ShieldAlert size={24} />
                  Review Alerts
                </Link>
                <Link href="/patient/P003" className="hb-action-btn secondary">
                  <Users size={24} />
                  Open Patient View
                </Link>
                <button className="hb-action-btn secondary" style={{ cursor: 'default' }}>
                  <Check size={24} />
                  Demo Mode Ready
                </button>
              </div>
            </div>
          </div>

          <div className="hb-grid-bottom">
            <div className="hb-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Real-Time Patient Monitoring</h3>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--hb-text-muted)' }}>
                    Heart Rate, Temperature, SpO2, Lactate, and animated risk bars update every 15 seconds.
                  </p>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--hb-text-muted)', fontWeight: 700 }}>
                  {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="skeleton-line" style={{ height: '58px' }}></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="hb-table-wrapper">
                    <table className="hb-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Heart Rate</th>
                          <th>Temperature</th>
                          <th>SpO2</th>
                          <th>Lactate</th>
                          <th>Risk Score</th>
                          <th>Risk Level</th>
                          <th>Priority</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>{renderTableRows()}</tbody>
                    </table>
                  </div>
                  {renderMobileCards()}
                </>
              )}
            </div>

            <div className="hb-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Alert Stream</h3>
                <MoreHorizontal size={20} color="var(--hb-text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '460px', overflowY: 'auto' }}>
                {activeAlerts.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--hb-text-muted)', padding: '40px 0' }}>
                    No active alerts right now.
                  </div>
                )}

                {activeAlerts.map((alert) => {
                  const accent = getPredictionAccent(alert.risk_level);
                  return (
                    <div
                      key={alert.alert_id}
                      className={`hb-activity-item ${alert.priority === 'CRITICAL' ? 'critical-alert-pulse' : ''}`}
                      style={{ borderLeft: `4px solid ${accent}`, paddingLeft: '14px' }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px 0' }}>
                          Patient {alert.patient_id} • {alert.risk_level}
                        </h4>
                        <p style={{ margin: 0, lineHeight: 1.5 }}>{alert.message}</p>
                        {alert.top_factors?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {alert.top_factors.map((factor) => (
                              <span
                                key={`${alert.alert_id}-${factor}`}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '9999px',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                {factor}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        <span className="hb-activity-time">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleDismissAlert(alert.alert_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--hb-primary)', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
