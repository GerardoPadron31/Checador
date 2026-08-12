import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-6">Mi Perfil</Text>
      <View className="bg-gray-100 p-4 rounded-lg mb-4">
        <Text className="text-lg font-semibold">Nombre: {user?.name}</Text>
        <Text className="text-lg">Email: {user?.email}</Text>
        <Text className="text-lg">Área: {user?.area || 'Sin asignar'}</Text>
        <Text className="text-lg">Rol: {user?.role}</Text>
      </View>
      <TouchableOpacity className="bg-red-600 p-4 rounded-lg" onPress={handleLogout}>
        <Text className="text-white text-center font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}