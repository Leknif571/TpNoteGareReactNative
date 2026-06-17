import CustomInput from '@/components/custom-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet } from 'react-native';

const API_URL = 'http://192.168.22.140:3000';

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const redirectToLogin = useCallback(async () => {
    await SecureStore.deleteItemAsync('userToken');
    router.replace('/auth');
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setResultMessage('');

    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      setIsLoading(false);
      redirectToLogin();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await redirectToLogin();
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setResultMessage(json.error ?? 'Impossible de récupérer le profil');
        return;
      }

      setUser(json);
      setName(json.name);
      setEmail(json.email);
    } catch {
      setResultMessage('Erreur réseau, veuillez réessayer');
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setResultMessage('');
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      redirectToLogin();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (response.status === 401) {
        await redirectToLogin();
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setResultMessage(json.error ?? 'La mise à jour a échoué');
        return;
      }

      setUser((current) => (current ? { ...current, name: json.name, email: json.email } : current));
      setResultMessage('Profil mis à jour');
    } catch {
      setResultMessage('Erreur réseau, veuillez réessayer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await redirectToLogin();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Mon Profil</ThemedText>

      <ThemedText style={styles.meta}>
        Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
      </ThemedText>

      <CustomInput value={name} onChangeText={setName} label={'Nom'} />
      <CustomInput value={email} onChangeText={setEmail} label={'Email'} />

      {resultMessage ? <ThemedText style={styles.message}>{resultMessage}</ThemedText> : null}

      <Pressable
        style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <ThemedText style={styles.buttonText}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </ThemedText>
      </Pressable>

      <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <ThemedText style={styles.buttonText}>Déconnexion</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 0) + 12 
    },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  meta: { opacity: 0.6, marginBottom: 8 },
  message: { color: '#dc3545' },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButton: { backgroundColor: '#4CAF50' },
  logoutButton: { backgroundColor: '#dc3545', marginTop: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '600' },
});