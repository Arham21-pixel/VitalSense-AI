'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import AlertCard from '../../components/AlertCard';
import { dismissAlert, getAlerts } from '../../lib/api';

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [username, setUsername] = useState('Doctor');

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('username');
      if (stored) {
        setUsername(stored);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (alertId) => {
    try {
      await dismissAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.alert_id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const formattedUsername = username
    .split(/[_.-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { CRITICAL: 1, HIGH: 2, WARNING: 3, NORMAL: 4 };
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
  });

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
          <Link href="/dashboard" className="hb-menu-item">
            <Users size={18} /> Patients
          </Link>
          <Link href="/alerts" className="hb-menu-item active">
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
            <h2>Alerts Center • <span style={{ color: 'var(--hb-primary)' }}>{formattedUsername}</span></h2>
            <p>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading alerts...'} • Critical alerts sorted first
            </p>
          </div>

          <div className="hb-header-actions">
            <button className="hb-icon-btn"><Bell size={18} /></button>
          </div>
        </header>

        <div className="hb-content-body">
          <div className="hb-demo-banner">LIVE DEMO - Simulated ICU Data Stream Active</div>

          <div style={{ maxWidth: '920px', width: '100%', margin: '24px auto 0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={28} color="#DC2626" />
                Active Clinical Alerts
              </h1>
              <p style={{ margin: '6px 0 0 0', color: 'var(--hb-text-muted)' }}>
                Every alert includes the model rationale, severity, and dismissal controls for the live demo.
              </p>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {[1, 2, 3].map((item) => (
                  <div key={item} className="skeleton-line" style={{ height: '148px' }}></div>
                ))}
              </div>
            ) : sortedAlerts.length > 0 ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {sortedAlerts.map((alert) => (
                  <AlertCard key={alert.alert_id} alert={alert} onDismiss={handleDismiss} />
                ))}
              </div>
            ) : (
              <div className="hb-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--hb-primary)' }}>All Patients Stable</h3>
                <p style={{ margin: 0, color: 'var(--hb-text-muted)' }}>No active sepsis alerts at this moment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
