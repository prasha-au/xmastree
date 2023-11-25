import { alternating, mergeWaveforms, toWaveform, transitionBrightness, transitionPulse } from './wavegen';


function assertPwmPercentage([first, second]: { delay: number }[], percent: number): void {
  const total = first.delay + second.delay;
  expect(first.delay / total).toBeCloseTo(percent, 4);
}

describe('transitionBrightness', () => {
  it('should generate entries that add up to the correct duration', () => {
    const pulses = transitionBrightness(20, 100, 1000);
    expect(pulses.reduce((acc, curr) => acc + curr.delay, 0)).toEqual(1000_000);
  });

  it('should have the starting brightness as the first duration', () => {
    assertPwmPercentage(transitionBrightness(20, 100, 1000).slice(0, 2), 0.2);
  });

  it('should have the finishing brightness as the last duration', () => {
    assertPwmPercentage(transitionBrightness(20, 90, 1000).slice(-2), 0.9);
  });

  it('should interleave on and off', () => {
    const data = transitionBrightness(15, 80, 100);
    for (let i = 0; i < data.length; i += 2) {
      expect(data[i].isOn).toBe(true);
      expect(data[i + 1].isOn).toBe(false);
    }
  })
});

describe('transitionPulse', () => {
  it('should start and finish at the minBrightness', () => {
    const pulses = transitionPulse(15, 90, 1000);
    assertPwmPercentage(pulses.slice(0, 2), 0.15);
    assertPwmPercentage(pulses.slice(-2), 0.15);
  });

  it('should have the maxBrightness in the middle', () => {
    const pulses = transitionPulse(15, 90, 1000);
    assertPwmPercentage(pulses.slice(pulses.length / 2), 0.9);
  });
});

describe('toWaveform', () => {
  it('should convert values properly', () => {
    expect(
      toWaveform([{ delay: 100, isOn: true },{ delay: 200, isOn: false }], 18)
    ).toEqual([
      { gpioOn: 18, gpioOff: 0, usDelay: 100 },
      { gpioOn: 0, gpioOff: 18, usDelay: 200 },
    ]);
  });
});


describe('alternating', () => {
  // TODO: Write a proper test
  it('should rotate pins', () => {
    expect(alternating([1, 2], 100)).toHaveLength(20);
  });
});



describe('mergeWaveforms', () => {
  it('should merge properly', () => {
    const wave1 = [{ gpioOn: 1, gpioOff: 2, usDelay: 100 }, { gpioOn: 2, gpioOff: 1, usDelay: 100 }];
    const wave2 = [{ gpioOn: 3, gpioOff: 4, usDelay: 100 }, { gpioOn: 4, gpioOff: 3, usDelay: 100 }];
    const merged = mergeWaveforms([wave1, wave2]);
    expect(merged).toEqual([
      { gpioOn: 1, gpioOff: 2, usDelay: 0 },
      { gpioOn: 3, gpioOff: 4, usDelay: 100 },
      { gpioOn: 2, gpioOff: 1, usDelay: 0 },
      { gpioOn: 4, gpioOff: 3, usDelay: 100 },
    ]);
  });

  it('should be able to interleave properly', () => {
    const wave1 = [{ gpioOn: 1, gpioOff: 2, usDelay: 100 }, { gpioOn: 2, gpioOff: 1, usDelay: 20 }];
    const wave2 = [{ gpioOn: 3, gpioOff: 4, usDelay: 50 }, { gpioOn: 4, gpioOff: 3, usDelay: 100 }];
    const merged = mergeWaveforms([wave1, wave2]);
    console.log(merged);
    expect(merged).toEqual([
      { gpioOn: 3, gpioOff: 4, usDelay: 50 },
      { gpioOn: 1, gpioOff: 2, usDelay: 50 },
      { gpioOn: 2, gpioOff: 1, usDelay: 20 },
      { gpioOn: 4, gpioOff: 3, usDelay: 30 },
    ]);
  });
});
