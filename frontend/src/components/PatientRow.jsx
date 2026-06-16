'use client';

import Link from 'next/link';

export default function PatientRow({ patient, prediction = {} }) {
  const { patient_id, heart_rate, temperature, spo2, lactate } = patient;
  
  const risk_score = prediction.risk_score !== undefined ? prediction.risk_score : 0.15;
  const risk_level = prediction.risk_level || 'LOW';
  const priority = prediction.priority || 'NORMAL';

  let badgeClass = 'badge-low';
  let progressColor = 'var(--low-risk)';
  if (risk_level === 'HIGH' || risk_level === 'CRITICAL') {
    badgeClass = 'badge-high';
    progressColor = 'var(--high-risk)';
  } else if (risk_level === 'MEDIUM') {
    badgeClass = 'badge-medium';
    progressColor = 'var(--med-risk)';
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td data-label="Patient ID" style={{ fontWeight: 'bold', color: '#fff' }}>{patient_id}</td>
      <td data-label="Heart Rate">{heart_rate} <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>bpm</span></td>
      <td data-label="Temp">{temperature} <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>°C</span></td>
      <td data-label="SpO2">{spo2}%</td>
      <td data-label="Lactate">{lactate} <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>mmol/L</span></td>
      <td data-label="Risk Score" style={{ width: '180px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.875rem', minWidth: '40px', fontWeight: 'bold' }}>
            {Math.round(risk_score * 100)}%
          </span>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{
                width: `${risk_score * 100}%`,
                backgroundColor: progressColor
              }}
            ></div>
          </div>
        </div>
      </td>
      <td data-label="Risk Level">
        <span className={`badge ${badgeClass}`}>{risk_level}</span>
      </td>
      <td data-label="Priority">
        <span className={`badge ${priority === 'CRITICAL' || priority === 'HIGH' ? 'badge-high' : priority === 'WARNING' ? 'badge-medium' : 'badge-normal'}`}>
          {priority}
        </span>
      </td>
      <td data-label="Actions">
        <Link href={`/patient/${patient_id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          View
        </Link>
      </td>
    </tr>
  );
}

