'use client';

import { Check, ShieldAlert } from 'lucide-react';
import ShapExplainer from './ShapExplainer';

const getAccent = (riskLevel) => {
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') return '#DC2626';
  if (riskLevel === 'MEDIUM') return '#F59E0B';
  return '#0E6B50';
};

export default function AlertCard({ alert, onDismiss }) {
  const accent = getAccent(alert.risk_level);

  return (
    <div
      className={`hb-card ${alert.priority === 'CRITICAL' ? 'critical-alert-pulse' : ''}`}
      style={{
        borderLeft: `5px solid ${accent}`,
        padding: '24px',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 800 }}>
            <ShieldAlert size={18} color={accent} />
            Patient {alert.patient_id} • {alert.risk_level}
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--hb-text-muted)', marginTop: '6px' }}>
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="hb-badge" style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33` }}>
            {alert.priority}
          </span>
          <button
            onClick={() => onDismiss(alert.alert_id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: '1px solid var(--hb-border)',
              background: '#FFFFFF',
              color: 'var(--hb-text-main)',
              fontWeight: 700,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            <Check size={14} />
            Dismiss
          </button>
        </div>
      </div>

      <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--hb-text-main)' }}>{alert.message}</p>

      {alert.top_factors?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--hb-text-muted)', fontWeight: 700, alignSelf: 'center' }}>Triggered by:</span>
          {alert.top_factors.map((factor) => (
            <span
              key={`${alert.alert_id}-${factor}`}
              style={{
                fontSize: '0.75rem',
                background: '#FEE2E2',
                color: '#DC2626',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontWeight: 700,
              }}
            >
              {typeof factor === 'string' ? factor : factor.feature}
            </span>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--hb-border)', paddingTop: '16px' }}>
        <ShapExplainer top_factors={alert.top_factors || []} />
      </div>
    </div>
  );
}
