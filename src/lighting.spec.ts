import { generateAlternatingPulseMap, generateBasicPulseMap, generateTwinkleScene } from './lighting'

jest.mock('pigpio', () => require('pigpio-mock') as unknown);


describe('when creating a basic pulse pattern', () => {
  const commonConfig = { minBrightness: 30, maxBrightness: 100, totalDuration: 2000, interval: 100 } as const;

  it('should start and end at the min brightness', () => {
    const data = generateBasicPulseMap(commonConfig);
    expect(data[0]).toBe(commonConfig.minBrightness);
    expect(data[data.length - 1]).toBe(commonConfig.minBrightness);
  });

  it('should create the correct amount of values', () => {
    const data = generateBasicPulseMap(commonConfig);
    expect(data).toHaveLength(commonConfig.totalDuration / commonConfig.interval);
  });

  it('should get to max brightness given enough granuality', () => {
    const data = generateBasicPulseMap({ ...commonConfig, interval: 10, maxBrightness: 100 });
    expect(data).toContain(100);
  });
});

describe('when creating an alternating pulse pattern', () => {
  it('should contain the same values for both chains', () => {
    const data = generateAlternatingPulseMap({ minBrightness: 30, maxBrightness: 100, totalDuration: 2000, interval: 100 });
    expect(data).toHaveLength(20);
    expect(data.filter(d => d.direction === 'positive')).toHaveLength(10);
    expect(data.filter(d => d.direction === 'negative')).toHaveLength(10);
    expect(data.slice(0, 10).map(d => d.brightness)).toEqual(data.slice(10).map(d => d.brightness));
  });
});

describe('generateTwinkleScene', () => {
  it('should generate the correct structure', () => {
    const data = generateTwinkleScene({ speed: 1, brightness: 100 }, 100);
    expect(data.frames).toHaveLength(50);
    expect(data.frames[0]).toEqual({
      star: { brightness: expect.any(Number) as unknown },
      light1: { brightness: expect.any(Number) as unknown, flip: expect.any(Boolean) as unknown },
      light2: { brightness: expect.any(Number) as unknown, flip: expect.any(Boolean) as unknown }
    });
  });
});

