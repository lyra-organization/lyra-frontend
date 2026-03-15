import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { stopLocationTracking } from '../../lib/location';

const SignOutButton = () => (
  <TouchableOpacity
    onPress={async () => {
      await stopLocationTracking();
      await supabase.auth.signOut();
    }}
    style={{ padding: 10 }}
  >
    <Text style={{ color: '#555555', fontSize: 14 }}>Sign Out</Text>
  </TouchableOpacity>
);

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerRight: () => <SignOutButton />,
        headerStyle: { backgroundColor: 'transparent' },
        contentStyle: { backgroundColor: '#0A0A0F' },
        animation: 'slide_from_right',
        headerBackVisible: false,
      }}
    />
  );
}
