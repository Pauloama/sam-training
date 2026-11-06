import React from 'react';
import { Layers, Activity, Cpu, Sparkles } from 'lucide-react';

export default function Header({ currentTab, stats }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
          {currentTab === 'overview' && 'Fintech Vision Portfolio'}
          {currentTab === 'dataset' && 'Asset Management & Dataset Repository'}
          {currentTab === 'training' && 'SAM 3 Model Fine-Tuning Terminal'}
          {currentTab === 'inference' && 'Live SAM 3 Inference & Segmentation'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Meta Segment Anything Model (SAM 3) adapted for Financial Document & Asset Classification
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="status-dot dot-running" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PyTorch Core:</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            READY (CUDA/CPU)
          </span>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} color="var(--emerald-accent)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--emerald-accent)' }}>
            SAM 3 ViT-B Active
          </span>
        </div>
      </div>
    </header>
  );
}
