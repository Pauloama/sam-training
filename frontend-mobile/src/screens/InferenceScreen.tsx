import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';

export default function InferenceScreen() {
  const [testImageUri, setTestImageUri] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handleSelectSample = (color: string, label: string) => {
    const sampleUri = `https://dummyimage.com/600x400/${color.replace('#', '')}/ffffff.png&text=${encodeURIComponent(label)}`;
    setTestImageUri(sampleUri);
    setPrediction(null);
  };

  const handlePredict = async () => {
    if (!testImageUri) return;
    setIsInferring(true);
    try {
      const res = await mobileApi.predictImage(testImageUri);
      setPrediction(res);
    } catch (err: any) {
      Alert.alert('Inference Error', err.message);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>SAM 3 Inference Studio</Text>
      <Text style={styles.subtitle}>Run on-device evaluation with the fine-tuned SAM model.</Text>

      {/* Target Preview */}
      <View style={styles.previewBox}>
        {testImageUri ? (
          <Image source={{ uri: testImageUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>⚡</Text>
            <Text style={styles.placeholderText}>Choose a Test Sample</Text>
          </View>
        )}
      </View>

      {/* Sample presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('8A05BE', 'NUBANK CARD')}>
          <Text style={styles.sampleChipText}>💳 Test Credit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('065F46', 'CNH DIGITAL')}>
          <Text style={styles.sampleChipText}>🪪 Test CNH</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('0284C7', 'R$ 100')}>
          <Text style={styles.sampleChipText}>💵 Test Banknote</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.predictBtn, (!testImageUri || isInferring) && { opacity: 0.5 }]}
        onPress={handlePredict}
        disabled={!testImageUri || isInferring}
      >
        {isInferring ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.predictBtnText}>⚡ Run SAM 3 Classification</Text>
        )}
      </TouchableOpacity>

      {/* Prediction Output */}
      {prediction && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>PREDICTED ASSET CLASS</Text>
          <Text style={styles.resultCategory}>{prediction.categoryName}</Text>
          
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metaLabel}>Confidence</Text>
              <Text style={styles.metaValue}>{(prediction.confidence * 100).toFixed(1)}%</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Latency</Text>
              <Text style={styles.metaValue}>{prediction.inferenceTimeMs} ms</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Model</Text>
              <Text style={styles.metaValue}>{prediction.modelVersion}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  previewBox: {
    height: 220,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16
  },
  previewImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  sampleChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10
  },
  sampleChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  predictBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  predictBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  resultCard: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  resultLabel: { fontSize: 10, color: '#94A3B8', letterSpacing: 0.5, fontWeight: '700' },
  resultCategory: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginVertical: 6 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  metaLabel: { fontSize: 11, color: '#64748B' },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#10B981', marginTop: 2, fontFamily: 'monospace' }
});
