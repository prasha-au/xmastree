import { toWaveform, transitionBrightness, transitionPulse } from './wavegen';


const WAVE_ACTION_INTERVAL = 5000;

describe('transitionBrightness', () => {
  it('should generate entries that add up to the correct duration', () => {
    const pulses = transitionBrightness(20, 100, 1000);
    expect(pulses.reduce((acc, curr) => acc + curr.delay, 0)).toEqual(1000_000);
  });

  it('should have the starting brightness as the first duration', () => {
    const [first, second] = transitionBrightness(20, 100, 1000).slice(0, 2);
    const total = first.delay + second.delay;
    expect(first.delay / total).toBeCloseTo(0.2);
    expect(second.delay / total).toBeCloseTo(0.8);
  });

  it('should have the finishing brightness as the last duration', () => {
    const [secondLast, last] = transitionBrightness(20, 90, 1000).slice(-2);
    const total = last.delay + secondLast.delay;
    expect(secondLast.delay / total).toBeCloseTo(0.9);
    expect(last.delay / total).toBeCloseTo(0.1);
  });

  it('should interleave on and off', () => {
    const data = transitionBrightness(15, 80, 100);
    for (let i = 0; i < data.length; i += 2) {
      expect(data[i].isOn).toBe(true);
      expect(data[i + 1].isOn).toBe(false);
    }
  })
});














// describe('transitionPulse',  () => {
//   it('should generate an up-down pulse', () => {
//     const data = transitionPulse(20, 100, 100);
//     console.log(data);
//   });

// });




// describe('extendSingleMaps', () => {
//   it('should be able to join extend items properly', () => {
//     const waveMaps = [
//       { 0: false, 20: true, 100: false, 140: true, 200: true },
//       { 0: false, 80: true, 100: false, 120: true, 200: true },
//     ] as const;
//     console.log(extendSingleMaps([...waveMaps]));
//     expect(extendSingleMaps([...waveMaps])).toEqual({
//       0: false,
//       20: true,
//       100: false,
//       140: true,
//       200: false,
//       280: true,
//       300: false,
//       320: true,
//       400: true
//     });
//   });
// });


// describe('toWaveform', () => {
//   it('should be able to generate a basic waveform', () => {
//     expect(toWaveform({
//       0: true,
//       20: false,
//       100: true,
//       140: false,
//       200: false
//     }, 10)).toEqual([
//       { usDelay: 20, gpioOn: 10, gpioOff: 0 },
//       { usDelay: 80, gpioOn: 0, gpioOff: 10 },
//       { usDelay: 40, gpioOn: 10, gpioOff: 0 },
//       { usDelay: 60, gpioOn: 0, gpioOff: 10 },
//     ]);
//   });

//   it('should create a waveform with the correct total duration', () => {
//     const waveform = toWaveform({ 0: true, 20: false, 1200: false }, 10);
//     expect(waveform.reduce((acc, curr) => acc + curr.usDelay, 0)).toBe(1200);
//   });
// });

