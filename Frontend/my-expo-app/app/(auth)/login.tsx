import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FaceCapture from '../../components/FaceCapture';
import { Button } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const faceLogin = useAuthStore((state) => state.faceLogin);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa tu email y contraseña');
      return;
    }
    try {
      await login(email, password);
      router.replace('/(tabs)/attendance');
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas');
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

  const handleFaceLogin = async (uri: string) => {
    setCameraOpen(false);
    setLoading(true);
    try {
      const attendance = await faceLogin(uri);
      const check = attendance?.type === 'in' ? 'entrada' : 'salida';
      Alert.alert('Bienvenido', `Asistencia de ${check} registrada`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/attendance') },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Rostro no reconocido';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (cameraOpen) {
    return (
      <FaceCapture
        onCapture={handleFaceLogin}
        onCancel={() => setCameraOpen(false)}
        label="Mire a la cámara para iniciar sesión"
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,124,247,0.20)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -80, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,229,168,0.08)' }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 34 }}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: rs(92), height: rs(92), borderRadius: rs(26), alignItems: 'center', justifyContent: 'center', marginBottom: rs(20), shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
            >
              <Ionicons name="finger-print" size={rs(50)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={{ color: colors.text, fontSize: rs(34), fontWeight: '800', letterSpacing: -0.8 }}>Checador</Text>
            <Text style={{ color: '#a99dfb', textAlign: 'center', marginTop: 8, fontSize: 15 }}>
              Control de asistencia con reconocimiento facial
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.45,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 20, color: colors.text, letterSpacing: -0.3 }}>
              Iniciar sesión
            </Text>

            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Correo electrónico
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 13,
                color: colors.text,
                fontSize: 15,
                marginBottom: 14,
              }}
              placeholder="tucorreo@empresa.com"
              placeholderTextColor={colors.muted2}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Contraseña
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 13,
                color: colors.text,
                fontSize: 15,
                marginBottom: 22,
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.muted2}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button title="Iniciar sesión" onPress={handleLogin} icon="log-in-outline" />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.muted2, marginHorizontal: 12, fontSize: 12 }}>o</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 15,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(0,229,168,0.35)',
                backgroundColor: colors.accentLight,
              }}
              onPress={openCamera}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>
                {loading ? 'Reconociendo rostro...' : 'Iniciar sesión con rostro'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ marginTop: 24, alignItems: 'center' }} onPress={() => router.push('/register')} activeOpacity={0.7}>
            <Text style={{ textAlign: 'center', color: '#a99dfb', fontWeight: '600', fontSize: 14 }}>
              ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
