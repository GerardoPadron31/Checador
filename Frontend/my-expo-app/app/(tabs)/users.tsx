import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import FaceCapture from '../../components/FaceCapture';
import { Header, Card, Button, Chip, Field, EmptyState, SectionLabel } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

const AREAS = ['RH', 'Administrativo', 'TI', 'Ventas', 'Logística', 'Finanzas', 'Marketing'];

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  area: string | null;
  face_image_path: string | null;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [area, setArea] = useState('RH');
  const [image, setImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const openModal = (user?: User) => {
    setEditingUser(user || null);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPassword('');
    setRole(user?.role || 'user');
    setArea(user?.area || 'RH');
    setImage(null);
    setModalVisible(true);
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

  const handleCapture = (uri: string) => {
    setCameraOpen(false);
    setImage(uri);
  };

  const saveUser = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }
    try {
      if (editingUser) {
        const payload: any = { name, email, role, area };
        if (password) payload.password = password;
        await api.put(`/users/${editingUser.id}`, payload);
        if (image) {
          const formData = new FormData();
          formData.append('face_image', { uri: image, type: 'image/jpeg', name: 'face.jpg' } as any);
          await api.post(`/users/${editingUser.id}/face`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        Alert.alert('Éxito', 'Usuario actualizado');
      } else {
        if (!image) {
          Alert.alert('Error', 'Debes capturar o seleccionar una imagen de rostro');
          return;
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        formData.append('area', area);
        formData.append('face_image', { uri: image, type: 'image/jpeg', name: 'face.jpg' } as any);
        await api.post('/users/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Éxito', 'Usuario registrado');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo guardar el usuario';
      Alert.alert('Error', msg);
    }
  };

  const deleteUser = (user: User) => {
    Alert.alert('Eliminar usuario', `¿Eliminar a ${user.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${user.id}`);
            fetchUsers();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el usuario');
          }
        },
      },
    ]);
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
      <Header title="Usuarios" subtitle={`${users.length} registrados`} icon="people-outline" />
      <View className="flex-1 px-5 pt-5">
        <Button title="Agregar Usuario" onPress={() => openModal()} icon="person-add-outline" />

        <FlatList
          data={users}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 130 }}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<EmptyState message="Sin usuarios" />}
          renderItem={({ item }) => {
            const initials = (item.name || '?')
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View className="items-center justify-center mr-3" style={{ width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold" style={{ fontSize: rs(15) }}>{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {item.name}
                  </Text>
                  <Text className="text-[#9aa7c7] text-sm">{item.email}</Text>
                  <View className="flex-row mt-1">
                    <Text className="text-[#9aa7c7] text-xs mr-3">Área: {item.area || 'N/A'}</Text>
                    <Text className="text-[#9aa7c7] text-xs capitalize">Rol: {item.role}</Text>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    className="items-center justify-center mr-2"
                    style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(124,108,240,0.18)' }}
                    onPress={() => openModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={rs(18)} color="#a48af8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="items-center justify-center"
                    style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(239,68,68,0.18)' }}
                    onPress={() => deleteUser(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={rs(18)} color="#fca5a5" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      </View>

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-[#0a0f1e]">
          <Header
            title={editingUser ? 'Editar Usuario' : 'Registrar Usuario'}
            subtitle={editingUser ? 'Actualiza los datos' : 'Nuevo usuario con rostro'}
            icon="person-outline"
          />
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
            <Field
              label="Contraseña"
              placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <SectionLabel>Rol</SectionLabel>
            <View className="flex-row gap-2 mb-6">
              {(['user', 'admin'] as const).map((r) => (
                <Chip key={r} label={r === 'user' ? 'Usuario' : 'Administrador'} selected={role === r} onPress={() => setRole(r)} />
              ))}
            </View>

            <SectionLabel>Área</SectionLabel>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {AREAS.map((a) => (
                <Chip key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
              ))}
            </View>

            <SectionLabel>{editingUser ? 'Actualizar rostro' : 'Foto de rostro'}</SectionLabel>
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
                <Text className="mt-2" style={{ color: '#00e5a8' }}>
                  Nueva imagen de rostro
                </Text>
              </View>
            )}

            <Button
              title={editingUser ? 'Guardar cambios' : 'Registrar usuario'}
              onPress={saveUser}
              variant="accent"
              icon="checkmark-circle-outline"
            />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="ghost" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
