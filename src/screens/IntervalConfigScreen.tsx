import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faPlay } from '@fortawesome/free-solid-svg-icons';
import { Header, Button, Section } from '../components';
import { INTERVALS, TRAINING_INTERVALS, DEFAULT_ENABLED_INTERVALS, EnabledIntervals, IntervalKey, SCALES, SCALE_KEYS, ScaleKey, getIntervalsForScale, findMatchingScale, SCALE_STEPS } from '../core/theory/intervals';
import audioEngine from '../core/audio/AudioEngine';
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
  const [sustainDuration, setSustainDuration] = useState(0.5);
  const [selectedScale, setSelectedScale] = useState<ScaleKey>('major');
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    audioEngine.init().then(() => setIsReady(true));
  }, []);

  const hasSelection = Object.values(intervals).some(v => v);

  const toggleInterval = (key: IntervalKey) => {
    setIntervals(prev => {
      const newIntervals = { ...prev, [key]: !prev[key] };
      setSelectedScale(findMatchingScale(newIntervals));
      return newIntervals;
    });
  };

  const selectScale = (scaleKey: ScaleKey) => {
    if (scaleKey === 'custom') return;
    setSelectedScale(scaleKey);
    setIntervals(getIntervalsForScale(scaleKey));
    setShowScaleDropdown(false);
  };

  const selectAll = () => {
    const all = {} as EnabledIntervals;
    TRAINING_INTERVALS.forEach(k => all[k] = true);
    setIntervals(all);
    setSelectedScale('custom');
  };

  const selectNone = () => {
    const none = {} as EnabledIntervals;
    TRAINING_INTERVALS.forEach(k => none[k] = false);
    setIntervals(none);
    setSelectedScale('custom');
  };

  const playScale = async () => {
    if (!isReady || !hasSelection) return;
    const baseNote = 60; // C4
    let steps: number[];
    if (selectedScale === 'custom') {
      // Build steps from selected intervals
      steps = [0];
      TRAINING_INTERVALS.forEach(key => {
        if (intervals[key]) steps.push(INTERVALS[key].semitones);
      });
      steps.sort((a, b) => a - b);
    } else {
      steps = SCALE_STEPS[selectedScale];
    }
    for (const step of steps) {
      await audioEngine.playNote(baseNote + step);
      await new Promise(resolve => setTimeout(resolve, sustainDuration * 1000));
    }
  };

  const handleStart = () => {
    if (hasSelection) {
      navigation.navigate('IntervalQuiz', { intervals, direction, sustainDuration });
    }
  };

  const Toggle = ({ keyName, label }: { keyName: IntervalKey; label: string }) => {
    const isActive = intervals[keyName];
    return (
      <TouchableOpacity
        onPress={() => toggleInterval(keyName)}
        style={[styles.toggle, isActive && styles.toggleActive]}
      >
        <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const IntervalRow = ({ items }: { items: { key: IntervalKey; label: string }[] }) => (
    <View style={styles.row}>
      {items.map(item => (
        <Toggle key={item.key} keyName={item.key} label={item.label} />
      ))}
    </View>
  );

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
          <View style={styles.rowsContainer}>
            <IntervalRow items={[{ key: 'm2', label: 'Minor 2nd' }, { key: 'M2', label: 'Major 2nd' }]} />
            <IntervalRow items={[{ key: 'm3', label: 'Minor 3rd' }, { key: 'M3', label: 'Major 3rd' }]} />
            <IntervalRow items={[{ key: 'P4', label: 'Perfect 4th' }, { key: 'TT', label: 'Tritone' }, { key: 'P5', label: 'Perfect 5th' }]} />
            <IntervalRow items={[{ key: 'm6', label: 'Minor 6th' }, { key: 'M6', label: 'Major 6th' }]} />
            <IntervalRow items={[{ key: 'm7', label: 'Minor 7th' }, { key: 'M7', label: 'Major 7th' }]} />
            <IntervalRow items={[{ key: 'P8', label: 'Octave' }]} />
          </View>
        </Section>

        <Section title="Scale">
          <View style={styles.scaleRow}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowScaleDropdown(true)}>
              <Text style={styles.dropdownText}>{SCALES[selectedScale].name}</Text>
              <FontAwesomeIcon icon={faChevronDown as any} size={12} color={colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playScaleBtn, !hasSelection && styles.playScaleBtnDisabled]}
              onPress={playScale}
              disabled={!hasSelection}
            >
              <FontAwesomeIcon icon={faPlay as any} size={12} color={!hasSelection ? colors.gray600 : colors.gray300} />
              <Text style={[styles.playScaleText, !hasSelection && styles.playScaleTextDisabled]}>Play Scale</Text>
            </TouchableOpacity>
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
              minimumValue={0.2}
              maximumValue={2}
              step={0.1}
              value={sustainDuration}
              onValueChange={setSustainDuration}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray700}
              thumbTintColor={colors.gray300}
            />
            <Text style={styles.sliderValue}>{sustainDuration.toFixed(1)}s</Text>
          </View>
        </Section>

        <Button size="lg" onPress={handleStart} disabled={!hasSelection} style={styles.startButton}>
          Start Training
        </Button>
      </ScrollView>

      <Modal visible={showScaleDropdown} transparent animationType="fade" onRequestClose={() => setShowScaleDropdown(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowScaleDropdown(false)}>
          <View style={styles.modalContent}>
            {SCALE_KEYS.map(key => (
              <TouchableOpacity key={key} style={styles.modalItem} onPress={() => selectScale(key)}>
                <Text style={[styles.modalItemText, selectedScale === key && styles.modalItemTextActive]}>
                  {SCALES[key].name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  scaleRow: { flexDirection: 'row', gap: spacing.sm },
  dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, backgroundColor: colors.gray800, borderRadius: borderRadius.md },
  dropdownText: { color: colors.gray200, fontSize: fontSize.md },
  playScaleBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, backgroundColor: colors.gray800, borderRadius: borderRadius.md },
  playScaleBtnDisabled: { opacity: 0.5 },
  playScaleText: { color: colors.gray300, fontSize: fontSize.sm },
  playScaleTextDisabled: { color: colors.gray600 },
  sectionActions: { flexDirection: 'row', gap: spacing.lg },
  actionText: { color: colors.gray500, fontSize: fontSize.sm },
  rowsContainer: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray800,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.gray500,
    fontSize: fontSize.sm,
  },
  toggleTextActive: {
    color: colors.text,
  },
  toggleGroup: { flexDirection: 'row', gap: spacing.sm },
  toggleButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray700 },
  toggleButtonActive: { backgroundColor: colors.gray700, borderColor: colors.gray600 },
  toggleButtonText: { color: colors.gray500, fontSize: fontSize.sm },
  toggleButtonTextActive: { color: colors.gray200 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  slider: { flex: 1, height: 30 },
  sliderValue: { color: colors.gray400, fontSize: fontSize.md, width: 40 },
  startButton: { marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.bgLighter, borderRadius: borderRadius.lg, padding: spacing.sm, minWidth: 200 },
  modalItem: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  modalItemText: { color: colors.gray400, fontSize: fontSize.md },
  modalItemTextActive: { color: colors.primary },
});
