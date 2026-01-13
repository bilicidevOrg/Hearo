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

export const DEFAULT_ENABLED_INTERVALS: EnabledIntervals = {
  'm2': false,
  'M2': true,
  'm3': false,
  'M3': true,
  'P4': true,
  'TT': false,
  'P5': true,
  'm6': false,
  'M6': true,
  'm7': false,
  'M7': true,
  'P8': true
};

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
