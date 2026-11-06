import React, { useState } from 'react';
import { UploadCloud, Plus, Trash2, Filter, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function DatasetView({ categories, images, onRefresh, stats }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [selectedSplit, setSelectedSplit] = useState(0); // 0=Train, 1=Validation
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [filterSplit, setFilterSplit] = useState('all');
  
  // New Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFilesToUpload(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!filesToUpload.length || !selectedCategory) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach(f => formData.append('files', f));
      formData.append('categoryId', selectedCategory);
      formData.append('split', selectedSplit);
      formData.append('source', 0); // Web

      await api.uploadImages(formData);
      setFilesToUpload([]);
      onRefresh();
    } catch (err) {
      alert('Error uploading images: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this image from the dataset?')) {
      await api.deleteImage(id);
      onRefresh();
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        code: newCatCode.trim() || undefined,
        colorHex: newCatColor,
        description: 'Custom fintech asset category'
      });
      setShowCatModal(false);
      setNewCatName('');
      setNewCatCode('');
      onRefresh();
    } catch (err) {
      alert('Failed to create category: ' + err.message);
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Seed sample images if dataset is empty
  const handleSeedSamples = async () => {
    setIsUploading(true);
    try {
      // Create lightweight synthetic SVG images converted to blobs for demonstration
      const sampleDefs = [
        { name: 'Nubank_Violet_Card.png', cat: 'Credit Card', color: '#8A05BE', text: 'CREDIT CARD' },
        { name: 'Visa_Infinite_Black.png', cat: 'Credit Card', color: '#1E293B', text: 'PLATINUM CARD' },
        { name: 'Driver_License_CNH.png', cat: 'Identity Document (RG/CNH)', color: '#065F46', text: 'CNH BRASIL' },
        { name: 'RG_Civil_Document.png', cat: 'Identity Document (RG/CNH)', color: '#06B6D4', text: 'REGISTRO GERAL' },
        { name: 'Supermarket_Receipt_NFC.png', cat: 'Fiscal Invoice / Receipt', color: '#475569', text: 'NOTA FISCAL' },
        { name: 'Invoice_Tax_Slip_DANFE.png', cat: 'Fiscal Invoice / Receipt', color: '#6366F1', text: 'DANFE INVOICE' },
        { name: 'Banknote_100_Reais.png', cat: 'Banknote / Currency', color: '#0284C7', text: 'R$ 100 REAIS' },
        { name: 'Banknote_50_Reais.png', cat: 'Banknote / Currency', color: '#EA580C', text: 'R$ 50 REAIS' },
        { name: 'Check_Signature_Bank.png', cat: 'Contract Signature Check', color: '#9D174D', text: 'CHEQUE BANCARIO' }
      ];

      for (const item of sampleDefs) {
        const catObj = categories.find(c => c.name === item.cat) || categories[0];
        if (!catObj) continue;

        // Create canvas SVG blob
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
          <rect width="400" height="260" rx="16" fill="${item.color}"/>
          <rect x="20" y="20" width="360" height="220" rx="10" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <text x="200" y="120" font-family="sans-serif" font-weight="bold" font-size="22" fill="#FFFFFF" text-anchor="middle">${item.text}</text>
          <text x="200" y="155" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">FINTECH VERIFIED ASSET</text>
          <circle cx="60" cy="60" r="18" fill="rgba(255,255,255,0.3)"/>
        </svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const file = new File([blob], item.name, { type: 'image/svg+xml' });

        const formData = new FormData();
        formData.append('files', file);
        formData.append('categoryId', catObj.id);
        formData.append('split', Math.random() > 0.3 ? 0 : 1);
        formData.append('source', 0);
        await api.uploadImages(formData);
      }

      onRefresh();
    } catch (err) {
      alert('Error seeding samples: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredImages = images.filter(img => {
    if (filterCat !== 'all' && img.categoryId !== filterCat) return false;
    if (filterSplit !== 'all' && img.split.toString() !== filterSplit) return false;
    return true;
  });

  return (
    <div>
      {/* Upload & Deposit Card */}
      <div className="fintech-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Deposit & Tag Fintech Images</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Upload single or bulk images, assign category tags, and partition into train/validation sets for SAM 3 fine-tuning.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary" 
              onClick={handleSeedSamples}
              disabled={isUploading}
              title="Add high-quality synthetic cards and documents to experiment immediately"
            >
              <Sparkles size={16} color="var(--emerald-accent)" /> Auto-Seed Demo Samples
            </button>
            <button className="btn-secondary" onClick={() => setShowCatModal(true)}>
              <Plus size={16} /> New Category
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
          {/* Dropzone */}
          <div>
            <label className="dropzone" style={{ display: 'block' }}>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <UploadCloud size={40} color="var(--emerald-accent)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                {filesToUpload.length > 0 
                  ? `${filesToUpload.length} file(s) selected for deposit` 
                  : 'Click or drag images here to deposit into dataset'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports PNG, JPG, WebP, SVG (Credit Cards, Documents, Checks, Receipts, Notes)
              </div>
            </label>
          </div>

          {/* Tagging Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Assigned Category Target:
              </label>
              <select 
                className="fintech-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code || 'CAT'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Dataset Partition Split:
              </label>
              <select 
                className="fintech-select"
                value={selectedSplit}
                onChange={e => setSelectedSplit(Number(e.target.value))}
              >
                <option value={0}>Training Set (80% Default)</option>
                <option value={1}>Validation Set (20% Default)</option>
                <option value={2}>Test Evaluation Set</option>
              </select>
            </div>

            <button 
              className="btn-primary" 
              style={{ marginTop: 'auto', justifyContent: 'center' }}
              onClick={handleUpload}
              disabled={isUploading || filesToUpload.length === 0}
            >
              {isUploading ? 'Depositing into Database...' : `Deposit ${filesToUpload.length} Asset(s)`}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            className="fintech-select" 
            style={{ width: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="all">All Categories ({images.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            className="fintech-select" 
            style={{ width: '180px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={filterSplit}
            onChange={e => setFilterSplit(e.target.value)}
          >
            <option value="all">All Splits</option>
            <option value="Train">Train Set</option>
            <option value="Validation">Validation Set</option>
            <option value="Test">Test Set</option>
          </select>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Showing {filteredImages.length} of {images.length} assets
        </span>
      </div>

      {/* Images Grid */}
      {filteredImages.length > 0 ? (
        <div className="dataset-grid">
          {filteredImages.map(img => (
            <div key={img.id} className="dataset-card">
              <img 
                src={img.url} 
                alt={img.originalFileName} 
                className="dataset-thumb"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%231e293b"><text x="50%" y="50%" fill="%2394a3b8" text-anchor="middle">Preview Not Ready</text></svg>';
                }}
              />
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span 
                    className="badge" 
                    style={{ 
                      background: `${img.categoryColor}22`, 
                      color: img.categoryColor,
                      border: `1px solid ${img.categoryColor}44`
                    }}
                  >
                    {img.categoryName}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {img.split}
                  </span>
                </div>

                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: '#FFFFFF', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {img.originalFileName}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {(img.fileSizeBytes / 1024).toFixed(1)} KB
                  </span>
                  <button 
                    onClick={() => handleDelete(img.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--rose-accent)', cursor: 'pointer', padding: '4px' }}
                    title="Delete image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fintech-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ImageIcon size={48} color="var(--text-faint)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Dataset Repository Empty</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px' }}>
            There are no images deposited for the selected filter. Upload credit cards, documents or click "Auto-Seed Demo Samples" to get started immediately.
          </p>
          <button className="btn-primary" onClick={handleSeedSamples}>
            <Sparkles size={16} /> Auto-Seed Demo Samples
          </button>
        </div>
      )}

      {/* New Category Modal */}
      {showCatModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="fintech-card" style={{ width: '420px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Create Fintech Category</h3>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Category Name:
                </label>
                <input 
                  type="text" 
                  className="fintech-input" 
                  placeholder="e.g. Bank Statement (Extrato)" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Identifier Code:
                </label>
                <input 
                  type="text" 
                  className="fintech-input" 
                  placeholder="e.g. FIN-EXT-06" 
                  value={newCatCode} 
                  onChange={e => setNewCatCode(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Color Accent:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={newCatColor} 
                    onChange={e => setNewCatColor(e.target.value)} 
                    style={{ background: 'none', border: 'none', width: '36px', height: '36px', cursor: 'pointer' }} 
                  />
                  <input 
                    type="text" 
                    className="fintech-input" 
                    value={newCatColor} 
                    onChange={e => setNewCatColor(e.target.value)} 
                    style={{ fontFamily: 'var(--font-mono)' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCatModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isCreatingCat}>
                  {isCreatingCat ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
