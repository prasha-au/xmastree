import type pigpioTypes from 'pigpio';

const pigpio = require('pigpio-mock') as typeof pigpioTypes;


const WAVE_ACTION_INTERVAL = 1000;


type WaveStepAction = Omit<pigpioTypes.GenericWaveStep, 'usDelay'>;


export function basicPwm(brightness: number, windowUs: number): Record<number, WaveStepAction> {
  const offTime = Math.round(windowUs * (brightness / 100));
  return {
    0: { gpioOn: 1, gpioOff: 0 },
    [offTime]: { gpioOn: 0, gpioOff: 1 },
  };
}



export function transitionBrightness(from: number, to: number, duration: number): Record<number, boolean> {
  const values: Record<number, boolean> = {};
  const numStages = Math.floor((duration * 1000) / WAVE_ACTION_INTERVAL);
  const brightnessRange = to - from;
  const brightnessPerStage = brightnessRange / WAVE_ACTION_INTERVAL;
  for (let stage = 0; stage < numStages; stage++) {
    const brightnessAtStage = from + (brightnessPerStage * stage);
    const pwmTime = Math.round(WAVE_ACTION_INTERVAL * (brightnessAtStage /100));
    values[stage * WAVE_ACTION_INTERVAL] = true;
    values[stage * WAVE_ACTION_INTERVAL + pwmTime] = false;
  }
  return values;
}


