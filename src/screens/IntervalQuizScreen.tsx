import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Header, Button, Card } from '../components';
import { INTERVALS, generateIntervalQuestion, EnabledIntervals, IntervalKey, IntervalQuestion } from '../core/theory/intervals';
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
  const initRef = useRef(false);

  const intervalKeys = (Object.keys(enabledIntervals) as IntervalKey[]).filter(k => enabledIntervals[k]);

  const generateNewQuestion = useCallback(() => {
    const q = generateIntervalQuestion(enabledIntervals, direction);
    setQuestion(q);
    setIsAnswered(false);
    setSelectedAnswer(null);
    if (q && isReady) {
      setTimeout(() => audioEngine.playInterval(q.note1.midi, q.note2.midi, playbackMode), 400);
    }
  }, [enabledIntervals, direction, isReady, playbackMode]);

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

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const getButtonStyle = (key: string) => {
    if (!isAnswered) return styles.answerButton;
    if (key === question?.intervalKey) return [styles.answerButton, styles.answerCorrect];
    if (key === selectedAnswer) return [styles.answerButton, styles.answerWrong];
    return [styles.answerButton, styles.answerDisabled];
  };

  const getButtonTextStyle = (key: string) => {
    if (!isAnswered) return styles.answerButtonText;
    if (key === question?.intervalKey) return [styles.answerButtonText, styles.answerTextCorrect];
    return [styles.answerButtonText, styles.answerTextDisabled];
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Interval Quiz" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{score.correct} / {score.total}</Text>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>

        {question && (
          <Card variant="highlighted" style={styles.questionCard}>
            <View style={styles.notesDisplay}>
              <TouchableOpacity onPress={() => audioEngine.playNote(question.note1.midi)}>
                <Text style={styles.noteName}>{question.note1.name}</Text>
              </TouchableOpacity>
              <Text style={styles.arrow}>→</Text>
              <TouchableOpacity onPress={() => audioEngine.playNote(question.note2.midi)} disabled={!isAnswered}>
                <Text style={styles.noteName}>{isAnswered ? question.note2.name : '?'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.intervalName, !isAnswered && styles.hidden]}>{question.intervalName}</Text>
            <View style={styles.playbackControls}>
              <Button active={playbackMode === 'melodic'} onPress={() => changeMode('melodic')} size="sm">Melodic</Button>
              <Button active={playbackMode === 'harmonic'} onPress={() => changeMode('harmonic')} size="sm">Harmonic</Button>
              <Button variant="secondary" onPress={replay} size="sm">
                <FontAwesomeIcon icon={faRotateRight as any} size={14} color={colors.gray400} />
              </Button>
            </View>
          </Card>
        )}

        <View style={styles.answersGrid}>
          {intervalKeys.map((key) => (
            <TouchableOpacity
              key={key}
              style={getButtonStyle(key)}
              onPress={() => isAnswered ? playIntervalFromBase(key) : handleAnswer(key)}
              activeOpacity={0.7}
            >
              <Text style={getButtonTextStyle(key)}>{INTERVALS[key].name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.nextContainer}>
          {isAnswered && <Button size="lg" onPress={generateNewQuestion}>Next</Button>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg },
  scoreContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
  score: { fontSize: fontSize.xxl, color: colors.gray300 },
  percentage: { fontSize: fontSize.lg, color: colors.gray500 },
  questionCard: { alignItems: 'center', marginBottom: spacing.lg },
  notesDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  noteName: { fontSize: fontSize.xl, color: colors.gray300 },
  arrow: { fontSize: fontSize.xl, color: colors.gray500, marginHorizontal: spacing.sm },
  intervalName: { fontSize: fontSize.lg, color: colors.gray400, marginBottom: spacing.md, height: 24 },
  hidden: { color: 'transparent' },
  playbackControls: { flexDirection: 'row', gap: spacing.sm },
  answersGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  answerButton: { minWidth: 110, paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.gray700, borderRadius: borderRadius.md, alignItems: 'center' },
  answerCorrect: { backgroundColor: colors.successBg },
  answerWrong: { backgroundColor: colors.errorBg },
  answerDisabled: { backgroundColor: colors.gray800 },
  answerButtonText: { color: colors.gray200, fontSize: fontSize.md },
  answerTextCorrect: { color: colors.success },
  answerTextDisabled: { color: colors.gray600 },
  nextContainer: { alignItems: 'center', height: 56 },
});
