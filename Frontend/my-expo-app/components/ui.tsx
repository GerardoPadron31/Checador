import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, rs } from '../constants/theme';

export function Screen({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;
}

export function Header({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.bg2, colors.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.headerGlow} pointerEvents="none" />
      <View style={styles.headerRow}>
        {icon && (
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name={icon} size={24} color="#FFFFFF" />
          </LinearGradient>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const gradientMap: Record<'primary' | 'accent' | 'danger', { colors: [string, string]; glow: string }> = {
  primary: { colors: [colors.primaryDark, colors.primary], glow: colors.primary },
  accent: { colors: ['#00b98b', '#00e5a8'], glow: colors.accent },
  danger: { colors: ['#e54a4a', '#ff6b6b'], glow: colors.danger },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}) {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        style={[styles.ghostButton, (disabled || loading) && { opacity: 0.6 }]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {icon && <Ionicons name={icon} size={19} color={colors.muted} style={{ marginRight: 8 }} />}
        <Text style={styles.ghostText}>{loading ? 'Procesando...' : title}</Text>
      </TouchableOpacity>
    );
  }
  const g = gradientMap[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={{ opacity: disabled || loading ? 0.6 : 1 }}
    >
      <LinearGradient
        colors={g.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, { shadowColor: g.glow }]}
      >
        {loading ? (
          <Text style={styles.buttonText}>{'Procesando...'}</Text>
        ) : (
          <>
            {icon && <Ionicons name={icon} size={19} color="#FFFFFF" style={{ marginRight: 8 }} />}
            <Text style={styles.buttonText}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={selected ? styles.chipSelected : styles.chipIdle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={selected ? styles.chipSelectedText : styles.chipIdleText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'in' | 'out' | 'success' | 'warning' | 'danger' }) {
  const map: Record<string, { bg: string; fg: string }> = {
    in: { bg: 'rgba(0,229,168,0.14)', fg: '#4df0c0' },
    out: { bg: 'rgba(56,189,248,0.14)', fg: '#67d5ff' },
    success: { bg: 'rgba(0,229,168,0.14)', fg: '#4df0c0' },
    warning: { bg: 'rgba(255,179,71,0.14)', fg: '#ffcf7d' },
    danger: { bg: 'rgba(255,107,107,0.14)', fg: '#ffa1a1' },
  };
  const c = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="file-tray-outline" size={26} color={colors.muted} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 96, textAlignVertical: 'top', paddingTop: 14 }]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
    </View>
  );
}

export const screenPadding = {
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: rs(190),
    height: rs(190),
    borderRadius: rs(95),
    backgroundColor: 'rgba(139,124,247,0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerText: {
    marginLeft: 14,
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: rs(23),
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#a99dfb',
    fontSize: rs(13),
    marginTop: 3,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    minHeight: 52,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  ghostButton: {
    borderRadius: 14,
    paddingVertical: 15,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ghostText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 15,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipIdle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  chipIdleText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.muted2,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.muted,
    marginBottom: 10,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
  },
});
