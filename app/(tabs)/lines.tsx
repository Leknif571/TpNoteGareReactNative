import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = 'http://192.168.22.140:3000';

export default function RealTimeTrackingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('Tous'); // État pour stocker le filtre sélectionné

  const fetchLines = () => {
    setLoading(true);
    fetch(`${API_URL}/lines`)
      .then((response) => response.json())
      .then((json) => {
        setData(json.lines || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors du fetch :", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLines();
  }, []);

  // Filtrage logique des données avant affichage dans la FlatList
  const filteredData = data.filter((item) => {
    if (activeFilter === 'Tous') return true;
    // On compare en minuscule pour éviter les problèmes de casse (ex: "Bus" vs "bus")
    return item.type?.toLowerCase() === activeFilter.toLowerCase();
  });

  const renderVehicle = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => {
        // Redirection vers l'écran spécifique avec l'ID en paramètre
        router.push({ pathname: '/specificline', params: { id: item.id } });
      }}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.lineBadge, { backgroundColor: item.color || '#0a7ea4' }]}>
            <ThemedText style={styles.lineBadgeText}>{item.name || 'N/A'}</ThemedText>
          </View>
          
          <View style={styles.cardInfo}>
            <ThemedText type="defaultSemiBold" style={styles.routeText}>
              {item.from} ➔ {item.to}
            </ThemedText>
            <ThemedText style={[styles.typeText, { color: item.color || '#888' }]}>
              {item.type?.toUpperCase() || 'INCONNU'}
            </ThemedText>
          </View>
        </View>
        
        <IconSymbol name="chevron.right" size={20} color="rgba(128, 128, 128, 0.6)" />
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Suivi en temps réel</ThemedText>
        <TouchableOpacity onPress={fetchLines} disabled={loading} style={styles.refreshButton}>
          <IconSymbol 
            name="arrow.clockwise" 
            size={24} 
            color="#0a7ea4" 
            style={loading && { opacity: 0.5 }} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {['Tous', 'Bus', 'Tram'].map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter)} 
              activeOpacity={0.8}
              style={[
                styles.filterButton, 
                isActive && styles.filterButtonActive
              ]}
            >
              <ThemedText style={[
                styles.filterButtonText, 
                isActive && styles.filterButtonTextActive
              ]}>
                {filter}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              Aucun transport disponible pour cette catégorie.
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 0) + 12 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  refreshButton: {
    padding: 6,
  },
  
  filterBar: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 20 
  },
  filterButton: { 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: 'rgba(128,128,128,0.12)',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  filterButtonActive: { 
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4'
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666'
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 14, 
    marginBottom: 12, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  lineBadge: {
    width: 70,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  routeText: {
    fontSize: 15,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 14,
  }
});