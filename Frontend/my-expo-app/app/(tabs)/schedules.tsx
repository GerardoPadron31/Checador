import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Header, Card, Button, Chip, EmptyState, SectionLabel } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

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
    <View className="flex-1 bg-[#0a0f1e]">
      <Header title="Horarios" subtitle={`${schedules.length} registrados`} icon="calendar-outline" />
      <View className="flex-1 px-5 pt-5">
        <Button title="Agregar Horario" onPress={() => openModal()} icon="add-circle-outline" />

        <FlatList
          data={schedules}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 130 }}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<EmptyState message="Sin horarios registrados" />}
          renderItem={({ item }) => {
            const userName = users.find((u) => u.id === item.user_id)?.name;
            return (
              <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View className="items-center justify-center mr-3" style={{ width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: 'rgba(124,108,240,0.18)' }}>
                  <Text className="font-bold" style={{ color: '#a48af8', fontSize: rs(18) }}>
                    {DAYS[item.day_of_week][0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {DAYS[item.day_of_week]}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text className="text-[#aeb9d6] ml-1">
                      {item.start_time} - {item.end_time}
                    </Text>
                  </View>
                  <Text className="text-[#9aa7c7] text-xs mt-1">
                    {item.user_id ? `Usuario: ${userName || item.user_id}` : 'General (todos)'}
                  </Text>
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
                    onPress={() => deleteSchedule(item)}
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
            title={editing ? 'Editar Horario' : 'Nuevo Horario'}
            subtitle="Configura el horario"
            icon="calendar-outline"
          />
          <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <SectionLabel>Día de la semana</SectionLabel>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {DAYS.map((d, i) => (
                <Chip key={d} label={d} selected={parseInt(dayOfWeek) === i} onPress={() => setDayOfWeek(String(i))} />
              ))}
            </View>

            <SectionLabel>Usuario (opcional)</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              <View className="flex-row gap-2">
                <Chip label="General" selected={userId === ''} onPress={() => setUserId('')} />
                {users.map((u) => (
                  <Chip key={u.id} label={u.name} selected={userId === String(u.id)} onPress={() => setUserId(String(u.id))} />
                ))}
              </View>
            </ScrollView>

            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3.5 mb-3"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="Hora inicio (HH:MM)"
              placeholderTextColor={colors.muted2}
              value={startTime}
              onChangeText={setStartTime}
            />
            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3.5 mb-5"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="Hora fin (HH:MM)"
              placeholderTextColor={colors.muted2}
              value={endTime}
              onChangeText={setEndTime}
            />

            <Button title="Guardar" onPress={saveSchedule} variant="accent" icon="checkmark-circle-outline" />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="ghost" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
