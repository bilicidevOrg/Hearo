/**
 * Musical interval definitions and utilities
 */

import { midiToNoteName, isInRange, PLAYABLE_NOTES, Note } from './notes';

export interface Interval {
  name: string;
  semitones: number;
  abbrev: string;
}

export interface IntervalQuestion {
  note1: Note;
  note2: { midi: number; name: string };
  intervalKey: string;
  intervalName: string;
  ascending: boolean;
}

export type IntervalKey = 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export const INTERVALS: Record<IntervalKey, Interval> = {
  'm2': { name: 'Minor 2nd', semitones: 1, abbrev: 'm2' },
  'M2': { name: 'Major 2nd', semitones: 2, abbrev: 'M2' },
  'm3': { name: 'Minor 3rd', semitones: 3, abbrev: 'm3' },
  'M3': { name: 'Major 3rd', semitones: 4, abbrev: 'M3' },
  'P4': { name: 'Perfect 4th', semitones: 5, abbrev: 'P4' },
  'TT': { name: 'Tritone', semitones: 6, abbrev: 'TT' },
  'P5': { name: 'Perfect 5th', semitones: 7, abbrev: 'P5' },
  'm6': { name: 'Minor 6th', semitones: 8, abbrev: 'm6' },
  'M6': { name: 'Major 6th', semitones: 9, abbrev: 'M6' },
  'm7': { name: 'Minor 7th', semitones: 10, abbrev: 'm7' },
  'M7': { name: 'Major 7th', semitones: 11, abbrev: 'M7' },
  'P8': { name: 'Octave', semitones: 12, abbrev: 'P8' }
};

export const TRAINING_INTERVALS: IntervalKey[] = Object.keys(INTERVALS) as IntervalKey[];

export type EnabledIntervals = Record<IntervalKey, boolean>;

// Scale definitions - intervals that make up each scale
export type ScaleKey = 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'custom';

export interface Scale {
  name: string;
  intervals: IntervalKey[];
}

export const SCALES: Record<ScaleKey, Scale> = {
  'major': { name: 'Major', intervals: ['M2', 'M3', 'P4', 'P5', 'M6', 'M7', 'P8'] },
  'natural_minor': { name: 'Natural Minor', intervals: ['M2', 'm3', 'P4', 'P5', 'm6', 'm7', 'P8'] },
  'harmonic_minor': { name: 'Harmonic Minor', intervals: ['M2', 'm3', 'P4', 'P5', 'm6', 'M7', 'P8'] },
  'melodic_minor': { name: 'Melodic Minor', intervals: ['M2', 'm3', 'P4', 'P5', 'M6', 'M7', 'P8'] },
  'dorian': { name: 'Dorian', intervals: ['M2', 'm3', 'P4', 'P5', 'M6', 'm7', 'P8'] },
  'phrygian': { name: 'Phrygian', intervals: ['m2', 'm3', 'P4', 'P5', 'm6', 'm7', 'P8'] },
  'lydian': { name: 'Lydian', intervals: ['M2', 'M3', 'TT', 'P5', 'M6', 'M7', 'P8'] },
  'mixolydian': { name: 'Mixolydian', intervals: ['M2', 'M3', 'P4', 'P5', 'M6', 'm7', 'P8'] },
  'custom': { name: 'Custom', intervals: [] },
};

export const SCALE_KEYS: ScaleKey[] = ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian'];

export function getIntervalsForScale(scaleKey: ScaleKey): EnabledIntervals {
  const result: EnabledIntervals = {
    'm2': false, 'M2': false, 'm3': false, 'M3': false,
    'P4': false, 'TT': false, 'P5': false,
    'm6': false, 'M6': false, 'm7': false, 'M7': false, 'P8': false
  };
  if (scaleKey === 'custom') return result;
  SCALES[scaleKey].intervals.forEach(key => result[key] = true);
  return result;
}

export function findMatchingScale(intervals: EnabledIntervals): ScaleKey {
  for (const scaleKey of SCALE_KEYS) {
    const scaleIntervals = getIntervalsForScale(scaleKey);
    const match = TRAINING_INTERVALS.every(k => intervals[k] === scaleIntervals[k]);
    if (match) return scaleKey;
  }
  return 'custom';
}

// Scale step patterns (semitones from root)
export const SCALE_STEPS: Record<Exclude<ScaleKey, 'custom'>, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11, 12],
  'natural_minor': [0, 2, 3, 5, 7, 8, 10, 12],
  'harmonic_minor': [0, 2, 3, 5, 7, 8, 11, 12],
  'melodic_minor': [0, 2, 3, 5, 7, 9, 11, 12],
  'dorian': [0, 2, 3, 5, 7, 9, 10, 12],
  'phrygian': [0, 1, 3, 5, 7, 8, 10, 12],
  'lydian': [0, 2, 4, 6, 7, 9, 11, 12],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10, 12],
};

export const DEFAULT_ENABLED_INTERVALS: EnabledIntervals = getIntervalsForScale('major');

export function getValidBaseNotes(intervalKey: IntervalKey, ascending = true): Note[] {
  const interval = INTERVALS[intervalKey];
  if (!interval) return [];

  return PLAYABLE_NOTES.filter(note => {
    const targetMidi = ascending
      ? note.midi + interval.semitones
      : note.midi - interval.semitones;
    return isInRange(targetMidi);
  });
}

export function generateIntervalQuestion(
  enabledIntervals: EnabledIntervals,
  direction: 'ascending' | 'descending' | 'both' = 'ascending',
  lockedBaseNote: Note | null = null
): IntervalQuestion | null {
  const intervalKeys = (Object.keys(enabledIntervals) as IntervalKey[]).filter(k => enabledIntervals[k]);
  if (intervalKeys.length === 0) return null;

  const intervalKey = intervalKeys[Math.floor(Math.random() * intervalKeys.length)];
  const interval = INTERVALS[intervalKey];

  let ascending: boolean;
  if (direction === 'ascending') {
    ascending = true;
  } else if (direction === 'descending') {
    ascending = false;
  } else {
    ascending = Math.random() > 0.5;
  }

  let baseNote: Note | undefined;

  if (lockedBaseNote) {
    const targetMidi = ascending
      ? lockedBaseNote.midi + interval.semitones
      : lockedBaseNote.midi - interval.semitones;

    if (isInRange(targetMidi)) {
      baseNote = lockedBaseNote;
    }
  }

  if (!baseNote) {
    const validNotes = getValidBaseNotes(intervalKey, ascending);
    baseNote = validNotes[Math.floor(Math.random() * validNotes.length)];
  }

  if (!baseNote) return null;

  const targetMidi = ascending
    ? baseNote.midi + interval.semitones
    : baseNote.midi - interval.semitones;

  return {
    note1: baseNote,
    note2: {
      midi: targetMidi,
      name: midiToNoteName(targetMidi)
    },
    intervalKey,
    intervalName: interval.name,
    ascending
  };
}
