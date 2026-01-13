import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { colors, spacing, fontSize } from '../theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

export function Header({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft as any} size={20} color={colors.gray400} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {onBack && <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  backButton: { padding: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.gray200 },
  placeholder: { width: 36 },
});
