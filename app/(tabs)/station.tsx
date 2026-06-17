import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://192.168.22.140:3000';

type Station = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  lines: number[];
  types: string[];
};

export default function StationsScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [stationsError, setStationsError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stops`)
      .then((response) => response.json())
      .then((json) => {
        setStations(json.stops || json || []);
        setLoadingStations(false);
      })
      .catch((err) => {
        console.error('Erreur lors du fetch des arrêts :', err);
        setStationsError('Impossible de charger les arrêts.');
        setLoadingStations(false);
      });
  }, []);

  const renderStation = ({ item }: { item: Station }) => (
    <TouchableOpacity 
      onPress={() => router.push({
        pathname: '/specificstation',
        params: { id: item.id, name : item.name}
      })} 
      activeOpacity={0.7}
    >
      <ThemedView style={styles.row}>
        <View style={styles.iconBadge}>
          <IconSymbol name="mappin.circle.fill" size={22} color="#0a7ea4" />
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={styles.stationName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.coordinatesText}>
            Lat: {item.lat.toFixed(4)} • Lng: {item.lng.toFixed(4)}
          </ThemedText>
        </View>

        <IconSymbol name="chevron.right" size={16} color="rgba(128,128,128,0.4)" />
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Stations disponibles
      </ThemedText>

      {loadingStations ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 40 }} />
      ) : stationsError ? (
        <ThemedText style={styles.emptyText}>{stationsError}</ThemedText>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderStation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>Aucune station trouvée.</ThemedText>}
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
  title: { marginBottom: 16 },
  listContent: { gap: 12, paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  stationName: { fontSize: 16 },
  coordinatesText: { fontSize: 12, color: '#888', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
});