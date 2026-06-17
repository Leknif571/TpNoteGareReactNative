import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

const API_URL = 'http://192.168.22.140:3000';

interface Section {
  type: 'walk' | 'ride';
  lineName?: string;
  lineColor?: string;
  vehicleType?: string;
  fromName: string;
  toName: string;
  durationMinutes: number;
}

interface Journey {
  type: 'direct' | 'connection';
  totalDurationMinutes: number;
  sections: Section[];
}

interface ApiResponse {
  from: { id: number; name: string };
  to: { id: number; name: string };
  requestedAt: string;
  journeys: Journey[];
}

export default function JourneyResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { fromStopId, toStopId, fromName, toName, datetime, type } = params;

  const [loading, setLoading] = useState(true);
  const [journeyData, setJourneyData] = useState<ApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchJourneys() {
      if (!fromStopId || !toStopId) {
        setErrorMessage('Paramètres de trajet manquants.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const url = `${API_URL}/journeys?fromStopId=${fromStopId}&toStopId=${toStopId}&datetime=${encodeURIComponent(
          String(datetime)
        )}&type=${type || 'departure'}`;

        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
        });
        const json = await response.json();

        if (response.ok) {
          setJourneyData(json);
        } else {
          setErrorMessage(json.error || 'Impossible de charger les itinéraires.');
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Erreur réseau. Impossible de joindre le serveur de calcul.');
      } finally {
        setLoading(false);
      }
    }

    fetchJourneys();
  }, [fromStopId, toStopId, datetime, type]); 

  const renderSection = (section: Section, index: number) => {
    const isWalk = section.type === 'walk';
    
    return (
      <View key={index} style={styles.sectionRow}>
        {/* Ligne graphique temporelle gauche */}
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineDot, { backgroundColor: isWalk ? '#ccc' : section.lineColor || '#0a7ea4' }]} />
          {index < index + 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Détails du segment de voyage */}
        <View style={styles.sectionDetails}>
          <ThemedText style={styles.sectionLocation}>
            De : <ThemedText type="defaultSemiBold">{section.fromName}</ThemedText>
          </ThemedText>
          
          <View style={styles.modeContainer}>
            <IconSymbol 
              name={isWalk ? 'figure.walk' : 'tram.fill'} 
              size={18} 
              color={isWalk ? '#666' : section.lineColor || '#0a7ea4'} 
            />
            <ThemedText style={styles.modeText}>
              {isWalk 
                ? `Marcher pendant ${section.durationMinutes} min` 
                : `Prendre la ligne ${section.lineName} (${section.vehicleType?.toUpperCase()}) — ${section.durationMinutes} min`
              }
            </ThemedText>
          </View>

          <ThemedText style={styles.sectionLocation}>
            À : <ThemedText type="defaultSemiBold">{section.toName}</ThemedText>
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderJourneyCard = ({ item }: { item: Journey }) => (
  <ThemedView style={styles.journeyCard}>
    <View style={styles.cardHeader}>
      <View style={[styles.badge, item.type === 'direct' ? styles.badgeDirect : styles.badgeConnection]}>
        <ThemedText style={styles.badgeText}>
          {item.type === 'direct' ? 'Direct' : '1 correspondance'}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.durationText}>
        {item.totalDurationMinutes} min
      </ThemedText>
    </View>

    <View style={styles.sectionsList}>
      {(item.sections || []).map((section, idx) => renderSection(section, idx))}
    </View>
  </ThemedView>
);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<IconSymbol size={250} color="#fff" name="arrow.triangle.turn.up.right.diamond.fill" style={styles.headerImage} />}
    >
      <View style={styles.titleRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#0a7ea4" />
        </Pressable>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Résultats
          </ThemedText>
        </ThemedView>
      </View>

      <ThemedView style={styles.summaryContainer}>
        <View style={styles.summaryLine}>
          <IconSymbol name="mappin.circle.fill" size={20} color="#28a745" />
          <ThemedText style={styles.summaryText}>{fromName || journeyData?.from.name}</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryLine}>
          <IconSymbol name="mappin.circle.fill" size={20} color="#dc3545" />
          <ThemedText style={styles.summaryText}>{toName || journeyData?.to.name}</ThemedText>
        </View>
      </ThemedView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Calcul du meilleur itinéraire...</ThemedText>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#dc3545" />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={journeyData?.journeys}
          renderItem={renderJourneyCard}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false} 
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>Aucun itinéraire disponible pour cet horaire.</ThemedText>
          }
        />
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { bottom: -30, right: -20, position: 'absolute' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  backButton: { padding: 5 },
  titleContainer: { flex: 1 },
  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontSize: 16 },
  summaryDivider: { height: 1, backgroundColor: '#e0e0e0', marginLeft: 30 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#666' },
  errorText: { color: '#dc3545', textAlign: 'center', paddingHorizontal: 20 },
  listContainer: { gap: 16 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
  
  journeyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeDirect: { backgroundColor: '#e2f0d9' },
  badgeConnection: { backgroundColor: '#fff2cc' },
  badgeText: { fontWeight: '600', fontSize: 13, color: '#333' },
  durationText: { color: '#0a7ea4', fontWeight: 'bold' },
  sectionsList: { gap: 0 },

  sectionRow: { flexDirection: 'row', minHeight: 80 },
  timelineContainer: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 1, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginTop: -4, marginBottom: -4 },
  sectionDetails: { flex: 1, paddingBottom: 16, gap: 4 },
  sectionLocation: { fontSize: 14, color: '#555' },
  modeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8 },
  modeText: { fontSize: 14, flex: 1 },
});