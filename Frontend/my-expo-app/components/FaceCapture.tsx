import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, rs } from '../constants/theme';

interface Props {
  onCapture: (uri: string) => void;
  onCancel: () => void;
  facing?: 'front' | 'back';
  label?: string;
}

export default function FaceCapture({
  onCapture,
  onCancel,
  facing = 'front',
  label = 'Coloque su rostro dentro del marco',
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const capture = async () => {
    if (busy || !cameraRef.current || !cameraReady) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
      } else {
        setError('No se pudo capturar la foto, intenta de nuevo.');
        setBusy(false);
      }
    } catch (e) {
      setError('Ocurrió un error al capturar la foto. Intenta de nuevo.');
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-white mt-4">Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.bg2 }}>
        <View className="w-20 h-20 rounded-full items-center justify-center mb-5" style={{ backgroundColor: 'rgba(124,108,240,0.18)' }}>
          <Ionicons name="camera-outline" size={38} color={colors.primary} />
        </View>
        <Text className="text-white text-xl font-bold mb-2">Necesitamos la cámara</Text>
        <Text className="text-center mb-6" style={{ color: colors.muted2 }}>
          Para registrar tu asistencia con reconocimiento facial debemos acceder a la cámara.
        </Text>
        <TouchableOpacity
          className="rounded-xl w-full"
          activeOpacity={0.85}
          onPress={requestPermission}
        >
          <View
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">Permitir acceso a la cámara</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity className="mt-4 py-3" onPress={onCancel} activeOpacity={0.8}>
          <Text style={{ color: colors.muted }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const oval = rs(236);

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        facing={facing}
        mode="picture"
        className="flex-1"
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => {
          setError('No se pudo abrir la cámara. Cierra y vuelve a intentar.');
          setCameraReady(false);
        }}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + rs(10) }]}>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg ml-3" numberOfLines={1} style={{ flex: 1 }}>
            Capturar rostro
          </Text>
        </View>
      </View>

      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View
          style={{ width: oval, height: oval, borderRadius: oval / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: oval, height: oval, borderRadius: oval / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
        </View>
      </View>

      <View style={[styles.bottomBar, { bottom: insets.bottom + rs(16) }]}>
        {error && (
          <Text className="text-red-300 text-sm mb-4 bg-black/60 px-4 py-2 rounded-xl overflow-hidden">
            {error}
          </Text>
        )}
        <Text className="text-white text-sm mb-5 bg-black/40 px-4 py-1.5 rounded-full overflow-hidden">
          {cameraReady ? label : 'Preparando cámara...'}
        </Text>
        <TouchableOpacity
          className="items-center justify-center mb-4"
          style={{ width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: busy || !cameraReady ? '#555555' : '#FFFFFF' }}
          onPress={capture}
          disabled={busy || !cameraReady}
          activeOpacity={0.8}
        >
          {busy || !cameraReady ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View className="rounded-full border-2 items-center justify-center" style={{ width: rs(64), height: rs(64), borderColor: colors.primary }}>
              <Ionicons name="camera" size={rs(32)} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-white/20 rounded-xl px-6 py-3"
          onPress={onCancel}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  topBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  bottomBar: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
};
