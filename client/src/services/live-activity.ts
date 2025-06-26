import { LiveActivity } from 'capacitor-live-activity';

export interface WorkoutTimerAttributes {
  workoutName: string;
}

export interface WorkoutTimerContentState {
  currentTimerName: string;
  currentTimerDuration: number;
  currentTimerTimeRemaining: number;
  nextTimerName: string | null;
  timerType: 'work' | 'rest' | 'prepare' | 'rest_between_cycles';
  isRunning: boolean;
  progress: number; // 0-1 representing completion percentage
}

export interface StartActivityOptions {
  id: string;
  attributes: WorkoutTimerAttributes;
  contentState: WorkoutTimerContentState;
}

export interface UpdateActivityOptions {
  id: string;
  contentState: WorkoutTimerContentState;
}

export interface EndActivityOptions {
  id: string;
  contentState?: {
    message: string;
  };
}

// Conversion functions
function convertAttributesToRecord(attributes: WorkoutTimerAttributes): Record<string, string> {
    return {
      workoutName: attributes.workoutName,
    };
  }
  
function convertContentStateToRecord(contentState: WorkoutTimerContentState): Record<string, string> {
    return {
        currentTimerName: contentState.currentTimerName,
        currentTimerDuration: contentState.currentTimerDuration.toString(),
        currentTimerTimeRemaining: contentState.currentTimerTimeRemaining.toString(),
        nextTimerName: contentState.nextTimerName || '',
        timerType: contentState.timerType,
        isRunning: contentState.isRunning.toString(),
        progress: contentState.progress.toString(),
    };
}

// function convertEndContentStateToRecord() shouldn't be necessary becuase ContentState is already a key, string value format

class LiveActivityService {
  private currentActivityId: string | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      return await LiveActivity.isAvailable();
    } catch (error) {
      console.error('Error checking Live Activity availability:', error);
      return false;
    }
  }

  async startActivity(options: StartActivityOptions): Promise<boolean> {
    try {
      // Check if Live Activities are available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.log('Live Activities not available');
        return false;
      }

      await LiveActivity.startActivity({
        id: options.id,
        attributes: convertAttributesToRecord(options.attributes),
        contentState: convertContentStateToRecord(options.contentState),
      });

      this.currentActivityId = options.id;
      console.log('Live Activity started with ID:', options.id);
      return true;
    } catch (error) {
      console.error('Error starting Live Activity:', error);
      return false;
    }
  }

  async updateActivity(options: UpdateActivityOptions): Promise<boolean> {
    try {
      if (!this.currentActivityId) {
        console.warn('No active Live Activity to update');
        return false;
      }

      const isRunning = await this.isRunning();
      if (!isRunning) {
        console.warn('Live Activity is not running');
        return false;
      }

      await LiveActivity.updateActivity({
        id: options.id,
        contentState: convertContentStateToRecord(options.contentState),
      });

      return true;
    } catch (error) {
      console.error('Error updating Live Activity:', error);
      return false;
    }
  }

  async endActivity(options?: EndActivityOptions): Promise<boolean> {
    try {
      if (!this.currentActivityId) {
        console.warn('No active Live Activity to end');
        return false;
      }

      const contentState: Record<string, string> = options?.contentState 
        ? { message: options.contentState.message }
        : {};

      await LiveActivity.endActivity({
        id: options?.id || this.currentActivityId,
        contentState,
      });

      this.currentActivityId = null;
      console.log('Live Activity ended');
      return true;
    } catch (error) {
      console.error('Error ending Live Activity:', error);
      return false;
    }
  }

  async isRunning(): Promise<boolean> {
    try {
      if (!this.currentActivityId) {
        return false;
      }

      return await LiveActivity.isRunning({
        id: this.currentActivityId,
      });
    } catch (error) {
      console.error('Error checking Live Activity status:', error);
      return false;
    }
  }

  getCurrentActivityId(): string | null {
    return this.currentActivityId;
  }

  // Handle button interactions from Live Activity
  async handleLiveActivityAction(action: string): Promise<void> {
    try {
      // This would be called when buttons in the Live Activity are pressed
      // The actual implementation would depend on how the plugin handles actions
      console.log('Live Activity action received:', action);
      
      // Emit custom events that the workout timer can listen to
      const event = new CustomEvent('liveActivityAction', {
        detail: { action }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error handling Live Activity action:', error);
    }
  }
}

export const liveActivityService = new LiveActivityService(); 