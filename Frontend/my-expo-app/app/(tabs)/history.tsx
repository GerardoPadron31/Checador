import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Header, Card, Button, Badge, EmptyState, Chip, SectionLabel } from '../../components/ui';
import { colors, rs } from '../../constants/theme';

interface AttendanceRecord {
  id: number;
  user_id: number;
  timestamp: string;
  type: 'in' | 'out';
  user?: { name: string };
}

interface UserOption {
  id: number;
  name: string;
}

type FilterMode = 'week' | 'month' | 'year' | 'all';

const now = new Date();

export default function HistoryScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(user?.id ?? null);
  const [mode, setMode] = useState<FilterMode>('all');
  const [area, setArea] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.map((u: any) => ({ id: u.id, name: u.name })));
    } catch (error) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedUserId(user?.id ?? null);
    }
  }, [isAdmin, user]);

  const buildParams = () => {
    const params: any = {};
    const y = now.getFullYear();
    const week = (() => {
      const d = new Date(y, 0, 1);
      return Math.ceil(((now.getTime() - d.getTime()) / 86400000 + d.getDay() + 1) / 7);
    })();
    if (mode === 'year') {
      params.year = y;
    } else if (mode === 'month') {
      params.year = y;
      params.month = now.getMonth() + 1;
    } else if (mode === 'week') {
      params.year = y;
      params.week = week;
    }
    return params;
  };

  const fetchHistory = async () => {
    if (!isAdmin && !selectedUserId) {
      Alert.alert('Error', 'No se pudo identificar tu usuario');
      return;
    }
    if (isAdmin && !selectedUserId) {
      Alert.alert('Error', 'Selecciona un usuario');
      return;
    }
    setLoading(true);
    try {
      const params = buildParams();
      const response = await api.get(`/attendance/user/${selectedUserId}`, { params });
      setRecords(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener el historial');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaHistory = async () => {
    if (!area) {
      Alert.alert('Error', 'Ingresa un área');
      return;
    }
    setLoading(true);
    try {
      const params = { area, ...buildParams() };
      const response = await api.get('/attendance/area', { params });
      setRecords(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener el historial del área');
    } finally {
      setLoading(false);
    }
  };

  const filters: { label: string; value: FilterMode }[] = [
    { label: 'Todo', value: 'all' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' },
    { label: 'Año', value: 'year' },
  ];

  return (
    <View className="flex-1 bg-[#0a0f1e]">
      <Header title="Historial de Asistencia" subtitle="Consulta de registros" icon="time-outline" />
      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
      >
        <Card>
          <SectionLabel>Periodo</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {filters.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  selected={mode === f.value}
                  onPress={() => setMode(f.value)}
                />
              ))}
            </View>
          </ScrollView>

          {isAdmin && (
            <>
              <SectionLabel>Empleado</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {users.map((u) => (
                    <Chip
                      key={u.id}
                      label={u.name}
                      selected={selectedUserId === u.id}
                      onPress={() => setSelectedUserId(u.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <Button
            title={isAdmin ? 'Ver historial del usuario' : 'Ver mi historial'}
            onPress={fetchHistory}
            icon="search-outline"
          />
        </Card>

        {isAdmin && (
          <Card>
            <SectionLabel>Historial por área</SectionLabel>
            <TextInput
              className="bg-[#0d1428] border rounded-xl px-4 py-3 mb-3"
              style={{ borderColor: colors.borderStrong, color: colors.text }}
              placeholder="Área (ej. RH, Administrativo, TI...)"
              placeholderTextColor={colors.muted2}
              value={area}
              onChangeText={setArea}
            />
            <Button title="Consultar área" onPress={fetchAreaHistory} variant="accent" icon="business-outline" />
          </Card>
        )}

        <View className="flex-row justify-between items-center mt-3 mb-3">
          <Text className="font-semibold text-[#9aa7c7]">{records.length} registros</Text>
          {records.length > 0 && (
            <TouchableOpacity
              className="bg-[#141d38] border rounded-full px-3 py-2 flex-row items-center"
              style={{ borderColor: colors.border }}
              onPress={() => {
                const csv = ['Nombre,UsuarioID,Fecha,Tipo']
                  .concat(records.map((r) => {
                    const who = r.user?.name || r.user_id;
                    const date = new Date(r.timestamp).toLocaleString();
                    const type = r.type === 'in' ? 'Entrada' : 'Salida';
                    return `${who},${r.user_id},${date},${type}`;
                  }))
                  .join('\n');
                Alert.alert('Historial (CSV)', csv, [{ text: 'OK' }]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={16} color={colors.primary} />
              <Text className="ml-1 text-sm font-semibold" style={{ color: colors.primary }}>
                Exportar CSV
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={records}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <EmptyState message={loading ? 'Cargando...' : 'Sin registros'} />
          }
          renderItem={({ item }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                className="items-center justify-center mr-3"
                style={{ width: rs(44), height: rs(44), borderRadius: rs(22), backgroundColor: item.type === 'in' ? colors.accentLight : colors.dangerLight }}
              >
                <Ionicons
                  name={item.type === 'in' ? 'log-in-outline' : 'log-out-outline'}
                  size={rs(20)}
                  color={item.type === 'in' ? colors.accentDark : colors.danger}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {item.user?.name || `Usuario ${item.user_id}`}
                </Text>
                <Text className="text-[#9aa7c7] text-sm">
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              <Badge label={item.type === 'in' ? 'Entrada' : 'Salida'} tone={item.type === 'in' ? 'in' : 'out'} />
            </Card>
          )}
        />
      </ScrollView>
    </View>
  );
}
