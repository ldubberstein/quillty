import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Providers } from './providers';
import '../global.css';

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Providers>
  );
}
