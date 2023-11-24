import { extendSingleMaps, toWaveform, transitionBrightness, transitionPulse } from './wavegen';


const WAVE_ACTION_INTERVAL = 5000;

describe('transitionBrightness', () => {

  it('should start transitioning immediately', () => {
    const first2 = Object.keys(transitionBrightness(20, 100, 1000)).slice(0, 2).map(k => parseInt(k, 10));
    expect(first2[1] - first2[0]).toBeCloseTo(WAVE_ACTION_INTERVAL * (0.2 + 0.004));
  });

  it('should end up at the requested brightness', () => {
    const last2 = Object.keys(transitionBrightness(20, 100, 1000)).slice(-2).map(k => parseInt(k, 10));
    expect(last2[1] - last2[0]).toBe(WAVE_ACTION_INTERVAL);
  });

  it('should end up at the requested brightness when going in reverse', () => {
    const last2 = Object.keys(transitionBrightness(80, 10, 1000)).slice(-3).map(k => parseInt(k, 10));
    expect(last2[1] - last2[0]).toBe(WAVE_ACTION_INTERVAL * 0.1);
  });

  it('should generate a transition that takes the requested duration', () => {
    const times = Object.keys(transitionBrightness(1, 90, 2000));
    const startTime = parseInt(times[0], 10);
    const endTime = parseInt(times[times.length - 1], 10);
    expect(endTime - startTime).toBe(2_000_000);
  });

  it('the final value should be based on whether it is transitioning up or down', () => {
    expect(Object.values(transitionBrightness(1, 90, 2000)).pop()).toBe(true);
    expect(Object.values(transitionBrightness(90, 5, 2000)).pop()).toBe(false);
  });

  it('should interleave off and on in that order', () => {
    const data = Object.entries(transitionBrightness(20, 100, 100)).map(([, v]) => v).slice(0, -1);
    for (let i = 0; i < data.length; i += 2) {
      expect(data[i]).toBe(false);
      expect(data[i + 1]).toBe(true);
    }
  });

  it('should slowly transition to the correct value', () => {
    const data = Object.keys(transitionBrightness(20, 100, 1000)).map((k) => parseInt(k, 10)).slice(0, -1);
    let lastOnInterval = 0;
    do {
      const off = data.shift() ?? 0;
      const on = data.shift() ?? 0;
      const onInterval = on - off;
      expect(onInterval).toBeGreaterThanOrEqual(lastOnInterval);
      lastOnInterval = onInterval
    } while (data.length > 0)
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


describe('toWaveform', () => {

  it('should be able to generate a basic waveform', () => {
    expect(toWaveform({
      0: true,
      20: false,
      100: true,
      140: false,
      200: false
    }, 10)).toEqual([
      { usDelay: 0, gpioOn: 10, gpioOff: 0 },
      { usDelay: 20, gpioOn: 0, gpioOff: 10 },
      { usDelay: 80, gpioOn: 10, gpioOff: 0 },
      { usDelay: 40, gpioOn: 0, gpioOff: 10 },
      { usDelay: 60, gpioOn: 0, gpioOff: 10 },
    ]);
  });

});

