import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ title, children, actions, style }: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {actions && <View style={styles.actions}>{actions}</View>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: spacing.md },
});
