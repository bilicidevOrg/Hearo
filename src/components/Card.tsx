import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'subtle';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'highlighted': return styles.highlighted;
      case 'subtle': return styles.subtle;
      default: return styles.default;
    }
  };

  return (
    <View style={[styles.base, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.lg, padding: spacing.lg },
  default: { backgroundColor: colors.bgLight },
  highlighted: { backgroundColor: colors.bgLighter, borderWidth: 1, borderColor: colors.gray700 },
  subtle: { backgroundColor: colors.gray900 },
});
