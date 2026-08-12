import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CAMBIA ESTA IP por la de tu computadora
const API_URL = 'http://192.168.0.15:8000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;