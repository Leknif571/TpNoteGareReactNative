import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

const API_BASE_URL = 'http://192.168.22.140:3000';
const TICK_INTERVAL_MS = 15000;
const REFRESH_INTERVAL_MS = 30000;

type LineInfo = { id: number; name: string; type: string; color: string };
type Incident = { id: number | string; message: string };

type StationDetail = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  lines: LineInfo[];
  facilities?: string[];
  incidents?: Incident[];
};

type Departure = {
  id: number;
  lineId: number;
  lineName: string;
  lineColor: string;
  type: string;
  destination: string;
  scheduledAt: string;
  expectedAt: string;
  delayMinutes: number;
  status: 'on_time' | 'delayed';
  incidentMessage?: string;
};

function formatCountdown(expectedAtIso: string, now: Date): string {
  const diffMin = Math.round((new Date(expectedAtIso).getTime() - now.getTime()) / 60000);
  if (diffMin <= 0) return 'Imminent';
  if (diffMin === 1) return '1 min';
  return `${diffMin} min`;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function StationDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [detail, setDetail] = useState<StationDetail | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStationDetail = useCallback((stationId: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    setDetailError(null);

    Promise.all([
      fetch(`${API_BASE_URL}/stops/${stationId}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/stops/${stationId}/departures?limit=20`).then((r) => r.json()),
    ])
      .then(([detailJson, departuresJson]) => {
        setDetail(detailJson);
        setDepartures(departuresJson.departures || []);
        setNow(new Date());
      })
      .catch((err) => {
        console.error('Erreur lors du fetch de la fiche arrêt :', err);
        setDetailError('Impossible de charger les horaires de cet arrêt.');
      })
      .finally(() => {
        setLoadingDetail(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchStationDetail(id);

    tickRef.current = setInterval(() => setNow(new Date()), TICK_INTERVAL_MS);
    pollRef.current = setInterval(() => fetchStationDetail(id, true), REFRESH_INTERVAL_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, fetchStationDetail]);

  const onRefresh = () => {
    if (!id) return;
    setRefreshing(true);
    fetchStationDetail(id, true);
  };

  const renderDeparture = ({ item }: { item: Departure }) => {
    const isDelayed = item.status === 'delayed' && item.delayMinutes > 0;

    return (
      <ThemedView style={styles.departureRow}>
        <View style={[styles.lineBadge, { backgroundColor: item.lineColor || '#666' }]}>
          <ThemedText style={styles.lineBadgeText} numberOfLines={1}>
            {item.lineName}
          </ThemedText>
        </View>

        <View style={styles.departureInfo}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.destination}
          </ThemedText>

          <View style={styles.departureMetaRow}>
            <ThemedText style={styles.scheduledText}>Prévu à {formatClock(item.scheduledAt)}</ThemedText>
            {isDelayed && <ThemedText style={styles.delayText}>· Retard +{item.delayMinutes} min</ThemedText>}
          </View>

          {item.incidentMessage ? (
            <View style={styles.incidentInlineRow}>
              <ThemedText style={styles.incidentInlineIcon}>⚠</ThemedText>
              <ThemedText style={styles.incidentInlineText}>{item.incidentMessage}</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.countdownContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.countdownText, isDelayed && styles.countdownDelayed]}>
            {formatCountdown(item.expectedAt, now)}
          </ThemedText>
          <ThemedText style={[styles.statusBadgeText, isDelayed ? styles.statusDelayed : styles.statusOnTime]}>
            {isDelayed ? 'Retardé' : 'À l\'heure'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  };

  const incidents = detail?.incidents ?? [];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.detailHeader}>

        <View style={styles.detailHeaderText}>
          <ThemedText type="title" style={styles.title}>
            {detail?.name || name || "Chargement..."}
          </ThemedText>
          {detail?.address ? <ThemedText style={styles.addressText}>{detail.address}</ThemedText> : null}
        </View>
      </View>

      {incidents.length > 0 && (
        <View style={styles.incidentsBanner}>
          {incidents.map((incident) => (
            <View key={incident.id} style={styles.incidentBannerRow}>
              <ThemedText style={styles.incidentBannerIcon}>⚠</ThemedText>
              <ThemedText style={styles.incidentBannerText}>{incident.message}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {loadingDetail && !refreshing ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 40 }} />
      ) : detailError ? (
        <ThemedText style={styles.emptyText}>{detailError}</ThemedText>
      ) : (
        <FlatList
          data={departures}
          renderItem={renderDeparture}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>Aucun passage prévu pour le moment.</ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { marginBottom: 4 },
  listContent: { gap: 12, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2 },
  backArrow: { fontSize: 20, color: '#0a7ea4' },
  detailHeaderText: { flex: 1 },
  addressText: { fontSize: 13, color: '#888', marginTop: 2 },
  incidentsBanner: {
    backgroundColor: 'rgba(214, 69, 51, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(214, 69, 51, 0.25)',
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  incidentBannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  incidentBannerIcon: { fontSize: 14, color: '#d64533' },
  incidentBannerText: { flex: 1, fontSize: 13, color: '#d64533' },
  departureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 12,
  },
  lineBadge: { minWidth: 44, height: 28, paddingHorizontal: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  lineBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  departureInfo: { flex: 1, gap: 2 },
  departureMetaRow: { flexDirection: 'row', flexWrap: 'wrap' },
  scheduledText: { fontSize: 12, color: '#888' },
  delayText: { fontSize: 12, color: '#d64533', marginLeft: 4, fontWeight: '600' },
  incidentInlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2 },
  incidentInlineIcon: { fontSize: 11, color: '#d64533' },
  incidentInlineText: { fontSize: 11, color: '#d64533', flex: 1 },
  countdownContainer: { alignItems: 'flex-end', minWidth: 64 },
  countdownText: { fontSize: 15, color: '#0a7ea4' },
  countdownDelayed: { color: '#d64533' },
  statusBadgeText: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  statusOnTime: { color: '#3a9d5d' },
  statusDelayed: { color: '#d64533' },
});