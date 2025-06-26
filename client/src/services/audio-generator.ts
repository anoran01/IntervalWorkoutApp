import { Filesystem, Directory, Encoding, FileInfo } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { InsertTimer } from '../schema';
import { createMp3Encoder } from 'wasm-media-encoders';

interface TimerAudioConfig {
  timerId: string;
  duration: number; // in seconds
  name: string;
  audioInserts?: AudioInsert[];
}

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
   * Converts AudioBuffer to WAV file format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const bytesPerSample = 1; // 8-bit for smaller file size
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data to 8-bit unsigned PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        // Convert to 8-bit unsigned integer
        const intSample = Math.floor((sample + 1) * 127.5);
        view.setUint8(offset, intSample);
        offset += 1;
      }
    }
    
    return arrayBuffer;
  }

  /**
   * Converts AudioBuffer to MP3 file format using wasm-media-encoders
   */
  private async audioBufferToMp3(buffer: AudioBuffer): Promise<ArrayBuffer> {
    console.log('Converting to MP3 using wasm-media-encoders (VBR)…');

    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;

    // Create encoder instance & configure for VBR (quality 4 ≈ ~130 kbps @ 44.1k)
    const encoder = await createMp3Encoder();
    encoder.configure({
      sampleRate,
      channels: channels as 1 | 2,
      vbrQuality: 8, // 0 (best, largest) … 9.999 (worst, smallest)
    });

    const frameSize = 1152; // LAME processes 1152 PCM samples per frame
    const totalSamples = buffer.length;

    // Pre-grab channel data references
    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < channels; ch++) {
      channelData.push(buffer.getChannelData(ch));
    }

    const mp3Chunks: Uint8Array[] = [];

    for (let i = 0; i < totalSamples; i += frameSize) {
      // Slice per-channel PCM views for this frame
      const slice: Float32Array[] = [];
      for (let ch = 0; ch < channels; ch++) {
        slice.push(channelData[ch].subarray(i, Math.min(i + frameSize, totalSamples)));
      }

      const encoded = encoder.encode(slice);
      if (encoded.length) {
        // MUST copy before next encode/finalize call (encoder reuses buffer)
        mp3Chunks.push(new Uint8Array(encoded));
      }
    }

    const last = encoder.finalize();
    if (last.length) mp3Chunks.push(new Uint8Array(last));

    // Merge chunks into single ArrayBuffer
    const totalLength = mp3Chunks.reduce((len, c) => len + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('✅ MP3 conversion complete.');
    return merged.buffer;
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
   * Generates and saves a composite audio file for a timer
   */
  async generateTimerAudioFile(config: TimerAudioConfig): Promise<string> {
    try {
      // Create composite audio buffer with silence and inserted audio
      const buffer = await this.createCompositeBuffer(config.duration, config.audioInserts);
      
      // Convert to WAV
      const wavBuffer = this.audioBufferToWav(buffer);
      
      // Convert to base64
      const base64Data = this.arrayBufferToBase64(wavBuffer);
      
      // Generate filename
      const filename = `timer_${config.timerId}_${config.duration}s.wav`;
      const filepath = `timers/${filename}`;
      
      // Save to device storage
      await Filesystem.writeFile({
        path: filepath,
        data: base64Data,
        directory: Directory.Data,
      });
      
      console.log(`✅ Generated composite audio file: ${filepath} (${config.duration}s) with ${config.audioInserts?.length || 0} inserts`);
      
      // Return the path for NativeAudio
      if (Capacitor.getPlatform() === 'ios') {
        return `Documents/${filepath}`;
      } else if (Capacitor.getPlatform() === 'android') {
        return filepath;
      } else {
        return filepath;
      }
      
    } catch (error) {
      console.error('❌ Failed to generate composite audio file:', error);
      throw error;
    }
  }

  /**
   * Helper method to create common timer audio configurations
   */
  createTimerAudioConfig(timer: { id: string; duration: number; name: string; type?: string }): TimerAudioConfig {
    const audioInserts: AudioInsert[] = [];
    
    // Add halfway reminder if duration is long enough
    if (timer.duration > 30) {
      audioInserts.push({
        audioPath: '/audio/halfway.wav', // Adjust path as needed
        insertAtTime: Math.floor(timer.duration / 2)
      });
    }
    
    // Add 10-second warning
    if (timer.duration > 15) {
      audioInserts.push({
        audioPath: '/audio/ten-seconds.wav',
        insertAtTime: timer.duration - 10
      });
    }
    
    // Add verbal reminder at the beginning based on timer type
    if (timer.type === 'work') {
      audioInserts.push({
        audioPath: '/audio/work.wav',
        insertAtTime: 0
      });
    } else if (timer.type === 'rest' || timer.type === 'rest_between_cycles') {
      audioInserts.push({
        audioPath: '/audio/rest.wav',
        insertAtTime: 0
      });
    }
    
    return {
      timerId: timer.id,
      duration: timer.duration,
      name: timer.name,
      audioInserts
    };
  }

  /**
   * Generates audio files for all timers in a workout with audio cues
   */
  async generateWorkoutAudioFiles(
    timers: Array<{ id: string; duration: number; name: string; type?: string }>,
    soundSettings?: any
  ): Promise<Map<string, string>> {
    const audioFiles = new Map<string, string>();
    
    try {
      // Ensure the timers directory exists
      await this.ensureDirectoryExists('timers');
      
      // Generate audio file for each timer
      for (const timer of timers) {
        const config = this.createTimerAudioConfig(timer);
        
        // Customize based on sound settings
        if (soundSettings) {
          // Filter audio inserts based on user preferences
          config.audioInserts = config.audioInserts?.filter(insert => {
            if (insert.audioPath.includes('halfway') && !soundSettings.halfwayReminder) {
              return false;
            }
            if (insert.audioPath.includes('ten-seconds') && !soundSettings.tenSecondWarning) {
              return false;
            }
            if ((insert.audioPath.includes('work') || insert.audioPath.includes('rest')) && !soundSettings.verbalReminder) {
              return false;
            }
            return true;
          });
        }
        
        const filepath = await this.generateTimerAudioFile(config);
        audioFiles.set(timer.id, filepath);
      }
      
      console.log(`✅ Generated ${audioFiles.size} composite timer audio files`);
      return audioFiles;
      
    } catch (error) {
      console.error('❌ Failed to generate workout audio files:', error);
      throw error;
    }
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
   * Cleans up old timer audio files
   */
  async cleanupOldTimerFiles(): Promise<void> {
    try {
      const result = await Filesystem.readdir({
        path: 'timers',
        directory: Directory.Data,
      });
      
      for (const file of result.files) {
        if (file.name.startsWith('timer_') && file.name.endsWith('.wav')) {
          await Filesystem.deleteFile({
            path: `timers/${file.name}`,
            directory: Directory.Data,
          });
        }
      }
      
      console.log('✅ Cleaned up old timer audio files');
    } catch (error) {
      console.log('No old timer files to clean up or error cleaning:', error);
    }
  }

  /**
   * Cleanup method to close audio context
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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
   * Generates a single audio file for an entire workout sequence
   */
  async generateFullWorkoutAudioFile(
    timers: Array<InsertTimer>,
    soundSettings?: any,
    format: 'wav' | 'mp3' = 'wav'
  ): Promise<string> {
    try {
      // Calculate total workout duration
      const totalDuration = timers.reduce((sum, timer) => sum + timer.duration, 0);
      
      const audioInserts: AudioInsert[] = [];
      let currentTime = 0;
      
      // Build audio inserts for each timer in sequence
      for (let i = 0; i < timers.length; i++) {
        const timer = timers[i];
        const timerStartTime = currentTime;
        
        // Add verbal reminder at start of timer (if enabled)
        if (soundSettings?.verbalReminder) {
          if (timer.type === 'work') {
            audioInserts.push({
              audioPath: '/audio/work.wav',
              insertAtTime: timerStartTime
            });
          } else if (timer.type === 'rest' || timer.type === 'rest_between_cycles') {
            audioInserts.push({
              audioPath: '/audio/rest.wav',
              insertAtTime: timerStartTime
            });
          }
        }
        
        // Add halfway reminder (if timer is long enough and enabled)
        if (timer.duration > 30 && soundSettings?.halfwayReminder) {
          audioInserts.push({
            audioPath: '/audio/halfway.wav',
            insertAtTime: timerStartTime + Math.floor(timer.duration / 2)
          });
        }
        
        // Add 10-second warning (if timer is long enough and enabled)
        if (timer.duration > 15 && soundSettings?.tenSecondWarning) {
          audioInserts.push({
            audioPath: '/audio/ten-seconds.wav',
            insertAtTime: timerStartTime + timer.duration - 10
          });
        }
        
        // Add beep countdown (if enabled)
        if (soundSettings?.beepStart > 0) {
          let beepAudioFile = '/audio/beep500.wav'; // default to standard
          if (soundSettings?.beepTone === 'low') {
            beepAudioFile = '/audio/beep300.wav';
          } else if (soundSettings?.beepTone === 'high') {
            beepAudioFile = '/audio/beep700.wav';
          }
          const beepStartTime = Math.min(soundSettings.beepStart, timer.duration - 1);
          for (let beepTime = beepStartTime; beepTime > 0; beepTime--) {
            audioInserts.push({
              audioPath: beepAudioFile,
              insertAtTime: timerStartTime + timer.duration - beepTime
            });
          }
        }
        
        currentTime += timer.duration;
      }
      
      // Add completion sound at the very end
      audioInserts.push({
        audioPath: '/audio/done.wav',
        insertAtTime: totalDuration - 1
      });
      
      // Create the composite buffer
      console.log('Creating composite buffer...');
      const buffer = await this.createCompositeBuffer(totalDuration, audioInserts);
      console.log('✅ Composite buffer created.');
      
      // Convert and save
      let audioData: ArrayBuffer;
      if (format === 'mp3') {
        console.log('Converting to MP3...');
        audioData = await this.audioBufferToMp3(buffer);
        console.log('✅ Converted to MP3.');
      } else {
        audioData = this.audioBufferToWav(buffer);
      }
      const base64Data = this.arrayBufferToBase64(audioData);
      
      // Read the 'workouts/' directory to determine the next available workout audio file number
      await this.ensureDirectoryExists('workouts');
      const workoutsDir = await Filesystem.readdir({
        path: 'workouts',
        directory: Directory.Data,
      });
      // Count only files that match the pattern 'workout_{number}_full.wav'
      const pattern = new RegExp(`^workout_\\d+_full\\.${format}$`);
      const workoutFiles = workoutsDir.files?.filter(f => {
        const filename = typeof f === 'string' ? f : f.name;
        return pattern.test(filename);
      }) || [];

      let nextNumber = workoutFiles.length + 1;
      console.log('nextNumber: ', nextNumber);
      let filename = `workout_${nextNumber}_full.${format}`;
      let filepath = `workouts/${filename}`;
      console.log('filepath before pathcheck: ', filepath);
      filepath = await this.pathCheck(filepath, nextNumber, format);
      console.log('filepath: ', filepath);
      
      await this.ensureDirectoryExists('workouts');
      await Filesystem.writeFile({
        path: filepath,
        data: base64Data,
        directory: Directory.Data,
      });
      
      console.log(`✅ Generated full workout audio: ${filepath} (${totalDuration}s)`);
      const { uri } = await Filesystem.getUri({
        path: filepath,
        directory: Directory.Data,
      });
      console.log('uri: ', uri);
      return uri;

    } catch (error: any) {
      console.error('❌ Failed to generate full workout audio:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
      throw error;
    }
  }
}

export const audioGeneratorService = new AudioGeneratorService();