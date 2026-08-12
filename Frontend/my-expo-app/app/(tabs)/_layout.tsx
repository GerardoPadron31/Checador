import { Tabs } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import TabBar from '../../components/TabBar';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#0a0f1e' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="attendance" options={{ title: 'Asistencia' }} />
      {isAdmin && <Tabs.Screen name="users" options={{ title: 'Usuarios' }} />}
      {isAdmin && <Tabs.Screen name="history" options={{ title: 'Historial' }} />}
      {isAdmin && <Tabs.Screen name="schedules" options={{ title: 'Horarios' }} />}
      <Tabs.Screen name="vacations" options={{ title: 'Vacaciones' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
