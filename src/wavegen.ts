import type pigpioTypes from 'pigpio';

const WAVE_ACTION_INTERVAL = 5000;

type SimpleWaveMap = { [timestamp: number]: boolean };

export function transitionBrightness(from: number, to: number, duration: number): SimpleWaveMap {
  const values: SimpleWaveMap = {};
  const numStages = Math.floor((duration * 1000) / WAVE_ACTION_INTERVAL);
  const brightnessRange = to - from;
  const brightnessPerStage = brightnessRange / numStages;
  for (let stage = 0; stage <= numStages; stage++) {
    const brightnessAtStage = from + (brightnessPerStage * stage);
    const pwmTime = Math.round(WAVE_ACTION_INTERVAL * (brightnessAtStage / 100));
    values[stage * WAVE_ACTION_INTERVAL] = true;
    values[stage * WAVE_ACTION_INTERVAL + pwmTime] = false;
  }
  values[(numStages + 1) * WAVE_ACTION_INTERVAL] = false;
  return values;
}




export function extendSingleMaps(...waveMaps: SimpleWaveMap[]): SimpleWaveMap {
  return waveMaps.reduce((acc, cur) => {
    const lastTime = parseInt(Object.keys(acc).pop() ?? '0', 10) ?? 0;
    return {
      ...acc,
      ...Object.fromEntries(Object.entries(cur).map(([k, v]) => [parseInt(k, 10) + lastTime, v]))
    };
  }, {});
}


export function toWaveform(simpleMap: SimpleWaveMap, gpio: number): pigpioTypes.GenericWaveStep[] {
  const simpleTimings = Object.entries(simpleMap).map(([time, value]) => ({ time: parseInt(time, 10), value }));
  return simpleTimings.map(({ time, value }, idx) => {
    const lastTime = simpleTimings[idx - 1]?.time ?? 0;
    return { usDelay: time - lastTime, gpioOn: value ? gpio : 0, gpioOff: !value ? gpio : 0 };
  });
}

