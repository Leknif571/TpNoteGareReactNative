import CustomInput from '@/components/custom-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

const API_URL = 'http://192.168.22.140:3000';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [securePassword, setSecurePassword] = useState(true);

  const themeName = useColorScheme();
  const borderInputColor = useThemeColor({}, 'borderInput');
  const textColor = useThemeColor({}, 'text');

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const bodyData = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || json.message || 'Une erreur est survenue.');
      }

      if (isLogin) {
        if (json.token) {
          await SecureStore.setItemAsync('userToken', json.token);
          router.replace('/(tabs)/profil');
        } else {
          throw new Error("Le serveur n'a pas renvoyé de jeton d'authentification.");
        }
      } else {
        setIsLogin(true);
        setErrorMessage('Compte créé avec succès ! Connectez-vous.');
        setPassword('');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.card}>
          
          <ThemedText type="title" style={styles.title}>
            {isLogin ? 'Bon retour !' : 'Créer un compte'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isLogin ? 'Connectez-vous pour accéder à vos itinéraires' : 'Rejoignez-nous pour sauvegarder vos trajets'}
          </ThemedText>

          {errorMessage ? (
            <View style={[styles.errorBox, errorMessage.includes('succès') && styles.successBox]}>
              <IconSymbol 
                name={errorMessage.includes('succès') ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"} 
                size={16} 
                color={errorMessage.includes('succès') ? "#2e7d32" : "#c62828"} 
              />
              <ThemedText style={[styles.errorText, errorMessage.includes('succès') && styles.successText]}>
                {errorMessage}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.form}>
            {!isLogin && (
              <CustomInput 
                value={name} 
                onChangeText={setName} 
                label="Nom complet" 
              />
            )}
            
            <CustomInput 
              value={email} 
              onChangeText={setEmail} 
              label="Adresse Email" 
             
            />
            
            <View style={styles.nativeInputContainer}>
              <ThemedText style={styles.nativeLabel}>Mot de passe</ThemedText>
              <View style={styles.passwordWrapper}>
                <TextInput 
                    style={[
                        styles.nativeTextInput,
                        { color: textColor },
                        themeName === 'light'
                        ? { backgroundColor: '#eeeeee' }
                        : { borderColor: borderInputColor, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="password"
                    placeholderTextColor={themeName === 'light' ? '#888888' : '#aaaaaa'}
                    secureTextEntry={securePassword}
                    autoCorrect={false}
                />
                
                <Pressable 
                  onPress={() => setSecurePassword(!securePassword)} 
                  style={styles.eyeIcon}
                  hitSlop={8}
                >
                  <IconSymbol 
                    name={securePassword ? "eye.fill" : "eye.slash.fill"} 
                    size={20} 
                    color="#888" 
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable 
            onPress={handleAuth} 
            disabled={loading}
            style={({ pressed }) => [
              styles.buttonPrimary, 
              pressed && { opacity: 0.8 },
              loading && styles.buttonDisabled
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonPrimaryText}>
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </ThemedText>
            )}
          </Pressable>

          <Pressable onPress={toggleAuthMode} style={styles.switchLink} hitSlop={10}>
            <ThemedText type="link" style={styles.linkText}>
              {isLogin ? "Pas de compte ? Inscrivez-vous" : "Déjà inscrit ? Connectez-vous"}
            </ThemedText>
          </Pressable>

        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24 
  },
  card: {
    paddingVertical: 10,
  },
  title: { 
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  form: {
    gap: 16,
    marginBottom: 24
  },
  
  nativeInputContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 6,
  },
  nativeLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  nativeTextInput: {
    borderRadius: 10,
    width: '100%',
    paddingLeft: 14,
    paddingRight: 48,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
  },

  buttonPrimary: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#a3d2e2',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  switchLink: {
    marginTop: 20,
    alignItems: 'center'
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    flex: 1,
    fontWeight: '500'
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  successText: {
    color: '#2e7d32',
  }
});