import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Terminal, 
  Eye, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import DatasetView from './components/DatasetView';
import TrainingView from './components/TrainingView';
import InferenceView from './components/InferenceView';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cats, imgData, statsData, jobsData] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getImages({ pageSize: 50 }).catch(() => ({ items: [] })),
        api.getStats().catch(() => null),
        api.getTrainingJobs().catch(() => [])
      ]);

      setCategories(cats);
      setImages(imgData.items || []);
      setStats(statsData);
      setJobs(jobsData);
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Fintech Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon-box">
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <div className="brand-title">SAM 3 Fintech</div>
            <div className="brand-tag">VISION LAB v1.0</div>
          </div>
        </div>

        <nav>
          <ul className="nav-list">
            <li>
              <button 
                className={`nav-item-btn ${currentTab === 'overview' ? 'active' : ''}`}
                onClick={() => setCurrentTab('overview')}
              >
                <LayoutDashboard size={18} />
                <span>Overview & Assets</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item-btn ${currentTab === 'dataset' ? 'active' : ''}`}
                onClick={() => setCurrentTab('dataset')}
              >
                <Database size={18} />
                <span>Dataset Repository</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item-btn ${currentTab === 'training' ? 'active' : ''}`}
                onClick={() => setCurrentTab('training')}
              >
                <Terminal size={18} />
                <span>SAM 3 Training</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item-btn ${currentTab === 'inference' ? 'active' : ''}`}
                onClick={() => setCurrentTab('inference')}
              >
                <Eye size={18} />
                <span>Inference Studio</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer Metrics */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid var(--border)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>GPU Utilization:</span>
              <span style={{ color: 'var(--emerald-accent)', fontWeight: 700 }}>Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Total Assets:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{stats?.totalImages || images.length}</span>
            </div>
          </div>

          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
            onClick={loadData}
          >
            <RefreshCw size={14} /> Refresh System
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Header currentTab={currentTab} stats={stats} />

        {currentTab === 'overview' && (
          <OverviewView 
            stats={stats} 
            categories={categories} 
            jobs={jobs} 
            onNavigate={setCurrentTab} 
          />
        )}

        {currentTab === 'dataset' && (
          <DatasetView 
            categories={categories} 
            images={images} 
            onRefresh={loadData}
            stats={stats}
          />
        )}

        {currentTab === 'training' && (
          <TrainingView 
            jobs={jobs} 
            onRefresh={loadData}
            stats={stats}
          />
        )}

        {currentTab === 'inference' && (
          <InferenceView 
            categories={categories} 
            onRefresh={loadData}
          />
        )}
      </main>
    </div>
  );
}
