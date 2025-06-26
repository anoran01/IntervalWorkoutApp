/// <reference types="@capacitor/background-runner" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.intervalworkout.app',
  appName: 'IntervalWorkoutApp',
  webDir: 'dist/client',
  plugins: {
    BackgroundRunner: {
      label: "com.intervalworkout.app.backgroundtimer",
      src: "runners/background-timer.js",
      event: "workoutTimer",
      repeat: false,
      interval: 1,
      autoStart: false,
    },
  },
};

export default config;
