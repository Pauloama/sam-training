import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';

export default function TrainingMonitorScreen({ jobs, onRefresh, stats }: any) {
  const [isStarting, setIsStarting] = useState(false);
  const activeJob = jobs[0];

  const handleLaunch = async () => {
    if ((stats?.totalImages || 0) === 0) {
      Alert.alert('Empty Dataset', 'Please deposit at least 1 image before running fine-tuning.');
      return;
    }

    setIsStarting(true);
    try {
      await mobileApi.startTraining(`Mobile-SAM3-${Date.now().toString().slice(-4)}`, 10);
      Alert.alert('Training Queued', 'SAM 3 fine-tuning run enqueued on the GPU worker.');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const progressPercent = activeJob && activeJob.epochs > 0 
    ? Math.min(Math.round((activeJob.currentEpoch / activeJob.epochs) * 100), 100) 
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>SAM 3 Training Hub</Text>
      <Text style={styles.subtitle}>Fine-tune vision backbone on mobile & monitor convergence.</Text>

      {/* Active Run Card */}
      {activeJob ? (
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View>
              <Text style={styles.jobName}>{activeJob.jobName}</Text>
              <Text style={styles.jobModel}>{activeJob.baseModel}</Text>
            </View>
            <View style={[styles.statusBadge, activeJob.status === 'Completed' && { borderColor: '#10B981' }]}>
              <Text style={[styles.statusText, activeJob.status === 'Completed' && { color: '#10B981' }]}>
                {activeJob.status}
              </Text>
            </View>
          </View>

          {/* Progress Indicator */}
          <View style={{ marginVertical: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.progressLabel}>Epoch {activeJob.currentEpoch} / {activeJob.epochs}</Text>
              <Text style={[styles.progressLabel, { color: '#10B981', fontWeight: '700' }]}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Metrics row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Loss</Text>
              <Text style={styles.metricVal}>
                {activeJob.currentLoss !== null && activeJob.currentLoss !== undefined ? activeJob.currentLoss.toFixed(4) : '—'}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Val Accuracy</Text>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>
                {activeJob.bestAccuracy ? `${(activeJob.bestAccuracy * 100).toFixed(1)}%` : '—'}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SAM mIoU</Text>
              <Text style={[styles.metricVal, { color: '#06B6D4' }]}>
                {activeJob.bestMeanIoU ? `${(activeJob.bestMeanIoU * 100).toFixed(1)}%` : '—'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noJobBox}>
          <Text style={{ color: '#94A3B8', textAlign: 'center' }}>No active runs. Enqueue a job below.</Text>
        </View>
      )}

      {/* Launch Run Button */}
      <TouchableOpacity 
        style={styles.launchBtn} 
        onPress={handleLaunch}
        disabled={isStarting}
      >
        {isStarting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.launchBtnText}>⚡ Enqueue New SAM 3 Run (10 Epochs)</Text>
        )}
      </TouchableOpacity>

      {/* Recent Runs History */}
      <Text style={styles.sectionTitle}>Recent Runs</Text>
      {jobs.slice(1, 5).map((j: any) => (
        <View key={j.id} style={styles.historyItem}>
          <View>
            <Text style={styles.histName}>{j.jobName}</Text>
            <Text style={styles.histSub}>{j.totalSamples} samples • {new Date(j.createdAtUtc).toLocaleDateString()}</Text>
          </View>
          <Text style={[styles.histAcc, { color: j.status === 'Completed' ? '#10B981' : '#94A3B8' }]}>
            {j.status}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  jobCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  jobModel: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#06B6D4' },
  statusText: { color: '#06B6D4', fontSize: 11, fontWeight: '700' },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  progressBarBg: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  metricBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  metricLabel: { fontSize: 10, color: '#64748B' },
  metricVal: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 2, fontFamily: 'monospace' },
  noJobBox: { padding: 30, backgroundColor: '#111827', borderRadius: 14, marginBottom: 20 },
  launchBtn: { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 28 },
  launchBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8
  },
  histName: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  histSub: { color: '#64748B', fontSize: 11 },
  histAcc: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' }
});
