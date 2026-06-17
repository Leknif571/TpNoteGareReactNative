import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen 
        name="journey-result" 
        options={{ 
          presentation: 'modal', 
          headerShown: true,  
          title: 'Résultat Itinéraire',
          headerLeft: () => null 
        }} 
      />
      <Stack.Screen 
        name="specificline" 
        options={{ 
          presentation: 'modal', 
          headerShown: true,  
          title: 'Ligne détail',
        }} 
      />
      <Stack.Screen 
        name="specificstation" 
        options={{ 
          presentation: 'modal', 
          headerShown: true,  
          title: 'Détail station',
        }} 
      />
      <Stack.Screen 
        name="auth" 
        options={{ 
          presentation: 'modal', 
          headerShown: true,  
          title: 'Authentification',
        }} 
      />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
