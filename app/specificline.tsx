import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type LineData = {
  id: number;
  name: string;
  type: string;
  color: string;
  from: string;
  to: string;
  activeIncidents: number;
  operatingHours: {
    firstDeparture: string;
    lastDeparture: string;
  };
  stops: {
    id: number;
    name: string;
    order: number;
  }[];
};

export default function SpecificLine() {
  const { id } = useLocalSearchParams<{ id: string }>(); 

  const [data, setData] = useState<LineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLineData = () => {
    if (!id) return;
    
    setLoading(true);
    fetch(`http://192.168.22.140:3000/lines/${id}`)
      .then(response => response.json())
      .then(json => {
        setData(json || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors de la récupération :", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      fetchLineData();
    }
  }, [id]);

  return (
    <ThemedView style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={26} color="#0a7ea4" />
          </Pressable>
          <View style={styles.titleContainer}>
            <ThemedText type="title">Détails de la Ligne</ThemedText>
            <ThemedText style={styles.subHeader}>ID Recherche : {id || "Chargement..."}</ThemedText>
          </View>
        </View>

        <TouchableOpacity onPress={fetchLineData} disabled={loading || !id} style={styles.refreshButton}>
          <IconSymbol 
            name="arrow.clockwise" 
            size={24} 
            color="#0a7ea4" 
            style={loading && { opacity: 0.5 }} 
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 30 }} />
      ) : data ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <ThemedView style={styles.card}>
            
            <View style={styles.lineHeader}>
              <View style={[styles.badge, { backgroundColor: data.color }]}>
                <ThemedText style={styles.badgeText}>{data.name}</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.typeName}>
                {data.type.toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.routeContainer}>
              <ThemedText type="defaultSemiBold" style={styles.routeText}>
                {data.from} ➔ {data.to}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoBlock}>
                <IconSymbol name="clock" size={16} color="#888" />
                <ThemedText style={styles.infoLabel}>
                  {data.operatingHours.firstDeparture} - {data.operatingHours.lastDeparture}
                </ThemedText>
              </View>

              {data.activeIncidents > 0 && (
                <View style={[styles.infoBlock, styles.incidentBlock]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FF3B30" />
                  <ThemedText style={styles.incidentText}>
                    {data.activeIncidents} incident{data.activeIncidents > 1 ? 's' : ''}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.separator} />

            <ThemedText type="defaultSemiBold" style={styles.stopsTitle}>
              Liste des stations ({data.stops.length}) :
            </ThemedText>
            
            {data.stops
              .sort((a, b) => a.order - b.order)
              .map((stop, index) => (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.timelineContainer}>
                    <View style={[styles.timelineDot, { borderColor: data.color }]} />
                    {index !== data.stops.length - 1 && <View style={[styles.timelineLine, { backgroundColor: data.color }]} />}
                  </View>
                  <ThemedText style={styles.stopName}>
                    {stop.name}
                  </ThemedText>
                </View>
              ))
            }
          </ThemedView>

        </ScrollView>
      ) : (
        <ThemedText style={styles.emptyText}>Aucune donnée trouvée.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingTop: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  titleContainer: {
    flex: 1,
  },
  refreshButton: {
    padding: 6,
  },
  subHeader: { fontSize: 13, color: '#888', marginTop: 2 },
  
  card: { 
    padding: 20, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, minWidth: 45, alignItems: 'center' },
  badgeText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  typeName: { fontSize: 14, color: '#888', letterSpacing: 1 },
  
  routeContainer: { marginBottom: 15 },
  routeText: { fontSize: 17 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: '#888' },
  incidentBlock: { backgroundColor: 'rgba(255, 59, 48, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  incidentText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
  
  separator: { height: 1, backgroundColor: 'rgba(128,128,128,0.15)', marginVertical: 18 },
  
  stopsTitle: { fontSize: 14, color: '#888', marginBottom: 15 },
  stopRow: { flexDirection: 'row', alignItems: 'center', height: 35 },
  timelineContainer: { width: 24, alignItems: 'center', justifyContent: 'center', height: '100%' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: '#fff', zIndex: 2 },
  timelineLine: { width: 2, position: 'absolute', top: 18, bottom: -18, zIndex: 1 },
  stopName: { fontSize: 15, marginLeft: 10, flex: 1 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' }
});