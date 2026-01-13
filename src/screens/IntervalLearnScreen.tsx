import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faChevronDown, faPlay } from '@fortawesome/free-solid-svg-icons';
import { Header, Button, Card, Section } from '../components';
import { INTERVALS, TRAINING_INTERVALS, generateIntervalQuestion, IntervalKey, IntervalQuestion, SCALES, SCALE_KEYS, ScaleKey, getIntervalsForScale, SCALE_STEPS } from '../core/theory/intervals';
import { Note } from '../core/theory/notes';
import audioEngine from '../core/audio/AudioEngine';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type RootStackParamList = { IntervalLearn: undefined };

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IntervalLearn'>;
}

export function IntervalLearnScreen({ navigation }: Props) {
  const [selectedInterval, setSelectedInterval] = useState<IntervalKey | null>(null);
  const [direction, setDirection] = useState<'ascending' | 'descending' | 'both'>('ascending');
  const [sustainDuration, setSustainDuration] = useState(0.5);
  const [playbackMode, setPlaybackMode] = useState<'melodic' | 'harmonic'>('melodic');
  const [lockedBaseNote, setLockedBaseNote] = useState<Note | null>(null);
  const [currentExample, setCurrentExample] = useState<IntervalQuestion | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedScale, setSelectedScale] = useState<ScaleKey>('major');
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);
  const initRef = useRef(false);

  const scaleIntervals = getIntervalsForScale(selectedScale);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const init = async () => {
      audioEngine.setSustainDuration(sustainDuration);
      await audioEngine.init();
      setIsReady(true);
    };
    init();
  }, [sustainDuration]);

  useEffect(() => { audioEngine.setSustainDuration(sustainDuration); }, [sustainDuration]);

  const generateExample = useCallback((intervalKey: IntervalKey, dir = direction) => {
    const enabledIntervals = { [intervalKey]: true } as any;
    return generateIntervalQuestion(enabledIntervals, dir, lockedBaseNote);
  }, [direction, lockedBaseNote]);

  const autoPlay = useCallback((example: IntervalQuestion | null, mode = playbackMode) => {
    if (!example || !isReady) return;
    setTimeout(() => audioEngine.playInterval(example.note1.midi, example.note2.midi, mode), 100);
  }, [isReady, playbackMode]);

  const selectInterval = useCallback((intervalKey: IntervalKey) => {
    setSelectedInterval(intervalKey);
    const example = generateExample(intervalKey);
    setCurrentExample(example);
    autoPlay(example);
  }, [generateExample, autoPlay]);

  const refresh = useCallback(() => {
    if (!selectedInterval) return;
    const example = generateExample(selectedInterval);
    setCurrentExample(example);
    autoPlay(example);
  }, [selectedInterval, generateExample, autoPlay]);

  const changeDirection = useCallback((newDir: typeof direction) => {
    setDirection(newDir);
    if (selectedInterval) {
      const example = generateExample(selectedInterval, newDir);
      setCurrentExample(example);
      autoPlay(example);
    }
  }, [selectedInterval, generateExample, autoPlay]);

  const changePlaybackMode = useCallback((mode: typeof playbackMode) => {
    setPlaybackMode(mode);
    if (currentExample && isReady) {
      setTimeout(() => audioEngine.playInterval(currentExample.note1.midi, currentExample.note2.midi, mode), 50);
    }
  }, [currentExample, isReady]);

  const toggleLockBaseNote = useCallback(() => {
    if (!currentExample) return;
    if (lockedBaseNote && lockedBaseNote.midi === currentExample.note1.midi) {
      setLockedBaseNote(null);
    } else {
      setLockedBaseNote(currentExample.note1);
      audioEngine.playNote(currentExample.note1.midi);
    }
  }, [currentExample, lockedBaseNote]);

  const playScale = async () => {
    if (!isReady || selectedScale === 'custom') return;
    const steps = SCALE_STEPS[selectedScale];
    const baseNote = 60; // C4
    for (const step of steps) {
      await audioEngine.playNote(baseNote + step);
      await new Promise(resolve => setTimeout(resolve, sustainDuration * 1000));
    }
  };

  const DirectionButton = ({ value, label }: { value: typeof direction; label: string }) => (
    <TouchableOpacity
      onPress={() => changeDirection(value)}
      style={[styles.toggleButton, direction === value && styles.toggleButtonActive]}
    >
      <Text style={[styles.toggleButtonText, direction === value && styles.toggleButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Learn Intervals" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Section title="Select Interval">
          <View style={styles.intervalsContainer}>
            {[
              [{ key: 'm2' as IntervalKey, label: 'Minor 2nd' }, { key: 'M2' as IntervalKey, label: 'Major 2nd' }],
              [{ key: 'm3' as IntervalKey, label: 'Minor 3rd' }, { key: 'M3' as IntervalKey, label: 'Major 3rd' }],
              [{ key: 'P4' as IntervalKey, label: 'Perfect 4th' }, { key: 'TT' as IntervalKey, label: 'Tritone' }, { key: 'P5' as IntervalKey, label: 'Perfect 5th' }],
              [{ key: 'm6' as IntervalKey, label: 'Minor 6th' }, { key: 'M6' as IntervalKey, label: 'Major 6th' }],
              [{ key: 'm7' as IntervalKey, label: 'Minor 7th' }, { key: 'M7' as IntervalKey, label: 'Major 7th' }],
              [{ key: 'P8' as IntervalKey, label: 'Octave' }],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.intervalRow}>
                {row.map(item => {
                  const isSelected = selectedInterval === item.key;
                  const isInScale = scaleIntervals[item.key];
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.intervalBtn, isSelected && styles.intervalBtnActive, !isSelected && isInScale && styles.intervalBtnHighlight]}
                      onPress={() => selectInterval(item.key)}
                    >
                      <Text style={[styles.intervalBtnText, isSelected && styles.intervalBtnTextActive, !isSelected && isInScale && styles.intervalBtnTextHighlight]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.scaleRow}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowScaleDropdown(true)}>
              <Text style={styles.dropdownText}>{SCALES[selectedScale].name}</Text>
              <FontAwesomeIcon icon={faChevronDown as any} size={12} color={colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playScaleBtn, selectedScale === 'custom' && styles.playScaleBtnDisabled]}
              onPress={playScale}
              disabled={selectedScale === 'custom'}
            >
              <FontAwesomeIcon icon={faPlay as any} size={12} color={selectedScale === 'custom' ? colors.gray600 : colors.gray300} />
              <Text style={[styles.playScaleText, selectedScale === 'custom' && styles.playScaleTextDisabled]}>Play Scale</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Card variant="highlighted" style={styles.exampleCard}>
          {currentExample ? (
            <>
              <Text style={styles.exampleTitle}>{currentExample.intervalName}</Text>
              <View style={styles.notesRow}>
                <TouchableOpacity onPress={toggleLockBaseNote} style={[styles.noteBox, lockedBaseNote && styles.noteBoxLocked]}>
                  {lockedBaseNote && <View style={styles.lockIconWrapper}><FontAwesomeIcon icon={faLock as any} size={12} color={colors.primary} /></View>}
                  <Text style={[styles.noteText, lockedBaseNote && styles.noteTextLocked]}>{currentExample.note1.name}</Text>
                </TouchableOpacity>
                <Text style={styles.arrow}>→</Text>
                <TouchableOpacity onPress={() => audioEngine.playNote(currentExample.note2.midi)} style={styles.noteBox}>
                  <Text style={styles.noteText}>{currentExample.note2.name}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.playbackControls}>
                <Button active={playbackMode === 'melodic'} onPress={() => changePlaybackMode('melodic')} size="sm">Melodic</Button>
                <Button active={playbackMode === 'harmonic'} onPress={() => changePlaybackMode('harmonic')} size="sm">Harmonic</Button>
                <Button variant="secondary" onPress={refresh} size="sm">New Example</Button>
              </View>
            </>
          ) : (
            <Text style={styles.placeholderText}>Select an interval to hear examples</Text>
          )}
        </Card>

        <View style={styles.settingsRow}>
          <Section title="Direction" style={styles.settingSection}>
            <View style={styles.toggleGroup}>
              <DirectionButton value="ascending" label="Asc" />
              <DirectionButton value="descending" label="Desc" />
              <DirectionButton value="both" label="Both" />
            </View>
          </Section>
          <Section title="Sustain" style={styles.settingSection}>
            <View style={styles.sliderContainer}>
              <Slider style={styles.slider} minimumValue={0.2} maximumValue={2} step={0.1} value={sustainDuration} onValueChange={setSustainDuration}
                minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.gray700} thumbTintColor={colors.gray300} />
              <Text style={styles.sliderValue}>{sustainDuration.toFixed(1)}s</Text>
            </View>
          </Section>
        </View>
      </ScrollView>

      <Modal visible={showScaleDropdown} transparent animationType="fade" onRequestClose={() => setShowScaleDropdown(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowScaleDropdown(false)}>
          <View style={styles.modalContent}>
            {SCALE_KEYS.map(key => (
              <TouchableOpacity key={key} style={styles.modalItem} onPress={() => { setSelectedScale(key); setShowScaleDropdown(false); }}>
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
  scaleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, backgroundColor: colors.gray800, borderRadius: borderRadius.md },
  dropdownText: { color: colors.gray200, fontSize: fontSize.md },
  playScaleBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, backgroundColor: colors.gray800, borderRadius: borderRadius.md },
  playScaleBtnDisabled: { opacity: 0.5 },
  playScaleText: { color: colors.gray300, fontSize: fontSize.sm },
  playScaleTextDisabled: { color: colors.gray600 },
  intervalsContainer: { gap: spacing.sm },
  intervalRow: { flexDirection: 'row', gap: spacing.sm },
  intervalBtn: { flex: 1, paddingVertical: spacing.sm + 2, backgroundColor: colors.gray800, borderRadius: borderRadius.md, alignItems: 'center' },
  intervalBtnActive: { backgroundColor: colors.primary },
  intervalBtnHighlight: { backgroundColor: colors.gray700 },
  intervalBtnText: { color: colors.gray500, fontSize: fontSize.sm },
  intervalBtnTextActive: { color: colors.text },
  intervalBtnTextHighlight: { color: colors.gray300 },
  exampleCard: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, height: 160 },
  exampleTitle: { fontSize: fontSize.xxl, color: colors.gray200, marginBottom: spacing.md },
  notesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  noteBox: { width: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  noteBoxLocked: { backgroundColor: colors.primaryDark + '30' },
  lockIconWrapper: { position: 'absolute', left: -18, top: 0, bottom: 0, justifyContent: 'center' },
  noteText: { fontSize: fontSize.xl, color: colors.gray400 },
  noteTextLocked: { color: colors.primary },
  arrow: { fontSize: fontSize.xl, color: colors.gray600, marginHorizontal: spacing.sm },
  playbackControls: { flexDirection: 'row', gap: spacing.sm },
  placeholderText: { color: colors.gray600 },
  settingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  settingSection: { flex: 1, minWidth: 150, marginBottom: 0 },
  toggleGroup: { flexDirection: 'row', gap: spacing.xs },
  toggleButton: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray700 },
  toggleButtonActive: { backgroundColor: colors.gray700 },
  toggleButtonText: { color: colors.gray500, fontSize: fontSize.sm },
  toggleButtonTextActive: { color: colors.gray200 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  slider: { flex: 1, height: 40 },
  sliderValue: { color: colors.gray400, fontSize: fontSize.sm, width: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.bgLighter, borderRadius: borderRadius.lg, padding: spacing.sm, minWidth: 200 },
  modalItem: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  modalItemText: { color: colors.gray400, fontSize: fontSize.md },
  modalItemTextActive: { color: colors.primary },
});
