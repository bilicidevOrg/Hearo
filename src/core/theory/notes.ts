/**
 * Core note/pitch utilities
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

export const MIN_MIDI = 48;
export const MAX_MIDI = 83;

export interface Note {
  midi: number;
  name: string;
  sampleName: string;
}

export function midiToFrequency(midiNote: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI) / 12);
}

export function midiToNoteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return NOTE_NAMES[noteIndex] + octave;
}

export function midiToSampleName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  const noteName = NOTE_NAMES[noteIndex].replace('#', 's');
  return noteName + octave;
}

export function isInRange(midiNote: number, min = MIN_MIDI, max = MAX_MIDI): boolean {
  return midiNote >= min && midiNote <= max;
}

export function generateNoteRange(minMidi = MIN_MIDI, maxMidi = MAX_MIDI): Note[] {
  const notes: Note[] = [];
  for (let midi = minMidi; midi <= maxMidi; midi++) {
    notes.push({
      midi,
      name: midiToNoteName(midi),
      sampleName: midiToSampleName(midi)
    });
  }
  return notes;
}

export const PLAYABLE_NOTES = generateNoteRange();
