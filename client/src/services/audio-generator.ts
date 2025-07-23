import { Filesystem, Directory } from '@capacitor/filesystem';
import { InsertTimer } from '../schema';
import { createMp3Encoder } from 'wasm-media-encoders';

interface AudioInsert {
  audioPath: string; // Path to existing .wav file
  insertAtTime: number; // Time in seconds to insert the audio
}

export class AudioGeneratorService {
  private audioContext: AudioContext | null = null;

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      // Use a lower sample rate for speech-quality audio. 8000Hz is standard for telephony.
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100});
    }
    return this.audioContext;
  }

  /**
   * Loads and decodes an existing audio file
   */
  private async loadAudioFile(audioPath: string): Promise<AudioBuffer> {
    const audioContext = this.initAudioContext();
    
    try {
      const response = await fetch(audioPath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`✅ Loaded audio file: ${audioPath} (${audioBuffer.duration}s)`);
      return audioBuffer;
    } catch (error) {
      console.error(`❌ Failed to load audio file: ${audioPath}`, error);
      throw error;
    }
  }

  /**
   * Creates a composite audio buffer with silence and inserted audio clips
   */
  private async createCompositeBuffer(duration: number, audioInserts: AudioInsert[] = []): Promise<AudioBuffer> {
    const audioContext = this.initAudioContext();
    const sampleRate = audioContext.sampleRate;
    const channels = 1; // Use mono for smaller file size
    const frameCount = sampleRate * duration;
    
    // Create the main buffer filled with silence
    const buffer = audioContext.createBuffer(channels, frameCount, sampleRate);
    
    // Fill with silence initially
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = 0;
      }
    }
    
    // Insert audio clips at specified times
    for (const insert of audioInserts) {
      try {
        const audioBuffer = await this.loadAudioFile(insert.audioPath);
        const insertStartFrame = Math.floor(insert.insertAtTime * sampleRate);
        const insertEndFrame = Math.min(
          insertStartFrame + audioBuffer.length,
          frameCount
        );
        
        // Copy audio data to the main buffer
        if (audioBuffer.numberOfChannels > 1 && channels === 1) {
          console.warn(`Down-mixing audio from ${audioBuffer.numberOfChannels} to 1 channel: ${insert.audioPath}`);
          const mainChannelData = buffer.getChannelData(0);
          // Simple down-mixing by averaging channels
          for (let i = insertStartFrame; i < insertEndFrame; i++) {
            const sourceIndex = i - insertStartFrame;
            if (sourceIndex < audioBuffer.length) {
              let mixedSample = 0;
              for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                mixedSample += audioBuffer.getChannelData(ch)[sourceIndex];
              }
              mainChannelData[i] = mixedSample / audioBuffer.numberOfChannels;
            }
          }
        } else if (audioBuffer.numberOfChannels === 1 && channels === 1) {
            // Standard mono to mono copy
            const mainChannelData = buffer.getChannelData(0);
            const insertChannelData = audioBuffer.getChannelData(0);
            for (let i = insertStartFrame; i < insertEndFrame; i++) {
                const sourceIndex = i - insertStartFrame;
                if (sourceIndex < audioBuffer.length) {
                    mainChannelData[i] = insertChannelData[sourceIndex];
                }
            }
        }
        
        console.log(`✅ Inserted audio at ${insert.insertAtTime}s: ${insert.audioPath}`);
        
      } catch (error) {
        console.error(`❌ Failed to insert audio: ${insert.audioPath}`, error);
        // Continue with other inserts even if one fails
      }
    }
    
    return buffer;
  }

  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Ensures a directory exists
   */
  private async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      console.log(`Directory ${path} already exists or created`);
    }
  }

  /**
   * Checks if a file exists and if it does, increments the number and returns the new filepath
   * @param filepath - the filepath to check
   * @param nextNumber - the next number to check
   */
  async pathCheck(filepath: string, nextNumber: number, format: 'wav' | 'mp3'): Promise<string> {
    try {
      await Filesystem.stat({
        path: filepath,
        directory: Directory.Data,
      });
      // If stat succeeds, file exists, so increment and recurse
      nextNumber = nextNumber + 1;
      filepath = `workouts/workout_${nextNumber}_full.${format}`;
      console.log('filepath in pathcheck still in recursion: ', filepath);
      return this.pathCheck(filepath, nextNumber, format);
    } catch (error: any) {
      // If stat fails, file does not exist, so return this filepath
      // Optionally, you can check error.code === 'ENOENT' or similar if needed
      console.log('filepath in final pathcheck: ', filepath);
      return filepath;
    }
  }

  /**
   * Builds the list of audio inserts that should play **within** a single timer.
   * All insertAtTime values are relative to the start (0 s) of that timer.
   */
  private buildAudioInsertsForTimer(
    timer: InsertTimer,
    soundSettings?: any
  ): AudioInsert[] {
    const audioInserts: AudioInsert[] = [];

    // Verbal reminder at the start
    if (soundSettings?.verbalReminder) {
      if (timer.type === 'work') {
        audioInserts.push({ audioPath: '/audio/work_louder.wav', insertAtTime: 0 });
      } else if (timer.type === 'rest' || timer.type === 'rest_between_cycles') {
        audioInserts.push({ audioPath: '/audio/rest_louder.wav', insertAtTime: 0 });
      }
    }

    // Half-way reminder
    if (timer.duration >= 15 && soundSettings?.halfwayReminder) {
      audioInserts.push({
        audioPath: '/audio/halfway_louder.wav',
        insertAtTime: Math.floor(timer.duration / 2),
      });
    }

    // 10-second warning
    if (timer.duration >= 15 && soundSettings?.tenSecondWarning) {
      audioInserts.push({
        audioPath: '/audio/ten-seconds_louder.wav',
        insertAtTime: timer.duration - 10,
      });
    }

    // Beep countdown before timer finishes
    if (soundSettings?.beepStart > 0) {
      let beepAudioFile = '/audio/beep500.wav'; // default
      if (soundSettings?.beepTone === 'low_pitch') beepAudioFile = '/audio/beep300.wav';
      else if (soundSettings?.beepTone === 'high_pitch') beepAudioFile = '/audio/beep700.wav';

      const beepStartTime = Math.min(soundSettings.beepStart, timer.duration - 1);
      for (let bt = beepStartTime; bt > 0; bt--) {
        audioInserts.push({
          audioPath: beepAudioFile,
          insertAtTime: timer.duration - bt,
        });
      }
    }

    return audioInserts;
  }

  /**
   * Generates a single audio file for an entire workout sequence
   */
  async generateFullWorkoutAudioFile(
    timers: Array<InsertTimer>,
    soundSettings?: any,
    format: 'wav' | 'mp3' = 'wav'
  ): Promise<string> {
    // New streaming path when MP3 is requested
    try {
      // Prepare MP3 encoder once
      const encoder = await createMp3Encoder();
      encoder.configure({
        sampleRate: 44100,
        channels: 1,
        vbrQuality: 8,
      });

      const mp3Chunks: Uint8Array[] = [];
      const frameSize = 1152;

      // Encode each timer individually
      for (const timer of timers) {
        const inserts = this.buildAudioInsertsForTimer(timer, soundSettings);
        const buffer = await this.createCompositeBuffer(timer.duration, inserts);

        const totalSamples = buffer.length;
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < totalSamples; i += frameSize) {
          const slice = channelData.subarray(i, Math.min(i + frameSize, totalSamples));
          const encoded = encoder.encode([slice]);
          if (encoded.length) mp3Chunks.push(new Uint8Array(encoded));
        }

        // Yield to the event loop to keep UI responsive
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }

      // Add the final "done" cue (1 s buffer)
      const doneBuffer = await this.createCompositeBuffer(1, [
        { audioPath: '/audio/done_louder.wav', insertAtTime: 0 },
      ]);
      const doneSamples = doneBuffer.length;
      const doneChannelData = doneBuffer.getChannelData(0);
      for (let i = 0; i < doneSamples; i += frameSize) {
        const slice = doneChannelData.subarray(i, Math.min(i + frameSize, doneSamples));
        const encoded = encoder.encode([slice]);
        if (encoded.length) mp3Chunks.push(new Uint8Array(encoded));
      }

      // Finalise encoder
      const last = encoder.finalize();
      if (last.length) mp3Chunks.push(new Uint8Array(last));

      // Merge chunks
      const totalLength = mp3Chunks.reduce((len, c) => len + c.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of mp3Chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const base64Data = this.arrayBufferToBase64(merged.buffer);

      // Determine filename / path
      await this.ensureDirectoryExists('workouts');
      const workoutsDir = await Filesystem.readdir({ path: 'workouts', directory: Directory.Data });
      const pattern = /^workout_\d+_full\.mp3$/;
      const workoutFiles =
        workoutsDir.files?.filter((f) => {
          const filename = typeof f === 'string' ? f : f.name;
          return pattern.test(filename);
        }) || [];

      let nextNumber = workoutFiles.length + 1;
      let filename = `workout_${nextNumber}_full.mp3`;
      let filepath = `workouts/${filename}`;
      filepath = await this.pathCheck(filepath, nextNumber, 'mp3');

      await Filesystem.writeFile({ path: filepath, data: base64Data, directory: Directory.Data });

      console.log(`✅ Generated full workout MP3: ${filepath}`);
      const { uri } = await Filesystem.getUri({ path: filepath, directory: Directory.Data });
      return uri;
    } catch (error: any) {
      console.error('❌ Failed to generate full workout MP3 (streaming):', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
      throw error;
    }
  }
}

export const audioGeneratorService = new AudioGeneratorService();