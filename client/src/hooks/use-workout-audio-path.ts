import { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getWorkoutAudioRelativePath } from '@/lib/workout-utils';

export function useWorkoutAudioPath(filePath: string): string | null {
  const [audioPath, setAudioPath] = useState<string | null>(null);

  useEffect(() => {
    async function resolveAudioPath() {
      if (!filePath) {
        setAudioPath(null);
        return;
      }
      
      try {
        // Get the Documents directory URI
        const { uri: documentsUri } = await Filesystem.getUri({
          directory: Directory.Data,
          path: '',
        });
        
        // Extract the last two levels from workout.filePath
        const relativePath = getWorkoutAudioRelativePath(filePath);
        
        // Compose the full path
        // Remove trailing slash from documentsUri if present
        const baseUri = documentsUri.replace(/\/$/, '');
        const fullPath = `${baseUri}${relativePath}`;
        
        setAudioPath(fullPath);
        console.log('Resolved AUDIO_PATH: ', fullPath);
        
      } catch (error) {
        console.error("Error resolving audio path:", error);
        setAudioPath(null);
      }
    }
    
    resolveAudioPath();
    
  }, [filePath]);

  return audioPath;
}
