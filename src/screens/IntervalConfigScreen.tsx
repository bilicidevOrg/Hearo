import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Header, Button, Section } from '../components';
import { INTERVALS, TRAINING_INTERVALS, DEFAULT_ENABLED_INTERVALS, EnabledIntervals, IntervalKey } from '../core/theory/intervals';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type RootStackParamList = {
  IntervalConfig: undefined;
  IntervalQuiz: { intervals: EnabledIntervals; direction: string; sustainDuration: number };
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IntervalConfig'>;
}

export function IntervalConfigScreen({ navigation }: Props) {
  const [intervals, setIntervals] = useState<EnabledIntervals>(DEFAULT_ENABLED_INTERVALS);
  const [direction, setDirection] = useState<'ascending' | 'descending' | 'both'>('ascending');
  const [sustainDuration, setSustainDuration] = useState(1.5);

  const hasSelection = Object.values(intervals).some(v => v);

  const toggleInterval = (key: IntervalKey) => {
    setIntervals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const all = {} as EnabledIntervals;
    TRAINING_INTERVALS.forEach(k => all[k] = true);
    setIntervals(all);
  };

  const selectNone = () => {
    const none = {} as EnabledIntervals;
    TRAINING_INTERVALS.forEach(k => none[k] = false);
    setIntervals(none);
  };

  const handleStart = () => {
    if (hasSelection) {
      navigation.navigate('IntervalQuiz', { intervals, direction, sustainDuration });
    }
  };

  const IntervalButton = ({ keyName }: { keyName: IntervalKey }) => {
    const interval = INTERVALS[keyName];
    const isActive = intervals[keyName];
    return (
      <TouchableOpacity
        onPress={() => toggleInterval(keyName)}
        style={[styles.intervalButton, isActive && styles.intervalButtonActive]}
      >
        <Text style={[styles.intervalAbbrev, isActive && styles.intervalTextActive]}>
          {interval.abbrev}
        </Text>
        <Text style={[styles.intervalName, isActive && styles.intervalNameActive]}>
          {interval.name.replace('Perfect ', 'P').replace('Major ', 'Maj ').replace('Minor ', 'Min ')}
        </Text>
      </TouchableOpacity>
    );
  };

  const DirectionButton = ({ value, label }: { value: typeof direction; label: string }) => (
    <TouchableOpacity
      onPress={() => setDirection(value)}
      style={[styles.toggleButton, direction === value && styles.toggleButtonActive]}
    >
      <Text style={[styles.toggleButtonText, direction === value && styles.toggleButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Test Configuration" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Section
          title="Intervals"
          actions={
            <View style={styles.sectionActions}>
              <TouchableOpacity onPress={selectAll}><Text style={styles.actionText}>Select all</Text></TouchableOpacity>
              <TouchableOpacity onPress={selectNone}><Text style={styles.actionText}>Clear</Text></TouchableOpacity>
            </View>
          }
        >
          <View style={styles.intervalsGrid}>
            <View style={styles.intervalRow}>
              <IntervalButton keyName="m2" />
              <IntervalButton keyName="M2" />
              <IntervalButton keyName="m3" />
              <IntervalButton keyName="M3" />
            </View>
            <View style={styles.intervalRow}>
              <IntervalButton keyName="P4" />
              <IntervalButton keyName="TT" />
              <IntervalButton keyName="P5" />
              <IntervalButton keyName="m6" />
            </View>
            <View style={styles.intervalRow}>
              <IntervalButton keyName="M6" />
              <IntervalButton keyName="m7" />
              <IntervalButton keyName="M7" />
              <IntervalButton keyName="P8" />
            </View>
          </View>
        </Section>

        <Section title="Direction">
          <View style={styles.toggleGroup}>
            <DirectionButton value="ascending" label="Ascending" />
            <DirectionButton value="descending" label="Descending" />
            <DirectionButton value="both" label="Both" />
          </View>
        </Section>

        <Section title="Sustain Duration">
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={4}
              step={0.5}
              value={sustainDuration}
              onValueChange={setSustainDuration}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray700}
              thumbTintColor={colors.gray300}
            />
            <Text style={styles.sliderValue}>{sustainDuration}s</Text>
          </View>
        </Section>

        <Button size="lg" onPress={handleStart} disabled={!hasSelection} style={styles.startButton}>
          Start Training
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  sectionActions: { flexDirection: 'row', gap: spacing.lg },
  actionText: { color: colors.gray500, fontSize: fontSize.sm },
  intervalsGrid: { gap: spacing.sm },
  intervalRow: { flexDirection: 'row', gap: spacing.sm },
  intervalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray700,
    alignItems: 'center',
  },
  intervalButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  intervalAbbrev: { color: colors.gray400, fontSize: fontSize.lg, fontWeight: '600' },
  intervalName: { color: colors.gray600, fontSize: fontSize.xs, marginTop: 2 },
  intervalTextActive: { color: colors.text },
  intervalNameActive: { color: colors.gray300 },
  toggleGroup: { flexDirection: 'row', gap: spacing.sm },
  toggleButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray700 },
  toggleButtonActive: { backgroundColor: colors.gray700, borderColor: colors.gray600 },
  toggleButtonText: { color: colors.gray500, fontSize: fontSize.sm },
  toggleButtonTextActive: { color: colors.gray200 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  slider: { flex: 1, height: 40 },
  sliderValue: { color: colors.gray400, fontSize: fontSize.md, width: 40 },
  startButton: { marginTop: spacing.lg },
});
