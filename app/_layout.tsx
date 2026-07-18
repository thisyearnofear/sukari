import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from "@expo-google-fonts/fraunces";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WebProviders from "@/components/WebProviders";
import { PlayerProgressProvider } from "@/context/PlayerProgressContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initAnalytics, track } from "@/utils/analytics";
import { initErrorMonitoring } from "@/utils/errorMonitoring";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    initErrorMonitoring();
    initAnalytics().then(() => track('app_open'));
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <WebProviders>
        <PlayerProgressProvider>
          <SafeAreaProvider>
            <ThemeProvider value={DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="charter" />
                <Stack.Screen name="care" />
                <Stack.Screen name="game-selection" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="(game)" />
                <Stack.Screen name="challenge" />
                <Stack.Screen name="slowmo" />
                <Stack.Screen name="auth" />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </SafeAreaProvider>
        </PlayerProgressProvider>
      </WebProviders>
    </ErrorBoundary>
  );
}
