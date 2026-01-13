import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { Header, Button, Card, Section } from '../components';
import { INTERVALS, TRAINING_INTERVALS, generateIntervalQuestion, IntervalKey, IntervalQuestion } from '../core/theory/intervals';
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
  const [sustainDuration, setSustainDuration] = useState(1.5);
  const [playbackMode, setPlaybackMode] = useState<'melodic' | 'harmonic'>('melodic');
  const [lockedBaseNote, setLockedBaseNote] = useState<Note | null>(null);
  const [currentExample, setCurrentExample] = useState<IntervalQuestion | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

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
            <View style={styles.intervalRow}>
              {[{ key: 'm2' as IntervalKey, label: 'Minor 2nd' }, { key: 'M2' as IntervalKey, label: 'Major 2nd' }].map(item => (
                <TouchableOpacity key={item.key} style={[styles.intervalBtn, selectedInterval === item.key && styles.intervalBtnActive]} onPress={() => selectInterval(item.key)}>
                  <Text style={[styles.intervalBtnText, selectedInterval === item.key && styles.intervalBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              {[{ key: 'm3' as IntervalKey, label: 'Minor 3rd' }, { key: 'M3' as IntervalKey, label: 'Major 3rd' }].map(item => (
                <TouchableOpacity key={item.key} style={[styles.intervalBtn, selectedInterval === item.key && styles.intervalBtnActive]} onPress={() => selectInterval(item.key)}>
                  <Text style={[styles.intervalBtnText, selectedInterval === item.key && styles.intervalBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              {[{ key: 'P4' as IntervalKey, label: 'Perfect 4th' }, { key: 'TT' as IntervalKey, label: 'Tritone' }, { key: 'P5' as IntervalKey, label: 'Perfect 5th' }].map(item => (
                <TouchableOpacity key={item.key} style={[styles.intervalBtn, selectedInterval === item.key && styles.intervalBtnActive]} onPress={() => selectInterval(item.key)}>
                  <Text style={[styles.intervalBtnText, selectedInterval === item.key && styles.intervalBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              {[{ key: 'm6' as IntervalKey, label: 'Minor 6th' }, { key: 'M6' as IntervalKey, label: 'Major 6th' }].map(item => (
                <TouchableOpacity key={item.key} style={[styles.intervalBtn, selectedInterval === item.key && styles.intervalBtnActive]} onPress={() => selectInterval(item.key)}>
                  <Text style={[styles.intervalBtnText, selectedInterval === item.key && styles.intervalBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              {[{ key: 'm7' as IntervalKey, label: 'Minor 7th' }, { key: 'M7' as IntervalKey, label: 'Major 7th' }].map(item => (
                <TouchableOpacity key={item.key} style={[styles.intervalBtn, selectedInterval === item.key && styles.intervalBtnActive]} onPress={() => selectInterval(item.key)}>
                  <Text style={[styles.intervalBtnText, selectedInterval === item.key && styles.intervalBtnTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              <TouchableOpacity style={[styles.intervalBtn, selectedInterval === 'P8' && styles.intervalBtnActive]} onPress={() => selectInterval('P8')}>
                <Text style={[styles.intervalBtnText, selectedInterval === 'P8' && styles.intervalBtnTextActive]}>Octave</Text>
              </TouchableOpacity>
            </View>
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
              <Slider style={styles.slider} minimumValue={0.5} maximumValue={4} step={0.5} value={sustainDuration} onValueChange={setSustainDuration}
                minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.gray700} thumbTintColor={colors.gray300} />
              <Text style={styles.sliderValue}>{sustainDuration}s</Text>
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  intervalsContainer: { gap: spacing.sm },
  intervalRow: { flexDirection: 'row', gap: spacing.sm },
  intervalBtn: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: borderRadius.md, backgroundColor: colors.gray800, alignItems: 'center' },
  intervalBtnActive: { backgroundColor: colors.primary },
  intervalBtnText: { color: colors.gray500, fontSize: fontSize.sm },
  intervalBtnTextActive: { color: colors.text },
  exampleCard: { alignItems: 'center', marginBottom: spacing.lg, minHeight: 140 },
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
  settingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl },
  settingSection: { flex: 1, minWidth: 150, marginBottom: 0 },
  toggleGroup: { flexDirection: 'row', gap: spacing.xs },
  toggleButton: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray700 },
  toggleButtonActive: { backgroundColor: colors.gray700 },
  toggleButtonText: { color: colors.gray500, fontSize: fontSize.sm },
  toggleButtonTextActive: { color: colors.gray200 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  slider: { flex: 1, height: 40 },
  sliderValue: { color: colors.gray400, fontSize: fontSize.sm, width: 35 },
});
