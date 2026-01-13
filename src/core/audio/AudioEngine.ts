/**
 * AudioEngine - Manages sound loading and playback
 */

import { Audio, AVPlaybackSource } from 'expo-av';
import { Audio as ExpoAudio } from 'expo-av';
import { PIANO_SOUNDS } from './sounds';
import { midiToSampleName } from '../theory/notes';

type SoundMap = Record<string, ExpoAudio.Sound>;

class AudioEngine {
  private sounds: SoundMap = {};
  private isLoaded = false;
  private sustainDuration = 1.5;

  async init(): Promise<boolean> {
    if (this.isLoaded) return true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const entries = Object.entries(PIANO_SOUNDS);
      const loadPromises = entries.map(async ([name, file]) => {
        const { sound } = await Audio.Sound.createAsync(file as AVPlaybackSource);
        return [name, sound] as const;
      });

      const results = await Promise.all(loadPromises);
      results.forEach(([name, sound]) => {
        this.sounds[name] = sound;
      });

      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('AudioEngine init error:', error);
      return false;
    }
  }

  setSustainDuration(duration: number): void {
    this.sustainDuration = duration;
  }

  async playNote(midiNote: number): Promise<void> {
    if (!this.isLoaded) return;

    const sampleName = midiToSampleName(midiNote);
    const sound = this.sounds[sampleName];

    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.error('Play error:', error);
      }
    }
  }

  async playInterval(midi1: number, midi2: number, mode = 'melodic'): Promise<void> {
    if (mode === 'harmonic') {
      await Promise.all([
        this.playNote(midi1),
        this.playNote(midi2)
      ]);
    } else {
      await this.playNote(midi1);
      setTimeout(() => this.playNote(midi2), this.sustainDuration * 600);
    }
  }

  cleanup(): void {
    Object.values(this.sounds).forEach(sound => {
      sound.unloadAsync();
    });
    this.sounds = {};
    this.isLoaded = false;
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;
