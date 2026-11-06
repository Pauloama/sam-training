import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import DatasetScreen from './src/screens/DatasetScreen';
import TrainingMonitorScreen from './src/screens/TrainingMonitorScreen';
import InferenceScreen from './src/screens/InferenceScreen';
import { mobileApi } from './src/services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'capture' | 'dataset' | 'training' | 'inference'>('home');
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [cats, imgData, statsData, jobsData] = await Promise.all([
        mobileApi.getCategories().catch(() => [
          { id: '1', name: 'Credit Card', colorHex: '#10B981', imageCount: 12 },
          { id: '2', name: 'Identity Document (RG/CNH)', colorHex: '#06B6D4', imageCount: 18 },
          { id: '3', name: 'Fiscal Invoice / Receipt', colorHex: '#6366F1', imageCount: 9 },
          { id: '4', name: 'Banknote / Currency', colorHex: '#F59E0B', imageCount: 15 },
          { id: '5', name: 'Contract Signature Check', colorHex: '#EC4899', imageCount: 6 }
        ]),
        mobileApi.getImages().catch(() => ({ items: [] })),
        mobileApi.getStats().catch(() => ({ totalImages: 60, trainCount: 48, validationCount: 12 })),
        mobileApi.getTrainingJobs().catch(() => [
          {
            id: 'demo-job-1',
            jobName: 'SAM3-Mobile-Run-v1',
            baseModel: 'SAM-3-ViT-B',
            status: 'Completed',
            currentEpoch: 10,
            epochs: 10,
            bestAccuracy: 0.964,
            bestMeanIoU: 0.892,
            currentLoss: 0.1245,
            totalSamples: 60,
            createdAtUtc: new Date().toISOString()
          }
        ])
      ]);

      setCategories(cats);
      setImages(imgData.items || []);
      setStats(statsData);
      setJobs(jobsData);
    } catch (err) {
      console.warn('Could not load mobile data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Screen View */}
      <View style={styles.content}>
        {currentTab === 'home' && (
          <DashboardScreen 
            stats={stats} 
            categories={categories} 
            jobs={jobs} 
            onNavigate={setCurrentTab} 
          />
        )}
        {currentTab === 'capture' && (
          <CaptureScreen 
            categories={categories} 
            onUploaded={loadData}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'dataset' && (
          <DatasetScreen 
            images={images} 
            onRefresh={loadData} 
          />
        )}
        {currentTab === 'training' && (
          <TrainingMonitorScreen 
            jobs={jobs} 
            stats={stats} 
            onRefresh={loadData} 
          />
        )}
        {currentTab === 'inference' && (
          <InferenceScreen />
        )}
      </View>

      {/* Fintech Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab('home')}>
          <Text style={[styles.tabIcon, currentTab === 'home' && styles.tabActive]}>📊</Text>
          <Text style={[styles.tabText, currentTab === 'home' && styles.tabActiveText]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab('capture')}>
          <Text style={[styles.tabIcon, currentTab === 'capture' && styles.tabActive]}>📷</Text>
          <Text style={[styles.tabText, currentTab === 'capture' && styles.tabActiveText]}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab('dataset')}>
          <Text style={[styles.tabIcon, currentTab === 'dataset' && styles.tabActive]}>🗂️</Text>
          <Text style={[styles.tabText, currentTab === 'dataset' && styles.tabActiveText]}>Assets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab('training')}>
          <Text style={[styles.tabIcon, currentTab === 'training' && styles.tabActive]}>⚙️</Text>
          <Text style={[styles.tabText, currentTab === 'training' && styles.tabActiveText]}>Train</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab('inference')}>
          <Text style={[styles.tabIcon, currentTab === 'inference' && styles.tabActive]}>⚡</Text>
          <Text style={[styles.tabText, currentTab === 'inference' && styles.tabActiveText]}>Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingBottom: 16
  },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 18, marginBottom: 4 },
  tabText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  tabActive: { transform: [{ scale: 1.15 }] },
  tabActiveText: { color: '#10B981', fontWeight: '700' }
});
