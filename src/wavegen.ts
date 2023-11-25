import type pigpioTypes from 'pigpio';

const WAVE_ACTION_INTERVAL = 5000;


interface SimpleWavePulse { delay: number; isOn: boolean;}


export function transitionBrightness(from: number, to: number, duration: number): SimpleWavePulse[] {
  const values: SimpleWavePulse[] = []
  const numStages = Math.floor((duration * 1000) / WAVE_ACTION_INTERVAL);
  const brightnessRange = to - from;
  const brightnessPerStage = brightnessRange / (numStages - 1);
  for (let stage = 0; stage < numStages; stage++) {
    const brightnessAtStage = from + (brightnessPerStage * stage);
    const pwmTime = Math.round(WAVE_ACTION_INTERVAL * (brightnessAtStage / 100));
    values.push(
      { delay: pwmTime, isOn: true },
      { delay: (WAVE_ACTION_INTERVAL - pwmTime), isOn: false },
    );
  }
  return values;
}


export function transitionPulse(minBrightness: number, maxBrightness: number, duration: number): SimpleWavePulse[] {
  return [
    ...transitionBrightness(minBrightness, maxBrightness, Math.round(duration / 2)),
    ...transitionBrightness(maxBrightness, minBrightness, Math.round(duration / 2)),
  ];
}


export function toWaveform(simpleMap: SimpleWavePulse[], gpio: number): pigpioTypes.GenericWaveStep[] {
  return simpleMap.map(({ delay, isOn }) => ({ gpioOn: isOn ? gpio : 0, gpioOff: !isOn ? gpio : 0, usDelay: delay }));
}

