import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import FaceCapture from '../../components/FaceCapture';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Header, Card, Button, Badge, EmptyState } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Asistencia Biométrica"
        subtitle={user ? `Hola, ${user.name}` : undefined}
        icon="scan-outline"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 }}
      >
        <TouchableOpacity
          style={{ borderRadius: 24, marginBottom: 16, shadowColor: '#00e5a8', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
          onPress={openCamera}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#00b98b', '#00e5a8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, paddingVertical: rs(28), paddingHorizontal: 20, alignItems: 'center' }}
          >
            <View style={{ width: rs(84), height: rs(84), borderRadius: rs(42), backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: rs(14) }}>
              <Ionicons name="camera" size={rs(42)} color="#FFFFFF" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: rs(20), fontWeight: '800', letterSpacing: -0.3 }}>
              Tomar asistencia
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: rs(14), marginTop: 6 }}>
              Presiona y escanea tu rostro
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {photo && (
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Image source={{ uri: photo }} style={{ width: 120, height: 120, borderRadius: 24 }} />
          </View>
        )}

        <Card>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>¿Cómo funciona?</Text>
          {[
            'Presiona "Tomar asistencia" y coloca tu rostro frente a la cámara.',
            'Asegúrate de tener buena iluminación.',
            'El sistema te reconoce y registra tu entrada o salida automáticamente.',
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: i === 2 ? 0 : 12 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, flex: 1 }}>{step}</Text>
            </View>
          ))}
        </Card>

        <Button title="Ver mi historial" onPress={() => router.push('/(tabs)/history')} icon="time-outline" />

        {isAdmin && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                Asistencias de hoy
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                onPress={fetchToday}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={todayRecords}
              scrollEnabled={false}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<EmptyState message="Sin asistencias registradas hoy" />}
              renderItem={({ item }) => (
                <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                  <View
                    style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: item.type === 'in' ? colors.accentLight : colors.dangerLight }}
                  >
                    <Ionicons
                      name={item.type === 'in' ? 'log-in-outline' : 'log-out-outline'}
                      size={20}
                      color={item.type === 'in' ? colors.accent : colors.danger}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                      {item.user?.name || `Usuario ${item.user_id}`}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Badge label={item.type === 'in' ? 'Entrada' : 'Salida'} tone={item.type === 'in' ? 'in' : 'out'} />
                </Card>
              )}
            />
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,15,30,0.88)' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 16, fontSize: 16 }}>Verificando rostro...</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Comparando con la base de datos</Text>
        </View>
      )}
    </View>
  );
}
