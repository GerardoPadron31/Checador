import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  attendance: { active: 'camera', inactive: 'camera-outline' },
  users: { active: 'people', inactive: 'people-outline' },
  history: { active: 'time', inactive: 'time-outline' },
  schedules: { active: 'calendar', inactive: 'calendar-outline' },
  vacations: { active: 'umbrella', inactive: 'umbrella-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

interface Route {
  name: string;
  key: string;
  params?: any;
}

interface Props {
  state: { routes: Route[]; index: number };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: any } }>;
  navigation: any;
}

export default function TabBar({ state, descriptors, navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 14 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = options?.tabBarLabel ?? options?.title ?? route.name;
        const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const iconBox = (
          <View style={[styles.iconBox, focused && { backgroundColor: 'rgba(124,108,240,0.22)' }]}>
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={21}
              color={focused ? '#ffffff' : colors.muted}
            />
          </View>
        );

        return (
          <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
            {focused ? (
              <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activePill}
                className="items-center justify-center"
              >
                {iconBox}
              </LinearGradient>
            ) : (
              <View style={styles.inactivePill}>{iconBox}</View>
            )}
            <Text
              style={[styles.label, { color: focused ? '#ffffff' : colors.muted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(17,26,51,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 46,
    height: 40,
    borderRadius: 14,
    marginBottom: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  inactivePill: {
    width: 46,
    height: 40,
    borderRadius: 14,
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 46,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
});
