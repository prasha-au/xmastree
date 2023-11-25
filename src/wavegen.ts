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


export function alternating(gpios: [number, number], duration: number): pigpioTypes.GenericWaveStep[] {
  const durationUs = duration * 1000;
  return Array.from({ length: durationUs / WAVE_ACTION_INTERVAL }, (_v, idx) => {
    return {
      gpioOn: idx % 2 === 0 ? gpios[0] : gpios[1],
      gpioOff: idx % 2 === 0 ? gpios[1] : gpios[0],
      usDelay: WAVE_ACTION_INTERVAL
    };
  });
}


export function mergeWaveforms(waveforms: pigpioTypes.GenericWaveStep[][]) {
  const pulseMap = waveforms.reduce((acc, curr) => {
    let upToTime = 0;
    for (const pulse of curr) {
      const time = upToTime + pulse.usDelay;
      acc[time] = [...(acc[time] ?? []), pulse];
      upToTime = time;
    }
    return acc;
  }, {} as Record<number, pigpioTypes.GenericWaveStep[]>);

  const pulseTimes = Object.keys(pulseMap).map(v => Number(v))
  pulseTimes.sort((a, b) => a - b);

  return pulseTimes.map((time, idx) => {
    const lastTime = pulseTimes[idx - 1] ?? 0;
    const pulsesAtTime = pulseMap[time];
    return [
      ...pulsesAtTime.slice(0, -1).map(p => ({ ...p, usDelay: 0 })),
      { ...pulsesAtTime[pulsesAtTime.length - 1], usDelay: time - lastTime },
    ];
  }).flat();
}
