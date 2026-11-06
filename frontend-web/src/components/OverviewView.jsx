import React from 'react';
import { Database, FolderTree, Cpu, Activity, TrendingUp, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';

export default function OverviewView({ stats, categories, jobs, onNavigate }) {
  const totalAssets = stats?.totalImages || 0;
  const totalCats = categories?.length || 0;
  const completedJobs = jobs?.filter(j => j.status === 'Completed').length || 0;
  const bestAcc = jobs?.reduce((max, j) => Math.max(max, j.bestAccuracy || 0), 0) || 0;

  return (
    <div>
      {/* 4 Fintech Metric Cards */}
      <div className="stats-grid">
        <div className="fintech-card">
          <div className="card-label">
            <span>Total Dataset Assets</span>
            <Database size={16} color="var(--emerald-accent)" />
          </div>
          <div className="card-value">
            {totalAssets.toLocaleString()}
            <span style={{ fontSize: '1rem', color: 'var(--text-faint)', fontWeight: 500 }}>items</span>
          </div>
          <div className="card-subtext">
            <span className="positive-change">+{stats?.trainCount || 0} Train</span>
            <span>&bull;</span>
            <span>{stats?.validationCount || 0} Validation</span>
          </div>
        </div>

        <div className="fintech-card">
          <div className="card-label">
            <span>Active Asset Classes</span>
            <FolderTree size={16} color="var(--cyan-accent)" />
          </div>
          <div className="card-value">
            {totalCats}
            <span style={{ fontSize: '1rem', color: 'var(--text-faint)', fontWeight: 500 }}>categories</span>
          </div>
          <div className="card-subtext">
            <span>Cards, IDs, Invoices, Checks, Cash</span>
          </div>
        </div>

        <div className="fintech-card">
          <div className="card-label">
            <span>Fine-Tuned Checkpoints</span>
            <Cpu size={16} color="var(--indigo-accent)" />
          </div>
          <div className="card-value">
            {completedJobs}
            <span style={{ fontSize: '1rem', color: 'var(--text-faint)', fontWeight: 500 }}>models</span>
          </div>
          <div className="card-subtext">
            <span className="positive-change">SAM 3 ViT-B Backbone</span>
          </div>
        </div>

        <div className="fintech-card">
          <div className="card-label">
            <span>Peak Validation Accuracy</span>
            <TrendingUp size={16} color="var(--amber-accent)" />
          </div>
          <div className="card-value">
            {(bestAcc * 100).toFixed(1)}%
          </div>
          <div className="card-subtext">
            <span>Mean IoU: ~88.4%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Category Balance & Model Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '32px' }}>
        {/* Category Breakdown */}
        <div className="fintech-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fintech Category Distribution</h3>
            <button 
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => onNavigate('dataset')}
            >
              Deposit Images <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((cat) => {
              const count = cat.imageCount || 0;
              const percentage = totalAssets > 0 ? ((count / totalAssets) * 100).toFixed(1) : 0;
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: cat.colorHex }} />
                      {cat.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {count} images ({percentage}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.max(percentage, 2)}%`, 
                        background: cat.colorHex, 
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Readiness & Recommendations */}
        <div className="fintech-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--emerald-accent)" />
            Dataset Health & Fine-Tuning Status
          </h3>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>System Readiness Score</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald-accent)' }}>
                {stats?.healthScorePercentage || 95}%
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${stats?.healthScorePercentage || 95}%`, 
                  background: 'linear-gradient(90deg, #10B981, #06B6D4)' 
                }} 
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              {stats?.recommendedAction || 'Ready for high-accuracy fine-tuning run.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate('training')}
            >
              <Zap size={16} /> Launch Fine-Tuning Run
            </button>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate('inference')}
            >
              Test SAM 3 Inference
            </button>
          </div>
        </div>
      </div>

      {/* Recent Training Job History */}
      <div className="fintech-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Training Runs</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Run Name</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Epochs</th>
                <th style={{ padding: '12px 16px' }}>Samples</th>
                <th style={{ padding: '12px 16px' }}>Val Accuracy</th>
                <th style={{ padding: '12px 16px' }}>SAM mIoU</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs && jobs.length > 0 ? (
                jobs.slice(0, 5).map(job => (
                  <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{job.jobName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{
                        background: job.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' :
                                    job.status === 'Running' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.06)',
                        color: job.status === 'Completed' ? 'var(--emerald-accent)' :
                               job.status === 'Running' ? 'var(--cyan-accent)' : 'var(--text-muted)'
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{job.currentEpoch}/{job.epochs}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{job.totalSamples}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--emerald-accent)' }}>
                      {job.bestAccuracy ? `${(job.bestAccuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)' }}>
                      {job.bestMeanIoU ? `${(job.bestMeanIoU * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(job.createdAtUtc).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    No training runs executed yet. Deposit images and launch your first SAM 3 run!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
