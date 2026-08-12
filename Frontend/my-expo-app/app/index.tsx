import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Index() {
  const booting = useAuthStore((state) => state.booting);
  const user = useAuthStore((state) => state.user);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/attendance" />;
  }

  return <Redirect href="/(auth)/login" />;
}
