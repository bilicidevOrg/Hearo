import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRotateRight, faLock } from '@fortawesome/free-solid-svg-icons';
import { Header, Button } from '../components';
import { INTERVALS, generateIntervalQuestion, EnabledIntervals, IntervalKey, IntervalQuestion } from '../core/theory/intervals';
import { Note } from '../core/theory/notes';
import audioEngine from '../core/audio/AudioEngine';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type RootStackParamList = {
  IntervalQuiz: { intervals: EnabledIntervals; direction: 'ascending' | 'descending' | 'both'; sustainDuration: number };
};

interface Props {
  route: RouteProp<RootStackParamList, 'IntervalQuiz'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'IntervalQuiz'>;
}

export function IntervalQuizScreen({ route, navigation }: Props) {
  const { intervals: enabledIntervals, direction, sustainDuration } = route.params;

  const [question, setQuestion] = useState<IntervalQuestion | null>(null);
  const [playbackMode, setPlaybackMode] = useState<'melodic' | 'harmonic'>('melodic');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lockedBaseNote, setLockedBaseNote] = useState<Note | null>(null);
  const [highlightedInterval, setHighlightedInterval] = useState<IntervalKey | 'root' | null>(null);
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const initRef = useRef(false);

  const intervalKeys = (Object.keys(enabledIntervals) as IntervalKey[]).filter(k => enabledIntervals[k]);

  // Interval groups for display
  const intervalGroups: { key: IntervalKey; label: string }[][] = [
    [{ key: 'm2', label: 'Minor 2nd' }, { key: 'M2', label: 'Major 2nd' }],
    [{ key: 'm3', label: 'Minor 3rd' }, { key: 'M3', label: 'Major 3rd' }],
    [{ key: 'P4', label: 'Perfect 4th' }, { key: 'TT', label: 'Tritone' }, { key: 'P5', label: 'Perfect 5th' }],
    [{ key: 'm6', label: 'Minor 6th' }, { key: 'M6', label: 'Major 6th' }],
    [{ key: 'm7', label: 'Minor 7th' }, { key: 'M7', label: 'Major 7th' }],
    [{ key: 'P8', label: 'Octave' }],
  ];

  const generateNewQuestion = useCallback(() => {
    const q = generateIntervalQuestion(enabledIntervals, direction, lockedBaseNote);
    setQuestion(q);
    setIsAnswered(false);
    setSelectedAnswer(null);
    if (q && isReady) {
      setTimeout(() => audioEngine.playInterval(q.note1.midi, q.note2.midi, playbackMode), 400);
    }
  }, [enabledIntervals, direction, isReady, playbackMode, lockedBaseNote]);

  const toggleLockBaseNote = useCallback(() => {
    if (!question) return;
    if (lockedBaseNote?.midi === question.note1.midi) {
      setLockedBaseNote(null);
    } else {
      setLockedBaseNote(question.note1);
    }
  }, [question, lockedBaseNote]);

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

  useEffect(() => {
    if (isReady && !question) generateNewQuestion();
  }, [isReady, question, generateNewQuestion]);

  const replay = useCallback(() => {
    if (!question) return;
    audioEngine.playInterval(question.note1.midi, question.note2.midi, playbackMode);
  }, [question, playbackMode]);

  const handleAnswer = useCallback((intervalKey: string) => {
    if (!question || isAnswered) return;
    const isCorrect = intervalKey === question.intervalKey;
    setSelectedAnswer(intervalKey);
    setIsAnswered(true);
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  }, [question, isAnswered]);

  const playIntervalFromBase = useCallback((intervalKey: IntervalKey) => {
    if (!question || !isAnswered) return;
    const interval = INTERVALS[intervalKey];
    const targetMidi = question.ascending
      ? question.note1.midi + interval.semitones
      : question.note1.midi - interval.semitones;
    audioEngine.playInterval(question.note1.midi, targetMidi, playbackMode);
  }, [question, isAnswered, playbackMode]);

  const changeMode = (mode: 'melodic' | 'harmonic') => {
    setPlaybackMode(mode);
    if (question) setTimeout(() => audioEngine.playInterval(question.note1.midi, question.note2.midi, mode), 100);
  };

  const playScale = useCallback(async () => {
    if (!question || isPlayingScale) return;

    // Get sorted enabled intervals by semitones
    const sortedIntervals = intervalKeys
      .map(key => ({ key, semitones: INTERVALS[key].semitones }))
      .sort((a, b) => a.semitones - b.semitones);

    const delayMs = sustainDuration * 600;
    setIsPlayingScale(true);

    // Play root first
    setHighlightedInterval('root');
    await audioEngine.playNote(question.note1.midi);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Play each interval
    for (const { key } of sortedIntervals) {
      setHighlightedInterval(key);
      const targetMidi = question.ascending
        ? question.note1.midi + INTERVALS[key].semitones
        : question.note1.midi - INTERVALS[key].semitones;
      await audioEngine.playNote(targetMidi);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    setHighlightedInterval(null);
    setIsPlayingScale(false);
  }, [question, isPlayingScale, intervalKeys, sustainDuration]);

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const getButtonVariant = (key: string, isEnabled: boolean) => {
    if (!isAnswered) return isEnabled ? null : styles.answerMuted;
    if (key === question?.intervalKey) return styles.answerCorrect;
    if (key === selectedAnswer) return styles.answerWrong;
    return isEnabled ? styles.answerDisabled : styles.answerMuted;
  };

  const getTextVariant = (key: string, isEnabled: boolean) => {
    if (!isAnswered) return isEnabled ? null : styles.answerTextMuted;
    if (key === question?.intervalKey) return styles.answerTextCorrect;
    if (key === selectedAnswer) return styles.answerTextWrong;
    return isEnabled ? null : styles.answerTextMuted;
  };

  const isHighlighted = (key: string) => highlightedInterval === key;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Interval Quiz" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.score}>{score.correct}/{score.total} <Text style={styles.percentage}>{percentage}%</Text></Text>

        {question && (
          <View style={styles.questionArea}>
            <View style={styles.notesDisplay}>
              <TouchableOpacity
                onPress={() => audioEngine.playNote(question.note1.midi)}
                onLongPress={toggleLockBaseNote}
                delayLongPress={300}
                style={[styles.noteBox, lockedBaseNote && styles.noteBoxLocked, highlightedInterval === 'root' && styles.noteBoxHighlighted]}
              >
                {lockedBaseNote && <View style={styles.lockIconWrapper}><FontAwesomeIcon icon={faLock as any} size={14} color={colors.primary} /></View>}
                <Text style={[styles.noteName, lockedBaseNote && styles.noteNameLocked, highlightedInterval === 'root' && styles.noteNameHighlighted]}>{question.note1.name}</Text>
              </TouchableOpacity>
              <Text style={styles.arrow}>→</Text>
              <TouchableOpacity onPress={() => audioEngine.playNote(question.note2.midi)} style={styles.noteBox}>
                <Text style={styles.noteName}>{isAnswered ? question.note2.name : '?'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.intervalResult}>{isAnswered ? question.intervalName : ' '}</Text>
          </View>
        )}

        <View style={styles.bottomSection}>
          <View style={styles.playbackControls}>
            <Button active={playbackMode === 'melodic'} onPress={() => changeMode('melodic')} size="sm">Melodic</Button>
            <Button active={playbackMode === 'harmonic'} onPress={() => changeMode('harmonic')} size="sm">Harmonic</Button>
            <Button variant="secondary" onPress={replay} size="sm">
              <FontAwesomeIcon icon={faRotateRight as any} size={14} color={colors.gray400} />
            </Button>
          </View>

          <View style={styles.answersContainer}>
            {intervalGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.answerRow}>
                {group.map(item => {
                  const isEnabled = enabledIntervals[item.key];
                  const canClick = isEnabled || isAnswered;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.answerButton, getButtonVariant(item.key, isEnabled), isHighlighted(item.key) && styles.answerHighlighted]}
                      onPress={() => canClick && (isAnswered ? playIntervalFromBase(item.key) : handleAnswer(item.key))}
                      activeOpacity={canClick ? 0.7 : 1}
                    >
                      <Text style={[styles.answerButtonText, getTextVariant(item.key, isEnabled)]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.nextContainer}>
            {isAnswered && (
              <>
                <Button variant="secondary" onPress={playScale} disabled={isPlayingScale}>
                  Play Scale
                </Button>
                <Button size="lg" onPress={generateNewQuestion}>Next</Button>
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg },
  score: { fontSize: fontSize.sm, color: colors.gray500, textAlign: 'right' },
  percentage: { color: colors.gray600 },
  questionArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notesDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  noteBox: { width: 100, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  noteBoxLocked: { backgroundColor: colors.primaryDark + '30' },
  noteBoxHighlighted: { backgroundColor: colors.primary + '40' },
  noteNameHighlighted: { color: colors.primary },
  lockIconWrapper: { position: 'absolute', left: -22, top: 0, bottom: 0, justifyContent: 'center' },
  noteName: { fontSize: 48, color: colors.gray200, fontWeight: '300' },
  noteNameLocked: { color: colors.primary },
  arrow: { fontSize: fontSize.xxl, color: colors.gray600, marginHorizontal: spacing.md },
  intervalResult: { fontSize: fontSize.lg, color: colors.primary, height: 24 },
  bottomSection: {},
  playbackControls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  answersContainer: { gap: spacing.sm, marginBottom: spacing.md },
  answerRow: { flexDirection: 'row', gap: spacing.sm },
  answerButton: { flex: 1, paddingVertical: spacing.sm + 2, backgroundColor: colors.gray700, borderRadius: borderRadius.md, alignItems: 'center' },
  answerCorrect: { backgroundColor: colors.successBg },
  answerWrong: { backgroundColor: colors.errorBg },
  answerDisabled: { backgroundColor: colors.gray800 },
  answerMuted: { backgroundColor: colors.gray800, opacity: 0.4 },
  answerButtonText: { color: colors.gray200, fontSize: fontSize.sm },
  answerTextCorrect: { color: colors.success },
  answerTextWrong: { color: colors.error },
  answerTextMuted: { color: colors.gray600 },
  answerHighlighted: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 8 },
  nextContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, height: 56 },
});
