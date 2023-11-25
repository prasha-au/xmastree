import { Observable, map, repeat, take, timer } from 'rxjs';
import type { LightState } from './hardware';

function brightnessPercent(minBrightness: number, maxBrightness: number, position: number): number {
  const brightnessRange = maxBrightness - minBrightness;
  if (position <= 50) {
    return minBrightness + Math.round(brightnessRange * (position / 50));
  } else {
    return maxBrightness - Math.round(brightnessRange * ((position - 50) / 50));
  }
}


interface BasicPulseConfig {
  minBrightness: number;
  maxBrightness: number;
  totalDuration: number;
  interval: number;
}


export function generateBasicPulseMap(config: BasicPulseConfig): number[] {
  const numberOfMappings = Math.round(config.totalDuration / config.interval);
  return Array.from({ length: numberOfMappings }, (_v, idx) => {
    const position = (idx / (numberOfMappings - 1)) * 100;
    return brightnessPercent(config.minBrightness, config.maxBrightness, position);
  });
}


export function generateAlternatingPulseMap(config: BasicPulseConfig): { brightness: number; direction: 'positive' | 'negative' | 'both'; }[] {
  const basicLightingMap = generateBasicPulseMap({
    minBrightness: config.minBrightness,
    maxBrightness: config.maxBrightness,
    totalDuration: config.totalDuration / 2,
    interval: config.interval
  });
  return [
    ...basicLightingMap.map(brightness => ({ brightness, direction: 'positive' as const })),
    ...basicLightingMap.map(brightness => ({ brightness, direction: 'negative' as const })),
  ];
}



export interface Scene {
  interval: number;
  frames: LightState[];
}


export function generateTwinkleScene(config: { speed: number; brightness: number; }, interval: number): Scene {
  const totalDuration = 5000 - Math.floor(4800 * (config.speed / 100));
  const starLightMap = generateBasicPulseMap({
    minBrightness: 30,
    maxBrightness: Math.min(config.brightness + 30, 100),
    totalDuration: totalDuration / 2,
    interval
  });
  const stringLightMap = generateAlternatingPulseMap({
    minBrightness: 1,
    maxBrightness: config.brightness,
    totalDuration,
    interval
  });
  const quarterLength = Math.floor(stringLightMap.length / 4);
  return {
    interval,
    frames: Array.from({ length: stringLightMap.length }, (_v, idx) => ({
      star: { brightness: starLightMap[idx % starLightMap.length] },
      light1: stringLightMap[idx],
      light2: stringLightMap[(idx + quarterLength) % stringLightMap.length],
    }))
  };
}


export function generatePulseScene(config: { speed: number; brightness: number }, interval: number): Scene {
  const totalDuration = 5000 - Math.floor(4800 * (config.speed / 100));
  const pulseMap = generateBasicPulseMap({ minBrightness: 1, maxBrightness: config.brightness, totalDuration, interval });
  return {
    interval,
    frames: Array.from({ length: pulseMap.length }, (_v, idx) => ({
      star: { brightness: pulseMap[idx] },
      light1: { brightness: pulseMap[idx], direction: 'both' },
      light2: { brightness: pulseMap[idx], direction: 'both' },
    }))
  }
}


export function generateOffScene(): LightState {
  return {
    star: { brightness: 0 },
    light1: { brightness: 0, direction: 'positive' },
    light2: { brightness: 0, direction: 'positive' },
  };
}


export function createSceneObservable(scene: Scene): Observable<LightState> {
  return timer(0, scene.interval).pipe(
    take(scene.frames.length),
    repeat(),
    map(frameIdx => scene.frames[frameIdx]),
  )
}

