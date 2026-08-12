import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

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

  const FilterButton = ({ label, value }: { label: string; value: FilterMode }) => (
    <TouchableOpacity
      className={`flex-1 p-2 rounded-lg mr-2 ${mode === value ? 'bg-blue-600' : 'bg-gray-200'}`}
      onPress={() => setMode(value)}
    >
      <Text className={`text-center text-sm ${mode === value ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-100" refreshControl={
      <RefreshControl refreshing={loading} onRefresh={fetchHistory} />
    }>
      <View className="p-4">
        <Text className="text-2xl font-bold mb-1">Historial de Asistencia</Text>
        <Text className="text-gray-500 mb-4">
          {mode === 'week' && 'Semana actual'}
          {mode === 'month' && 'Mes actual'}
          {mode === 'year' && 'Año actual'}
          {mode === 'all' && 'Todo el historial'}
        </Text>

        {isAdmin && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {users.map((u) => (
              <TouchableOpacity
                key={u.id}
                className={`p-3 rounded-lg mr-2 ${selectedUserId === u.id ? 'bg-green-600' : 'bg-white border border-gray-200'}`}
                onPress={() => setSelectedUserId(u.id)}
              >
                <Text className={selectedUserId === u.id ? 'text-white font-semibold' : 'text-gray-700'}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View className="flex-row mb-3">
          <FilterButton label="Todo" value="all" />
          <FilterButton label="Semana" value="week" />
          <FilterButton label="Mes" value="month" />
          <FilterButton label="Año" value="year" />
        </View>

        <TouchableOpacity className="bg-blue-600 rounded-lg p-3 mb-3" onPress={fetchHistory}>
          <Text className="text-white text-center font-semibold">
            {isAdmin ? 'Ver historial del usuario' : 'Ver mi historial'}
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <View className="bg-white p-4 rounded-lg shadow-sm mb-3">
            <Text className="font-semibold mb-2">Historial por área</Text>
            <TextInput
              className="border border-gray-300 p-2 mb-2 rounded-lg"
              placeholder="Área (ej. RH, Administrativo, TI...)"
              value={area}
              onChangeText={setArea}
            />
            <TouchableOpacity className="bg-green-600 rounded-lg p-3" onPress={fetchAreaHistory}>
              <Text className="text-white text-center font-semibold">Consultar área</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold">{records.length} registros</Text>
          {records.length > 0 && (
            <TouchableOpacity
              className="bg-gray-200 p-2 rounded-lg flex-row items-center"
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
            >
              <Ionicons name="download-outline" size={16} color="#374151" />
              <Text className="text-gray-700 ml-1 text-sm">Exportar CSV</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={records}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-8">
              {loading ? 'Cargando...' : 'Sin registros'}
            </Text>
          }
          renderItem={({ item }) => (
            <View className="bg-white p-3 rounded-lg mb-2 shadow-sm flex-row items-center">
              <Ionicons
                name={item.type === 'in' ? 'log-in-outline' : 'log-out-outline'}
                size={22}
                color={item.type === 'in' ? '#16a34a' : '#dc2626'}
              />
              <View className="ml-3 flex-1">
                <Text className="font-semibold">
                  {item.user?.name || `Usuario ${item.user_id}`}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text className={`font-semibold ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                {item.type === 'in' ? 'Entrada' : 'Salida'}
              </Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}
