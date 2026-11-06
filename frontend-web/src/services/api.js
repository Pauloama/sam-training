const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(data) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  // Images & Dataset
  async getImages(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/images?${query}`);
    if (!res.ok) throw new Error('Failed to fetch images');
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/images/stats`);
    if (!res.ok) throw new Error('Failed to fetch dataset stats');
    return res.json();
  },

  async uploadImages(formData) {
    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload images');
    }
    return res.json();
  },

  async deleteImage(id) {
    const res = await fetch(`${API_BASE}/images/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete image');
    return true;
  },

  // Training
  async getTrainingJobs() {
    const res = await fetch(`${API_BASE}/training/jobs`);
    if (!res.ok) throw new Error('Failed to fetch training jobs');
    return res.json();
  },

  async getTrainingJob(id) {
    const res = await fetch(`${API_BASE}/training/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch training job details');
    return res.json();
  },

  async startTraining(config) {
    const res = await fetch(`${API_BASE}/training/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to enqueue training run');
    }
    return res.json();
  },

  async getAvailableModels() {
    const res = await fetch(`${API_BASE}/training/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  // Inference
  async predict(formData) {
    const res = await fetch(`${API_BASE}/inference/predict`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to run SAM 3 inference');
    }
    return res.json();
  },

  async getInferenceHistory() {
    const res = await fetch(`${API_BASE}/inference/history`);
    if (!res.ok) throw new Error('Failed to fetch prediction history');
    return res.json();
  }
};
