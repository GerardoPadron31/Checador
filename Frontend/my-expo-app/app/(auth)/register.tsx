import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import FaceCapture from '../../components/FaceCapture';

const AREAS = ['RH', 'Administrativo', 'TI', 'Ventas', 'Logística', 'Finanzas', 'Marketing'];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [area, setArea] = useState('RH');
  const [image, setImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const register = useAuthStore((state) => state.register);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    if (!image) {
      Alert.alert('Error', 'Debes capturar o seleccionar una imagen de rostro');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
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
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-4">Registrar Usuario</Text>

      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text className="text-sm font-semibold mb-1">Rol</Text>
      <View className="flex-row mb-3">
        {(['user', 'admin'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            className={`flex-1 p-3 rounded-lg mr-2 ${role === r ? 'bg-blue-600' : 'bg-gray-200'}`}
            onPress={() => setRole(r)}
          >
            <Text className={`text-center ${role === r ? 'text-white' : 'text-gray-700'}`}>
              {r === 'user' ? 'Usuario' : 'Administrador'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-sm font-semibold mb-1">Área</Text>
      <View className="flex-row flex-wrap mb-3">
        {AREAS.map((a) => (
          <TouchableOpacity
            key={a}
            className={`p-2 rounded-lg mr-2 mb-2 ${area === a ? 'bg-green-600' : 'bg-gray-200'}`}
            onPress={() => setArea(a)}
          >
            <Text className={area === a ? 'text-white' : 'text-gray-700'}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity className="bg-blue-500 p-3 rounded-lg mb-2" onPress={openCamera}>
        <Text className="text-white text-center font-semibold">Capturar rostro con cámara</Text>
      </TouchableOpacity>
      <TouchableOpacity className="bg-gray-500 p-3 rounded-lg mb-2" onPress={pickImage}>
        <Text className="text-white text-center font-semibold">Elegir imagen de la galería</Text>
      </TouchableOpacity>

      {image && (
        <View className="items-center mb-3">
          <Image source={{ uri: image }} className="w-32 h-32 rounded-lg" />
          <Text className="text-green-600 mt-1">Imagen de rostro lista</Text>
        </View>
      )}

      <TouchableOpacity
        className="bg-green-600 p-3 rounded-lg mb-3"
        onPress={handleRegister}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Registrando...' : 'Registrar'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity className="bg-gray-400 p-3 rounded-lg mb-6" onPress={() => router.back()}>
        <Text className="text-center">Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
