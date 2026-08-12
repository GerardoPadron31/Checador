import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface Vacation {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

interface UserOption {
  id: number;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
};

export default function VacationsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
      fetchUsers();
    } else if (user) {
      fetchMine();
    }
  }, [user, isAdmin]);

  const fetchMine = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/vacations/user/${user.id}`);
      setVacations(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener los permisos');
    }
  };

  const fetchAll = async () => {
    try {
      const response = await api.get('/vacations/');
      setVacations(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener los permisos');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.map((u: any) => ({ id: u.id, name: u.name })));
    } catch (error) {
      // ignore
    }
  };

  const openModal = (vac?: Vacation) => {
    setEditing(vac || null);
    setStartDate(vac?.start_date || '');
    setEndDate(vac?.end_date || '');
    setReason(vac?.reason || '');
    setModalVisible(true);
  };

  const saveVacation = async () => {
    if (!user) return;
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Ingresa las fechas');
      return;
    }
    try {
      if (editing) {
        await api.put(`/vacations/${editing.id}`, {
          start_date: startDate,
          end_date: endDate,
          reason,
        });
        Alert.alert('Éxito', 'Permiso actualizado');
      } else {
        await api.post('/vacations/', {
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          reason,
        });
        Alert.alert('Éxito', 'Permiso solicitado');
      }
      setModalVisible(false);
      if (isAdmin) {
        fetchAll();
      } else {
        fetchMine();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo guardar el permiso';
      Alert.alert('Error', msg);
    }
  };

  const setStatus = (vac: Vacation, status: string) => {
    Alert.alert('Actualizar estado', `¿Marcar como ${status === 'approved' ? 'Aprobado' : 'Rechazado'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await api.put(`/vacations/${vac.id}`, { status });
            fetchAll();
          } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado');
          }
        },
      },
    ]);
  };

  const deleteVacation = (vac: Vacation) => {
    Alert.alert('Eliminar permiso', '¿Eliminar este permiso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vacations/${vac.id}`);
            if (isAdmin) {
              fetchAll();
            } else {
              fetchMine();
            }
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const displayed = filterUserId && isAdmin
    ? vacations.filter((v) => v.user_id === filterUserId)
    : vacations;

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-1">
        {isAdmin ? 'Permisos y Vacaciones' : 'Mis Vacaciones'}
      </Text>
      <Text className="text-gray-500 mb-4">{displayed.length} solicitudes</Text>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg p-4 mb-4"
        onPress={() => openModal()}
      >
        <Text className="text-white text-center font-semibold">Solicitar Permiso</Text>
      </TouchableOpacity>

      {isAdmin && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <TouchableOpacity
            className={`p-3 rounded-lg mr-2 ${filterUserId === null ? 'bg-green-600' : 'bg-gray-200'}`}
            onPress={() => setFilterUserId(null)}
          >
            <Text className={filterUserId === null ? 'text-white font-semibold' : 'text-gray-700'}>Todos</Text>
          </TouchableOpacity>
          {users.map((u) => (
            <TouchableOpacity
              key={u.id}
              className={`p-3 rounded-lg mr-2 ${filterUserId === u.id ? 'bg-green-600' : 'bg-gray-200'}`}
              onPress={() => setFilterUserId(u.id)}
            >
              <Text className={filterUserId === u.id ? 'text-white font-semibold' : 'text-gray-700'}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 my-8">Sin solicitudes</Text>
        }
        renderItem={({ item }) => {
          const userName = users.find((u) => u.id === item.user_id)?.name;
          return (
            <View className="bg-white p-4 rounded-lg mb-2 shadow-sm">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  {isAdmin && (
                    <Text className="font-bold text-lg">{userName || `Usuario ${item.user_id}`}</Text>
                  )}
                  <Text className={isAdmin ? 'text-gray-600' : 'font-bold text-lg'}>
                    {item.start_date} → {item.end_date}
                  </Text>
                  <Text className="text-gray-500 mt-1">Motivo: {item.reason || 'N/A'}</Text>
                  <Text className={`mt-1 font-semibold capitalize ${STATUS_COLORS[item.status] || 'text-gray-600'}`}>
                    {item.status === 'approved' ? 'Aprobado' : item.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </Text>
                </View>
                <View className="flex-row">
                  {item.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        className="bg-blue-100 p-2 rounded-lg mr-2"
                        onPress={() => openModal(item)}
                      >
                        <Ionicons name="create-outline" size={18} color="#2563eb" />
                      </TouchableOpacity>
                      {isAdmin && (
                        <>
                          <TouchableOpacity
                            className="bg-green-100 p-2 rounded-lg mr-2"
                            onPress={() => setStatus(item, 'approved')}
                          >
                            <Ionicons name="checkmark" size={18} color="#16a34a" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="bg-yellow-100 p-2 rounded-lg mr-2"
                            onPress={() => setStatus(item, 'rejected')}
                          >
                            <Ionicons name="close" size={18} color="#d97706" />
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                  {(isAdmin || item.status === 'pending') && (
                    <TouchableOpacity
                      className="bg-red-100 p-2 rounded-lg"
                      onPress={() => deleteVacation(item)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <ScrollView className="flex-1 bg-white p-6">
          <Text className="text-2xl font-bold mb-4">
            {editing ? 'Editar Permiso' : 'Nuevo Permiso'}
          </Text>
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Fecha inicio (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Fecha fin (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
          />
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Motivo"
            value={reason}
            onChangeText={setReason}
          />
          <TouchableOpacity className="bg-green-600 p-3 rounded-lg mb-3" onPress={saveVacation}>
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
