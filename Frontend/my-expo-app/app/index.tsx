import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { colors, rs } from '../constants/theme';

export default function Index() {
  const booting = useAuthStore((state) => state.booting);
  const user = useAuthStore((state) => state.user);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,124,247,0.20)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -80, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,229,168,0.08)' }} />
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: rs(92), height: rs(92), borderRadius: rs(26), alignItems: 'center', justifyContent: 'center', marginBottom: rs(22), shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
        >
          <Ionicons name="finger-print" size={rs(50)} color="#FFFFFF" />
        </LinearGradient>
        <Text style={{ color: colors.text, fontSize: rs(32), fontWeight: '800', letterSpacing: -0.8 }}>Checador</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 28 }} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/attendance" />;
  }

  return <Redirect href="/(auth)/login" />;
}
