import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header, Card, Button } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rows = [
    { icon: 'mail-outline' as const, label: 'Email', value: user?.email || '-' },
    { icon: 'business-outline' as const, label: 'Área', value: user?.area || 'Sin asignar' },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Rol',
      value: user?.role === 'admin' ? 'Administrador' : 'Usuario',
    },
  ];

  return (
    <View className="flex-1 bg-[#0a0f1e]">
      <Header title="Mi Perfil" subtitle="Información de tu cuenta" icon="person-outline" />
      <View className="flex-1 px-5 pt-6 pb-32">
        <View className="items-center mb-6">
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: rs(92), height: rs(92), borderRadius: rs(46), alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: rs(32), fontWeight: '800' }}>{initials}</Text>
          </LinearGradient>
          <Text className="text-2xl font-bold" style={{ color: colors.text, letterSpacing: -0.4 }}>
            {user?.name}
          </Text>
          <Text className="text-[#9aa7c7]">{user?.email}</Text>
        </View>

        <Card>
          {rows.map((row, i) => (
            <View
              key={row.label}
              className="flex-row items-center py-3"
              style={i < rows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
            >
              <View className="w-10 h-10 rounded-xl bg-[rgba(124,108,240,0.18)] items-center justify-center mr-3">
                <Ionicons name={row.icon} size={20} color="#a48af8" />
              </View>
              <View className="flex-1">
                <Text className="text-[#9aa7c7] text-sm">{row.label}</Text>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <View className="mt-4">
          <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" icon="log-out-outline" />
        </View>
      </View>
    </View>
  );
}
