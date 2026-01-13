import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  active = false,
  disabled = false,
  style,
}: ButtonProps) {
  const getVariantStyle = (): ViewStyle => {
    if (disabled) return styles.disabled;
    if (active) return styles.active;
    switch (variant) {
      case 'secondary': return styles.secondary;
      case 'ghost': return styles.ghost;
      default: return styles.primary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm': return styles.sizeSm;
      case 'lg': return styles.sizeLg;
      default: return styles.sizeMd;
    }
  };

  const getTextStyle = (): TextStyle => {
    if (disabled) return styles.textDisabled;
    if (active) return styles.textActive;
    if (variant === 'ghost') return styles.textGhost;
    return styles.text;
  };

  const isTextChild = typeof children === 'string';

  return (
    <TouchableOpacity
      style={[styles.base, getVariantStyle(), getSizeStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {isTextChild ? (
        <Text style={[styles.textBase, getTextStyle(), size === 'lg' && styles.textLg]}>
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.gray700 },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gray700 },
  ghost: { backgroundColor: 'transparent' },
  active: { backgroundColor: colors.primary },
  disabled: { backgroundColor: colors.gray800, opacity: 0.5 },
  sizeSm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sizeMd: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
  sizeLg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  textBase: { fontWeight: '500' },
  text: { color: colors.gray200 },
  textGhost: { color: colors.gray500 },
  textActive: { color: '#fff' },
  textDisabled: { color: colors.gray600 },
  textLg: { fontSize: fontSize.lg },
});
