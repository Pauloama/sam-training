import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

export default function DatasetScreen({ images, onRefresh }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asset Repository</Text>
        <Text style={styles.countText}>{images.length} items</Text>
      </View>

      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image 
              source={{ uri: item.url }} 
              style={styles.image} 
              defaultSource={{ uri: 'https://dummyimage.com/120x90/1e293b/ffffff.png&text=Asset' }}
            />
            <View style={styles.info}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: `${item.categoryColor || '#10B981'}22`, borderColor: item.categoryColor || '#10B981' }]}>
                  <Text style={[styles.badgeText, { color: item.categoryColor || '#10B981' }]}>
                    {item.categoryName}
                  </Text>
                </View>
                <Text style={styles.splitText}>{item.split}</Text>
              </View>

              <Text style={styles.fileName} numberOfLines={1}>{item.originalFileName}</Text>
              <Text style={styles.metaText}>{(item.fileSizeBytes / 1024).toFixed(1)} KB • {new Date(item.createdAtUtc).toLocaleDateString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📂</Text>
            <Text style={styles.emptyTitle}>Dataset is Empty</Text>
            <Text style={styles.emptySub}>Capture some images in the Deposit tab to train SAM 3.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  countText: { fontSize: 13, color: '#94A3B8', fontFamily: 'monospace' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  image: { width: 80, height: 70, borderRadius: 8, backgroundColor: '#1E293B' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  splitText: { color: '#64748B', fontSize: 11, fontFamily: 'monospace' },
  fileName: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  metaText: { color: '#94A3B8', fontSize: 11 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4, textAlign: 'center' }
});
