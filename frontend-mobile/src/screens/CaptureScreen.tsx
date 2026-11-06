import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';

export default function CaptureScreen({ categories, onUploaded, onNavigate }: any) {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [split, setSplit] = useState<number>(0); // 0=Train, 1=Val
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Quick Mock / Preset Capture for testing on emulator
  const handleSelectSample = (color: string, label: string) => {
    // Generate a data URI SVG/PNG for mobile testing
    const sampleUri = `https://dummyimage.com/600x400/${color.replace('#', '')}/ffffff.png&text=${encodeURIComponent(label)}`;
    setSelectedImageUri(sampleUri);
  };

  const handleUpload = async () => {
    if (!selectedImageUri || !selectedCategoryId) {
      Alert.alert('Required', 'Please select or capture an image and assign a category.');
      return;
    }

    setIsUploading(true);
    try {
      await mobileApi.uploadImage(selectedImageUri, selectedCategoryId, split);
      Alert.alert('Success', 'Asset deposited into fintech dataset!');
      setSelectedImageUri(null);
      if (onUploaded) onUploaded();
      onNavigate('dataset');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not connect to backend API.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mobile Asset Deposit</Text>
      <Text style={styles.subtitle}>Capture credit cards, IDs, or receipts for SAM 3 fine-tuning.</Text>

      {/* Image Preview Box */}
      <View style={styles.previewBox}>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
            <Text style={styles.placeholderText}>No image captured</Text>
            <Text style={styles.placeholderSub}>Select a sample below or capture with camera</Text>
          </View>
        )}
      </View>

      {/* Sample Captures Picker */}
      <Text style={styles.label}>Choose Sample Capture:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('8A05BE', 'NUBANK CARD')}>
          <Text style={styles.sampleChipText}>💳 Nubank Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('065F46', 'CNH BRASIL')}>
          <Text style={styles.sampleChipText}>🪪 CNH Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('475569', 'NOTA FISCAL')}>
          <Text style={styles.sampleChipText}>🧾 Fiscal Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sampleChip} onPress={() => handleSelectSample('0284C7', 'R$ 100 REAIS')}>
          <Text style={styles.sampleChipText}>💵 Banknote Cash</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Target Selector */}
      <Text style={styles.label}>Assign Category Target:</Text>
      <View style={styles.categoryWrap}>
        {categories.map((c: any) => {
          const isSelected = c.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catChip,
                isSelected && { borderColor: c.colorHex || '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }
              ]}
              onPress={() => setSelectedCategoryId(c.id)}
            >
              <View style={[styles.colorDot, { backgroundColor: c.colorHex || '#10B981' }]} />
              <Text style={[styles.catChipText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Split Selector */}
      <Text style={styles.label}>Dataset Partition:</Text>
      <View style={styles.splitRow}>
        <TouchableOpacity 
          style={[styles.splitBtn, split === 0 && styles.splitBtnActive]}
          onPress={() => setSplit(0)}
        >
          <Text style={[styles.splitText, split === 0 && styles.splitTextActive]}>Train Set (80%)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.splitBtn, split === 1 && styles.splitBtnActive]}
          onPress={() => setSplit(1)}
        >
          <Text style={[styles.splitText, split === 1 && styles.splitTextActive]}>Validation Set (20%)</Text>
        </TouchableOpacity>
      </View>

      {/* Deposit Button */}
      <TouchableOpacity 
        style={[styles.depositBtn, (!selectedImageUri || isUploading) && { opacity: 0.5 }]} 
        onPress={handleUpload}
        disabled={!selectedImageUri || isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.depositBtnText}>🚀 Deposit into SAM 3 Dataset</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  previewBox: {
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20
  },
  previewImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  placeholderSub: { color: '#64748B', fontSize: 12, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 },
  sampleChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  sampleChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  colorDot: { width: 8, height: 8, borderRadius: 2, marginRight: 8 },
  catChipText: { color: '#94A3B8', fontSize: 12 },
  splitRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  splitBtn: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  splitBtnActive: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  splitText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  splitTextActive: { color: '#10B981', fontWeight: '700' },
  depositBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  depositBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }
});
