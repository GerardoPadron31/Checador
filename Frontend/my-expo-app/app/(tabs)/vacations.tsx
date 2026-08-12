import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Header, Card, Button, Chip, EmptyState, Badge, SectionLabel } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

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

  const statusBadge = (status: string) =>
    status === 'approved' ? (
      <Badge label="Aprobado" tone="success" />
    ) : status === 'rejected' ? (
      <Badge label="Rechazado" tone="danger" />
    ) : (
      <Badge label="Pendiente" tone="warning" />
    );

  return (
    <View className="flex-1 bg-[#0a0f1e]">
      <Header
        title={isAdmin ? 'Permisos y Vacaciones' : 'Mis Vacaciones'}
        subtitle={`${displayed.length} solicitudes`}
        icon="umbrella-outline"
      />
      <View className="flex-1 px-5 pt-5">
        <Button title="Solicitar Permiso" onPress={() => openModal()} icon="add-circle-outline" />

        {isAdmin && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 mb-3">
            <View className="flex-row gap-2">
              <Chip label="Todos" selected={filterUserId === null} onPress={() => setFilterUserId(null)} />
              {users.map((u) => (
                <Chip key={u.id} label={u.name} selected={filterUserId === u.id} onPress={() => setFilterUserId(u.id)} />
              ))}
            </View>
          </ScrollView>
        )}

        <FlatList
          data={displayed}
          className="mt-2"
          contentContainerStyle={{ paddingBottom: 130 }}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<EmptyState message="Sin solicitudes" />}
          renderItem={({ item }) => {
            const userName = users.find((u) => u.id === item.user_id)?.name;
            return (
              <Card>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    {isAdmin && (
                      <Text className="font-bold text-lg" style={{ color: colors.text }}>
                        {userName || `Usuario ${item.user_id}`}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                      <Text className={`${isAdmin ? 'text-[#aeb9d6]' : 'font-bold text-lg'} ml-1`} style={isAdmin ? undefined : { color: colors.text }}>
                        {item.start_date} → {item.end_date}
                      </Text>
                    </View>
                    {item.reason ? (
                      <Text className="text-[#9aa7c7] mt-1.5">Motivo: {item.reason}</Text>
                    ) : null}
                    <View className="mt-2">{statusBadge(item.status)}</View>
                  </View>
                  <View className="flex-row">
                    {item.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          className="items-center justify-center mr-2"
                          style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(124,108,240,0.18)' }}
                          onPress={() => openModal(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="create-outline" size={rs(18)} color="#a48af8" />
                        </TouchableOpacity>
                        {isAdmin && (
                          <>
                            <TouchableOpacity
                              className="items-center justify-center mr-2"
                              style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(0,212,160,0.18)' }}
                              onPress={() => setStatus(item, 'approved')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark" size={rs(18)} color="#00e5a8" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="items-center justify-center mr-2"
                              style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(245,158,11,0.18)' }}
                              onPress={() => setStatus(item, 'rejected')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close" size={rs(18)} color="#fbbf24" />
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    )}
                    {(isAdmin || item.status === 'pending') && (
                      <TouchableOpacity
                        className="items-center justify-center"
                        style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(239,68,68,0.18)' }}
                        onPress={() => deleteVacation(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={rs(18)} color="#fca5a5" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            );
          }}
        />
      </View>

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-[#0a0f1e]">
          <Header
            title={editing ? 'Editar Permiso' : 'Nuevo Permiso'}
            subtitle="Datos de la solicitud"
            icon="umbrella-outline"
          />
          <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <SectionLabel>Fecha inicio</SectionLabel>
            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3.5 mb-3"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted2}
              value={startDate}
              onChangeText={setStartDate}
            />
            <SectionLabel>Fecha fin</SectionLabel>
            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3.5 mb-3"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted2}
              value={endDate}
              onChangeText={setEndDate}
            />
            <SectionLabel>Motivo</SectionLabel>
            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3.5 mb-5"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="Ej. Vacaciones anuales"
              placeholderTextColor={colors.muted2}
              value={reason}
              onChangeText={setReason}
            />
            <Button title="Guardar" onPress={saveVacation} variant="accent" icon="checkmark-circle-outline" />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="ghost" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
