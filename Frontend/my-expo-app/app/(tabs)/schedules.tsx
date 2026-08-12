import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface Schedule {
  id: number;
  user_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface UserOption {
  id: number;
  name: string;
}

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchSchedules();
    fetchUsers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules/');
      setSchedules(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los horarios');
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

  const openModal = (sched?: Schedule) => {
    setEditing(sched || null);
    setUserId(sched?.user_id ? String(sched.user_id) : '');
    setDayOfWeek(sched ? String(sched.day_of_week) : '0');
    setStartTime(sched?.start_time?.slice(0, 5) || '');
    setEndTime(sched?.end_time?.slice(0, 5) || '');
    setModalVisible(true);
  };

  const saveSchedule = async () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Ingresa las horas de inicio y fin');
      return;
    }
    const payload = {
      user_id: userId ? parseInt(userId) : null,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
    };
    try {
      if (editing) {
        await api.put(`/schedules/${editing.id}`, payload);
        Alert.alert('Éxito', 'Horario actualizado');
      } else {
        await api.post('/schedules/', payload);
        Alert.alert('Éxito', 'Horario creado');
      }
      setModalVisible(false);
      fetchSchedules();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo guardar el horario';
      Alert.alert('Error', msg);
    }
  };

  const deleteSchedule = (sched: Schedule) => {
    Alert.alert('Eliminar horario', '¿Eliminar este horario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/schedules/${sched.id}`);
            fetchSchedules();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-1">Horarios</Text>
      <Text className="text-gray-500 mb-4">{schedules.length} registrados</Text>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg p-4 mb-4"
        onPress={() => openModal()}
      >
        <Text className="text-white text-center font-semibold">Agregar Horario</Text>
      </TouchableOpacity>

      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const userName = users.find((u) => u.id === item.user_id)?.name;
          return (
            <View className="bg-white p-4 rounded-lg mb-2 shadow-sm">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-bold text-lg">{DAYS[item.day_of_week]}</Text>
                  <Text className="text-gray-600">
                    {item.start_time} - {item.end_time}
                  </Text>
                  <Text className="text-gray-500 mt-1">
                    {item.user_id ? `Usuario: ${userName || item.user_id}` : 'General (todos)'}
                  </Text>
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
                    onPress={() => deleteSchedule(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <ScrollView className="flex-1 bg-white p-6">
          <Text className="text-2xl font-bold mb-4">
            {editing ? 'Editar Horario' : 'Nuevo Horario'}
          </Text>

          <Text className="text-sm font-semibold mb-1">Día de la semana</Text>
          <View className="flex-row flex-wrap mb-3">
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={i}
                className={`p-2 rounded-lg mr-2 mb-2 ${parseInt(dayOfWeek) === i ? 'bg-blue-600' : 'bg-gray-200'}`}
                onPress={() => setDayOfWeek(String(i))}
              >
                <Text className={parseInt(dayOfWeek) === i ? 'text-white' : 'text-gray-700'}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold mb-1">Usuario (opcional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <TouchableOpacity
              className={`p-3 rounded-lg mr-2 ${userId === '' ? 'bg-green-600' : 'bg-gray-200'}`}
              onPress={() => setUserId('')}
            >
              <Text className={userId === '' ? 'text-white' : 'text-gray-700'}>General</Text>
            </TouchableOpacity>
            {users.map((u) => (
              <TouchableOpacity
                key={u.id}
                className={`p-3 rounded-lg mr-2 ${userId === String(u.id) ? 'bg-green-600' : 'bg-gray-200'}`}
                onPress={() => setUserId(String(u.id))}
              >
                <Text className={userId === String(u.id) ? 'text-white' : 'text-gray-700'}>{u.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Hora inicio (HH:MM)"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TextInput
            className="border border-gray-300 p-3 mb-3 rounded-lg"
            placeholder="Hora fin (HH:MM)"
            value={endTime}
            onChangeText={setEndTime}
          />

          <TouchableOpacity className="bg-green-600 p-3 rounded-lg mb-3" onPress={saveSchedule}>
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
