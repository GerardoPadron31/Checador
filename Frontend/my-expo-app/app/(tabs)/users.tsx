import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import FaceCapture from '../../components/FaceCapture';

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <View className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-1">Usuarios</Text>
      <Text className="text-gray-500 mb-4">{users.length} registrados</Text>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg p-4 mb-4"
        onPress={() => openModal()}
      >
        <Text className="text-white text-center font-semibold">Agregar Usuario</Text>
      </TouchableOpacity>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-lg mb-2 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-bold text-lg">{item.name}</Text>
                <Text className="text-gray-600">{item.email}</Text>
                <View className="flex-row mt-1">
                  <Text className="text-gray-500 mr-3">Área: {item.area || 'N/A'}</Text>
                  <Text className="text-gray-500">Rol: {item.role}</Text>
                </View>
              </View>
              <View className="flex-row">
                <TouchableOpacity
                  className="bg-blue-100 p-2 rounded-lg mr-2"
                  onPress={() => openModal(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-100 p-2 rounded-lg"
                  onPress={() => deleteUser(item)}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <ScrollView className="flex-1 bg-white p-6">
          <Text className="text-2xl font-bold mb-4">
            {editingUser ? 'Editar Usuario' : 'Registrar Usuario'}
          </Text>

          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
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

          {!editingUser && (
            <>
              <TouchableOpacity className="bg-blue-500 p-3 rounded-lg mb-2" onPress={openCamera}>
                <Text className="text-white text-center font-semibold">Capturar rostro con cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-500 p-3 rounded-lg mb-2" onPress={pickImage}>
                <Text className="text-white text-center font-semibold">Elegir de galería</Text>
              </TouchableOpacity>
            </>
          )}

          {editingUser && (
            <>
              <TouchableOpacity className="bg-blue-500 p-3 rounded-lg mb-2" onPress={openCamera}>
                <Text className="text-white text-center font-semibold">Actualizar rostro con cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-500 p-3 rounded-lg mb-2" onPress={pickImage}>
                <Text className="text-white text-center font-semibold">Actualizar rostro desde galería</Text>
              </TouchableOpacity>
            </>
          )}

          {image && (
            <View className="items-center mb-3">
              <Image source={{ uri: image }} className="w-32 h-32 rounded-lg" />
              <Text className="text-green-600 mt-1">Nueva imagen de rostro</Text>
            </View>
          )}

          <TouchableOpacity className="bg-green-600 p-3 rounded-lg mb-3" onPress={saveUser}>
            <Text className="text-white text-center font-semibold">Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-400 p-3 rounded-lg mb-6"
            onPress={() => setModalVisible(false)}
          >
            <Text className="text-center">Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}
