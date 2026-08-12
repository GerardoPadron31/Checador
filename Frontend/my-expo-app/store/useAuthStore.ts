import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  area: string | null;
  face_image_path: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  booting: boolean;
  login: (email: string, password: string) => Promise<void>;
  faceLogin: (uri: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: FormData) => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  booting: true,

  bootstrap: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        set({ token });
        const response = await api.get('/users/me');
        set({ user: response.data });
      }
    } catch (error) {
      await AsyncStorage.removeItem('access_token');
      set({ token: null, user: null });
    } finally {
      set({ booting: false });
    }
  },

  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { access_token } = response.data;
    await AsyncStorage.setItem('access_token', access_token);
    set({ token: access_token });
    const userResponse = await api.get('/users/me');
    await AsyncStorage.setItem('user_data', JSON.stringify(userResponse.data));
    set({ user: userResponse.data });
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/users/me');
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      set({ user: response.data });
    } catch (error) {
      // ignore
    }
  },

  faceLogin: async (uri) => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'face.jpg',
      type: 'image/jpeg',
    } as any);
    const response = await api.post('/auth/face-login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { access_token, user, attendance } = response.data;
    await AsyncStorage.setItem('access_token', access_token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    set({ token: access_token, user });
    return attendance;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'user_data']);
    set({ user: null, token: null });
  },

  register: async (formData) => {
    await api.post('/users/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
}));
