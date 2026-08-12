import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ScrollView, FlatList } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import FaceCapture from '../../components/FaceCapture';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';

interface AttendanceRecord {
  id: number;
  user_id: number;
  timestamp: string;
  type: 'in' | 'out';
  user?: { name: string };
}

export default function AttendanceScreen() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchToday();
    }
  }, [isAdmin]);

  const fetchToday = async () => {
    try {
      const response = await api.get('/attendance/today');
      setTodayRecords(response.data);
    } catch (error) {
      // ignore
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
        return;
      }
    }
    setCameraOpen(true);
  };

  const handleCapture = async (uri: string) => {
    setCameraOpen(false);
    setPhoto(uri);
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'face.jpg',
    } as any);
    try {
      const response = await api.post('/attendance/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      if (data.success) {
        const date = new Date(data.timestamp);
        Alert.alert(
          'Asistencia registrada',
          `${data.name} - ${data.type === 'in' ? 'Entrada' : 'Salida'} a las ${date.toLocaleTimeString()}`,
        );
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo registrar la asistencia';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setPhoto(null);
    }
  };

  if (cameraOpen) {
    return (
      <FaceCapture
        onCapture={handleCapture}
        onCancel={() => setCameraOpen(false)}
        label="Acerque su rostro y presione capturar"
      />
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-1">Asistencia Biométrica</Text>
      {user && (
        <Text className="text-gray-500 mb-4">
          Sesión iniciada como: {user.name}
        </Text>
      )}

      <TouchableOpacity
        className="bg-green-600 rounded-lg p-5 mb-4 items-center"
        onPress={openCamera}
        disabled={loading}
      >
        <Text className="text-white text-lg font-semibold">
          {loading ? 'Procesando...' : 'Tomar asistencia'}
        </Text>
      </TouchableOpacity>

      {photo && (
        <Image source={{ uri: photo }} className="w-40 h-40 rounded-lg self-center mt-2" />
      )}

      <View className="bg-white p-4 rounded-lg mt-2">
        <Text className="font-semibold mb-1">¿Cómo funciona?</Text>
        <Text className="text-gray-600">
          1. Presiona "Tomar asistencia".{"\n"}
          2. Asegúrate de tener buena iluminación y el rostro de frente.{"\n"}
          3. El sistema reconocerá tu rostro y registrará tu entrada o salida automáticamente.
        </Text>
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg p-4 mt-4"
        onPress={() => router.push('/(tabs)/history')}
      >
        <Text className="text-white text-center font-semibold">Ver mi historial</Text>
      </TouchableOpacity>

      {isAdmin && (
        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold">Asistencias de hoy</Text>
            <TouchableOpacity className="bg-gray-200 p-2 rounded-lg" onPress={fetchToday}>
              <Ionicons name="refresh" size={16} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={todayRecords}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 my-6">Sin asistencias registradas hoy</Text>
            }
            renderItem={({ item }) => (
              <View className="bg-white p-3 rounded-lg mb-2 shadow-sm flex-row items-center">
                <Ionicons
                  name={item.type === 'in' ? 'log-in-outline' : 'log-out-outline'}
                  size={20}
                  color={item.type === 'in' ? '#16a34a' : '#dc2626'}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold">{item.user?.name || `Usuario ${item.user_id}`}</Text>
                  <Text className="text-gray-500 text-sm">{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
                <Text className={`font-semibold ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.type === 'in' ? 'Entrada' : 'Salida'}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}
