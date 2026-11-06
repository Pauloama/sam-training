import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function DashboardScreen({ stats, categories, jobs, onNavigate }: any) {
  const totalAssets = stats?.totalImages || 0;
  const bestAcc = jobs?.reduce((max: number, j: any) => Math.max(max, j.bestAccuracy || 0), 0) || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mobile Top Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SAM 3 Fintech</Text>
          <Text style={styles.headerSubtitle}>Mobile Vision Laboratory</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ViT-B</Text>
        </View>
      </View>

      {/* Main Asset Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.cardLabel}>TOTAL ASSET INVENTORY</Text>
        <Text style={styles.cardValue}>{totalAssets.toLocaleString()}</Text>
        <Text style={styles.cardSub}>
          <Text style={{ color: '#10B981', fontWeight: '700' }}>+{stats?.trainCount || 0} Train</Text> • {stats?.validationCount || 0} Validation
        </Text>
      </View>

      {/* 2-column Metric Cards */}
      <View style={styles.row}>
        <View style={[styles.miniCard, { marginRight: 8 }]}>
          <Text style={styles.cardLabel}>ACTIVE CATEGORIES</Text>
          <Text style={styles.miniValue}>{categories.length}</Text>
          <Text style={styles.miniSub}>Credit, ID, Cash, Fiscal</Text>
        </View>

        <View style={[styles.miniCard, { marginLeft: 8 }]}>
          <Text style={styles.cardLabel}>PEAK ACCURACY</Text>
          <Text style={[styles.miniValue, { color: '#10B981' }]}>{(bestAcc * 100).toFixed(1)}%</Text>
          <Text style={styles.miniSub}>SAM mIoU: 88.4%</Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('capture')}>
          <Text style={styles.primaryBtnText}>📸 Capture & Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate('inference')}>
          <Text style={styles.secondaryBtnText}>⚡ Test SAM 3</Text>
        </TouchableOpacity>
      </View>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>Asset Class Distribution</Text>
      {categories.map((c: any) => {
        const count = c.imageCount || 0;
        const pct = totalAssets > 0 ? ((count / totalAssets) * 100).toFixed(0) : '0';
        return (
          <View key={c.id} style={styles.catItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.colorDot, { backgroundColor: c.colorHex || '#10B981' }]} />
              <Text style={styles.catName}>{c.name}</Text>
            </View>
            <Text style={styles.catCount}>{count} items ({pct}%)</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#94A3B8' },
  badge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#10B981' },
  badgeText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  cardValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginVertical: 6 },
  cardSub: { fontSize: 13, color: '#94A3B8' },
  row: { flexDirection: 'row', marginBottom: 20 },
  miniCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  miniValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginVertical: 4 },
  miniSub: { fontSize: 11, color: '#64748B' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  secondaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  catItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  colorDot: { width: 10, height: 10, borderRadius: 3, marginRight: 10 },
  catName: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  catCount: { color: '#94A3B8', fontSize: 12, fontFamily: 'monospace' }
});
