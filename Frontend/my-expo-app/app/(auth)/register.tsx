import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import FaceCapture from '../../components/FaceCapture';
import { Header, Button, Chip, Field, SectionLabel } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

const AREAS = ['RH', 'Administrativo', 'TI', 'Ventas', 'Logística', 'Finanzas', 'Marketing'];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [area, setArea] = useState('RH');
  const [image, setImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const register = useAuthStore((state) => state.register);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
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

  const handleCapture = (uri: string) => {
    setCameraOpen(false);
    setImage(uri);
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Nombre, email y contraseña son obligatorios');
      return;
    }
    if (!image) {
      Alert.alert('Error', 'Debes capturar o seleccionar una imagen de rostro');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('area', area);
    formData.append('face_image', {
      uri: image,
      type: 'image/jpeg',
      name: 'face.jpg',
    } as any);

    try {
      await register(formData);
      Alert.alert('Éxito', 'Usuario registrado');
      router.replace('/(auth)/login');
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (cameraOpen) {
    return (
      <FaceCapture
        onCapture={handleCapture}
        onCancel={() => setCameraOpen(false)}
        label="Coloque su rostro frente a la cámara"
      />
    );
  }

  return (
    <View className="flex-1 bg-[#0a0f1e]">
      <Header title="Registrar Usuario" subtitle="Nuevo usuario con rostro" icon="person-add-outline" />
      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Field label="Nombre completo" placeholder="Ej. Juan Pérez" value={name} onChangeText={setName} />
        <Field
          label="Email"
          placeholder="correo@checador.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <SectionLabel>Área</SectionLabel>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {AREAS.map((a) => (
            <Chip key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
          ))}
        </View>

        <SectionLabel>Foto de rostro</SectionLabel>
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-[#0d1428] border rounded-xl p-4"
            style={{ borderColor: colors.borderStrong }}
            onPress={openCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color="#a48af8" style={{ marginRight: 6 }} />
            <Text className="font-semibold" style={{ color: colors.text }}>
              Cámara
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-[#0d1428] border rounded-xl p-4"
            style={{ borderColor: colors.borderStrong }}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Ionicons name="images" size={20} color="#a48af8" style={{ marginRight: 6 }} />
            <Text className="font-semibold" style={{ color: colors.text }}>
              Galería
            </Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View className="items-center mb-5">
            <Image source={{ uri: image }} style={{ width: rs(128), height: rs(128), borderRadius: rs(16) }} />
            <View className="flex-row items-center mt-2">
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text className="ml-1" style={{ color: colors.accent }}>
                Imagen de rostro lista
              </Text>
            </View>
          </View>
        )}

        <Button title="Registrar usuario" onPress={handleRegister} loading={loading} icon="person-add-outline" />
        <Button title="Cancelar" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </View>
  );
}
