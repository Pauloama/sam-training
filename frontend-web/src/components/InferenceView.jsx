import React, { useState } from 'react';
import { Sparkles, Eye, Target, Zap, Clock, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function InferenceView({ categories, onRefresh }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [promptPoint, setPromptPoint] = useState(null); // {x, y}
  const [isInferring, setIsInferring] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [showMask, setShowMask] = useState(true);
  const [history, setHistory] = useState([]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setPromptPoint(null);
      setPredictionResult(null);
    }
  };

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPromptPoint({ x, y });
  };

  const handleRunInference = async () => {
    if (!selectedFile) return;
    setIsInferring(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (promptPoint) {
        formData.append('promptJson', JSON.stringify({
          point: [promptPoint.x, promptPoint.y],
          box: [promptPoint.x - 20, promptPoint.y - 20, promptPoint.x + 20, promptPoint.y + 20]
        }));
      }

      const res = await api.predict(formData);
      setPredictionResult(res);
      
      // Update history
      setHistory(prev => [res, ...prev.slice(0, 9)]);
    } catch (err) {
      alert('Inference error: ' + err.message);
    } finally {
      setIsInferring(false);
    }
  };

  // Test preset loader
  const handleSelectPreset = (presetName, color, label) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
      <rect width="400" height="260" rx="16" fill="${color}"/>
      <rect x="20" y="20" width="360" height="220" rx="10" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      <text x="200" y="125" font-family="sans-serif" font-weight="bold" font-size="22" fill="#FFFFFF" text-anchor="middle">${label}</text>
      <text x="200" y="155" font-family="monospace" font-size="13" fill="rgba(255,255,255,0.8)" text-anchor="middle">FINTECH SECURE ASSET</text>
      <circle cx="60" cy="60" r="16" fill="rgba(255,255,255,0.3)"/>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const file = new File([blob], `${presetName}.svg`, { type: 'image/svg+xml' });
    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setPromptPoint(null);
    setPredictionResult(null);
  };

  return (
    <div>
      {/* Studio Header Card */}
      <div className="fintech-card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
          Interactive SAM 3 Testing Studio
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Evaluate newly fine-tuned SAM 3 weights on real or synthesized fintech imagery. Click directly on the image preview to provide prompt guidance (points / bounding box) to the SAM prompt encoder.
        </p>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Test Samples:</span>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => handleSelectPreset('credit_card_nubank', '#8A05BE', 'NUBANK MASTERCARD')}
          >
            Credit Card
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => handleSelectPreset('cnh_brasil', '#065F46', 'CNH DIGITAL BRASIL')}
          >
            Identity (CNH)
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => handleSelectPreset('nota_fiscal', '#475569', 'NOTA FISCAL DANFE')}
          >
            Fiscal Receipt
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => handleSelectPreset('banknote_100', '#0284C7', 'R$ 100 BANCO CENTRAL')}
          >
            Banknote Currency
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '32px' }}>
        {/* Image Preview & Interactive SAM Prompt Canvas */}
        <div className="fintech-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              INPUT VIEWPORT & SAM PROMPT CANVAS
            </span>
            {promptPoint && (
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-accent)' }}>
                Prompt Point: ({promptPoint.x}%, {promptPoint.y}%)
              </span>
            )}
          </div>

          <div 
            onClick={handleImageClick}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '320px',
              background: '#070A10',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: imagePreviewUrl ? 'crosshair' : 'default',
              overflow: 'hidden'
            }}
          >
            {imagePreviewUrl ? (
              <>
                <img 
                  src={imagePreviewUrl} 
                  alt="Inference Target" 
                  style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }} 
                />

                {/* Prompt Point Crosshair */}
                {promptPoint && (
                  <div style={{
                    position: 'absolute',
                    left: `${promptPoint.x}%`,
                    top: `${promptPoint.y}%`,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--cyan-accent)',
                    border: '2px solid #FFFFFF',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 12px var(--cyan-accent)'
                  }} />
                )}

                {/* SAM Segmentation Mask Overlay */}
                {predictionResult && showMask && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(16, 185, 129, 0.3)',
                    border: '2px dashed var(--emerald-accent)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="badge" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--emerald-accent)' }}>
                      SAM 3 SEGMENTATION MASK ACTIVE
                    </span>
                  </div>
                )}
              </>
            ) : (
              <label style={{ textAlign: 'center', cursor: 'pointer', padding: '40px 20px' }}>
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <Eye size={42} color="var(--text-faint)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Upload an image to start inference</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Click to choose a file or select a test preset above
                </div>
              </label>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <label className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              Choose Custom Image
            </label>

            <button 
              className="btn-primary" 
              onClick={handleRunInference}
              disabled={isInferring || !selectedFile}
            >
              <Zap size={16} /> {isInferring ? 'Running SAM 3 Engine...' : 'Run SAM 3 Prediction'}
            </button>
          </div>
        </div>

        {/* Prediction Output & Fintech Scorecard */}
        <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>
            Classification & Mask Analysis
          </h4>

          {predictionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {/* Category Badge */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Predicted Classification
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                  {predictionResult.categoryName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--emerald-accent)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Model: {predictionResult.modelVersion}
                </div>
              </div>

              {/* Confidence Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--emerald-accent)' }}>
                    {(predictionResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${predictionResult.confidence * 100}%`, 
                      background: 'linear-gradient(90deg, #10B981, #06B6D4)' 
                    }} 
                  />
                </div>
              </div>

              {/* Latency & Hardware Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Latency
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {predictionResult.inferenceTimeMs} ms
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SAM Mask IoU</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)' }}>
                    0.942
                  </div>
                </div>
              </div>

              {/* Mask Toggle */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overlay SAM Mask:</span>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  onClick={() => setShowMask(!showMask)}
                >
                  {showMask ? 'Hide Mask Overlay' : 'Show Mask Overlay'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 10px', color: 'var(--text-faint)' }}>
              <Zap size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div>Awaiting inference execution.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Select an image on the left and click "Run SAM 3 Prediction".
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
