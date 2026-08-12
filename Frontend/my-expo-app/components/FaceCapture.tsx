import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onCapture: (uri: string) => void;
  onCancel: () => void;
  facing?: 'front' | 'back';
  label?: string;
}

export default function FaceCapture({ onCapture, onCancel, facing = 'front', label = 'Capturar rostro' }: Props) {
  const cameraRef = useRef<CameraView>(null);

  const capture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} facing={facing} style={styles.camera} />
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity
          className="bg-white rounded-full p-5 mb-4"
          onPress={capture}
        >
          <Ionicons name="camera" size={40} color="#2563eb" />
        </TouchableOpacity>
        <Text className="text-white text-sm mb-4">{label}</Text>
        <TouchableOpacity
          className="bg-gray-800 rounded-lg px-6 py-3"
          onPress={onCancel}
        >
          <Text className="text-white font-semibold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
});
