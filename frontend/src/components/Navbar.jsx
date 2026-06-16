'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      backgroundColor: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Activity size={24} color="var(--teal-accent)" />
        <Link href="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          VitalSense AI
        </Link>
      </div>

      {/* Hamburger Menu Icon for Mobile */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="hamburger-btn"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation menu */}
      <div className={`nav-menu ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
        <Link href="/dashboard" style={{
          fontWeight: pathname === '/dashboard' ? '600' : '400',
          color: pathname === '/dashboard' ? 'var(--teal-accent)' : 'var(--muted-text)',
          transition: 'color 0.2s'
        }}>
          Dashboard
        </Link>
        <Link href="/alerts" style={{
          fontWeight: pathname === '/alerts' ? '600' : '400',
          color: pathname === '/alerts' ? 'var(--teal-accent)' : 'var(--muted-text)',
          transition: 'color 0.2s'
        }}>
          Alerts
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', color: 'var(--low-risk)', fontWeight: '600' }}>
          <span className="pulse-dot"></span>
          LIVE
        </div>
      </div>
    </nav>
  );
}


