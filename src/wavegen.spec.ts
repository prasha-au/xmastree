import { extendSingleMaps, transitionBrightness } from './wavegen';


const WAVE_ACTION_INTERVAL = 5000;

describe('transitionBrightness', () => {

  it('should end up at the requested brightness', () => {
    const last2 = Object.keys(transitionBrightness(20, 100, 1000)).slice(-2).map(k => parseInt(k, 10));
    expect(last2[1] - last2[0]).toBe(WAVE_ACTION_INTERVAL);
  });

  it('should start at the requested brightness', () => {
    const first2 = Object.keys(transitionBrightness(20, 100, 1000)).slice(0, 2).map(k => parseInt(k, 10));
    expect(first2[1] - first2[0]).toBe(WAVE_ACTION_INTERVAL * 0.2);
  });

  it('should generate a transition that takes the requested duration + 1', () => {
    const times = Object.keys(transitionBrightness(1, 90, 2000));
    const startTime = parseInt(times[0], 10);
    const endTime = parseInt(times[times.length - 1], 10);
    expect(endTime - startTime).toBe(2_000_000 + WAVE_ACTION_INTERVAL);
  });

  it('should tack on a final value to ensure it chains properly', () => {
    expect(Object.values(transitionBrightness(1, 90, 2000)).slice(-2)).toEqual([false, false]);
  });

  it('should interleave on and off in that order', () => {
    const data = Object.entries(transitionBrightness(20, 100, 1000)).map(([, v]) => v);
    for (let i = 0; i < data.length; i += 2) {
      expect(data[i]).toBe(true);
      expect(data[i + 1]).toBe(false);
    }
  });

  it('should slowly transition to the correct value', () => {
    const data = Object.entries(transitionBrightness(20, 100, 1000)).map(([k]) => parseInt(k, 10));
    const lastOnInterval = 0;
    do {
      const on = data.shift() ?? 0;
      const off = data.shift() ?? 0;
      const onInterval = off - on;
      expect(onInterval).toBeGreaterThanOrEqual(lastOnInterval);
    } while (data.length > 0)
  });

  it('should throw an error if trying to use in reverse due to jitter in the transition', () => {
    expect(() => transitionBrightness(100, 1, 1000)).toThrow();
  });
});


describe('extendSingleMaps', () => {
  it('should be able to join extend wave maps properly', () => {
    const waveMaps = [
      { 0: true, 20: false, 100: true, 140: false, 200: false },
      { 0: true, 80: false, 100: true, 120: false, 200: false },
    ] as const;
    expect(extendSingleMaps(...waveMaps)).toEqual({
      0: true,
      20: false,
      100: true,
      140: false,
      200: true,
      280: false,
      300: true,
      320: false,
      400: false
    });
  });
});

