import CustomInput from '@/components/custom-input';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

const API_URL = 'http://192.168.22.140:3000';

type Stop = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  lines: number[];
  types: string[];
};

type ActiveField = 'depart' | 'arrivee' | null;
type PickerStep = 'none' | 'date' | 'time';

export default function HomeScreen() {
  const [departQuery, setDepartQuery] = useState('');
  const [departStopId, setDepartStopId] = useState<number | null>(null);
  const [arriveeQuery, setArriveeQuery] = useState('');
  const [arriveeStopId, setArriveeStopId] = useState<number | null>(null);

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [departSuggestions, setDepartSuggestions] = useState<Stop[]>([]);
  const [arriveeSuggestions, setArriveeSuggestions] = useState<Stop[]>([]);

  const [isLocating, setIsLocating] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchType, setSearchType] = useState<'departure' | 'arrival'>('departure');
  const [dateTime, setDateTime] = useState(new Date());
  const [pickerStep, setPickerStep] = useState<PickerStep>('none');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function getQuickLocation() {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        setErrorMessage(
          "Autorisez la localisation pour sélectionner automatiquement l'arrêt le plus proche, ou saisissez un départ manuellement."
        );
        return;
      }

      try {
        const location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          setIsLocating(false);
          return;
        }

        const { latitude, longitude } = location.coords;
        const response = await fetch(
          `${API_URL}/stops/nearest?lat=${latitude}&lng=${longitude}&limit=1`,
          { headers: { Accept: 'application/json' } }
        );
        const json = await response.json();

        if (response.ok && json.stops?.length) {
          const nearest = json.stops[0];
          setDepartStopId(nearest.id);
          setDepartQuery(nearest.name);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Impossible de récupérer votre position, saisissez un départ manuellement.');
      } finally {
        setIsLocating(false);
      }
    }

    getQuickLocation();
  }, []);

  const searchStops = (query: string, field: 'depart' | 'arrivee') => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      field === 'depart' ? setDepartSuggestions([]) : setArriveeSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/stops?q=${encodeURIComponent(query)}`, {
          headers: { Accept: 'application/json' },
        });
        const json = await response.json();
        const results: Stop[] = json.stops ?? [];
        field === 'depart' ? setDepartSuggestions(results) : setArriveeSuggestions(results);
      } catch (error) {
        console.error(error);
      }
    }, 300);
  };

  const handleChangeDepart = (text: string) => {
    setDepartQuery(text);
    setDepartStopId(null);
    setActiveField('depart');
    searchStops(text, 'depart');
  };

  const handleChangeArrivee = (text: string) => {
    setArriveeQuery(text);
    setArriveeStopId(null);
    setActiveField('arrivee');
    searchStops(text, 'arrivee');
  };

  const handleSelectStop = (stop: Stop, field: 'depart' | 'arrivee') => {
    if (field === 'depart') {
      setDepartStopId(stop.id);
      setDepartQuery(stop.name);
      setDepartSuggestions([]);
    } else {
      setArriveeStopId(stop.id);
      setArriveeQuery(stop.name);
      setArriveeSuggestions([]);
    }
    setActiveField(null);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type !== 'set' || !selected) {
        setPickerStep('none');
        return;
      }
      setDateTime(current => {
        const updated = new Date(current);
        if (pickerStep === 'date') {
          updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        } else {
          updated.setHours(selected.getHours(), selected.getMinutes());
        }
        return updated;
      });
      setPickerStep(pickerStep === 'date' ? 'time' : 'none');
    } else if (selected) {
      setDateTime(selected);
    }
  };

  const handleSearch = () => {
    setErrorMessage('');
    if (!departStopId || !arriveeStopId) {
      setErrorMessage('Sélectionnez un départ et une arrivée dans la liste proposée');
      return;
    }

    router.push({
      pathname: '/journey-result',
      params: {
        fromStopId: String(departStopId),
        toStopId: String(arriveeStopId),
        fromName: departQuery,
        toName: arriveeQuery,
        datetime: dateTime.toISOString(),
        type: searchType,
      },
    });
  };

  const formattedDateTime = dateTime.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<IconSymbol size={250} color="#fff" name="map.fill" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Planifier un trajet
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.formContainer}>
        <CustomInput value={departQuery} onChangeText={handleChangeDepart} label={'Départ'} />
        {isLocating && <ActivityIndicator style={styles.locating} />}
        {activeField === 'depart' && departSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            {departSuggestions.map(stop => (
              <Pressable key={stop.id} style={styles.suggestionItem} onPress={() => handleSelectStop(stop, 'depart')}>
                <ThemedText>{stop.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        <CustomInput value={arriveeQuery} onChangeText={handleChangeArrivee} label={'Arrivée'} />
        {activeField === 'arrivee' && arriveeSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            {arriveeSuggestions.map(stop => (
              <Pressable key={stop.id} style={styles.suggestionItem} onPress={() => handleSelectStop(stop, 'arrivee')}>
                <ThemedText>{stop.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.typeToggle}>
          <Pressable
            style={[styles.typeChip, searchType === 'departure' && styles.typeChipActive]}
            onPress={() => setSearchType('departure')}>
            <ThemedText style={searchType === 'departure' ? styles.typeChipTextActive : undefined}>
              Partir à
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.typeChip, searchType === 'arrival' && styles.typeChipActive]}
            onPress={() => setSearchType('arrival')}>
            <ThemedText style={searchType === 'arrival' ? styles.typeChipTextActive : undefined}>
              Arriver à
            </ThemedText>
          </Pressable>
        </View>

        <Pressable style={styles.dateButton} onPress={() => setPickerStep('date')}>
          <ThemedText>{formattedDateTime}</ThemedText>
        </Pressable>

        {pickerStep !== 'none' && (
          <DateTimePicker
            value={dateTime}
            mode={Platform.OS === 'ios' ? 'datetime' : pickerStep === 'date' ? 'date' : 'time'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
          />
        )}

        {Platform.OS === 'ios' && pickerStep !== 'none' && (
          <Pressable style={styles.validateButton} onPress={() => setPickerStep('none')}>
            <ThemedText style={{ color: 'white' }}>Valider</ThemedText>
          </Pressable>
        )}

        {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Rechercher</ThemedText>
        </Pressable>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { bottom: -30, right: -20, position: 'absolute' },
  titleContainer: { marginBottom: 20 },
  formContainer: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#f5f5f5' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 4 },
  locating: { alignSelf: 'flex-start' },
  suggestions: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  typeToggle: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#e9e9e9' },
  typeChipActive: { backgroundColor: '#0a7ea4' },
  typeChipTextActive: { color: 'white', fontWeight: '600' },
  dateButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  validateButton: { backgroundColor: '#0a7ea4', padding: 10, borderRadius: 8, alignItems: 'center' },
  error: { color: '#dc3545' },
  searchButton: { backgroundColor: '#0a7ea4', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
});