
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


export function generateAlternatingPulseMap(config: BasicPulseConfig): { brightness: number; flip: boolean }[] {
  const basicLightingMap = generateBasicPulseMap({
    minBrightness: config.minBrightness,
    maxBrightness: config.maxBrightness,
    totalDuration: config.totalDuration / 2,
    interval: config.interval
  });
  return [
    ...basicLightingMap.map(brightness => ({ brightness, flip: false })),
    ...basicLightingMap.map(brightness => ({ brightness, flip: true })),
  ];
}


export interface SceneFrame {
  star: { brightness: number; };
  light1: { brightness: number; flip: boolean; };
  light2: { brightness: number; flip: boolean; };
}

export interface Scene {
  interval: number;
  frames: {
    star: { brightness: number; };
    light1: { brightness: number; flip: boolean; };
    light2: { brightness: number; flip: boolean; };
  }[];
}


export function generatePulseScene(config: { speed: number; brightness: number; }, interval: number): Scene {
  const totalDuration = 5000 - Math.floor(4800 * (config.speed / 100));
  const starLightMap = generateBasicPulseMap({
    minBrightness: 30,
    maxBrightness: Math.min(config.brightness + 30, 100),
    totalDuration: totalDuration / 2,
    interval
  });
  const stringLightMap = generateAlternatingPulseMap({
    minBrightness: 5,
    maxBrightness: 100,
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


export function generateOffScene(): SceneFrame {
  return {
    star: { brightness: 0 },
    light1: { brightness: 0, flip: false },
    light2: { brightness: 0, flip: false },
  };
}

