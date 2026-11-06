import { Platform } from 'react-native';

// On Android Emulator localhost is 10.0.2.2, on iOS simulator it's localhost
const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api'
});

export let API_BASE_URL = DEFAULT_URL;

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.replace(/\/+$/, '');
};

export const mobileApi = {
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE_URL}/images/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getImages(page = 1, pageSize = 20) {
    const res = await fetch(`${API_BASE_URL}/images?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error('Failed to fetch images');
    return res.json();
  },

  async uploadImage(imageUri: string, categoryId: string, split: number = 0) {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `capture_${Date.now()}.jpg`;
    
    // In React Native FormData accepts an object with uri, type, and name
    formData.append('files', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg'
    } as any);

    formData.append('categoryId', categoryId);
    formData.append('split', split.toString());
    formData.append('source', '1'); // Mobile

    const res = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Mobile upload failed');
    }
    return res.json();
  },

  async getTrainingJobs() {
    const res = await fetch(`${API_BASE_URL}/training/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async startTraining(name: string, epochs: number = 10) {
    const res = await fetch(`${API_BASE_URL}/training/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobName: name,
        epochs: epochs,
        batchSize: 4,
        learningRate: 0.0001,
        freezeBackbone: true,
        baseModel: 'SAM-3-ViT-B'
      })
    });
    if (!res.ok) throw new Error('Failed to enqueue training run');
    return res.json();
  },

  async predictImage(imageUri: string) {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'predict.jpg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg'
    } as any);

    const res = await fetch(`${API_BASE_URL}/inference/predict`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Mobile SAM 3 inference failed');
    return res.json();
  }
};
