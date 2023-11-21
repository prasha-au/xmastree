import { Observable, OperatorFunction, distinctUntilChanged, filter, map, scan } from 'rxjs';
import { SceneFrame } from './lighting';


/**
 * @param buffer 1 channel, 8-bit, signed, little endian PCM data
 */
export function getDecibels(buffer: Buffer): number {
  const amplitudeValues = Array.from(buffer, v => (v - 128) / 128);
  const sampleTotal = amplitudeValues.reduce((acc, curr) => acc + Math.abs(curr), 0);
  const numberOfSamples = amplitudeValues.length;
  return 20 * Math.log10(Math.abs(sampleTotal) / numberOfSamples);
}


export function decibelsToSoundPercentage(sampleFrames: number): OperatorFunction<number, number> {
  return input$ => input$.pipe(
    map(v => -v),
    scan((acc, curr) => {
      if (acc.frames.length > sampleFrames) {
        acc.frames.shift();
        acc.frames.push(curr);
      } else {
        acc.frames.push(curr);
      }
      const loudest = Math.max(...acc.frames);
      const quietest = Math.min(...acc.frames);
      const range = loudest - quietest;
      const percent = Math.round(((curr - quietest) / range) * 100);
      return {
        percent: percent,
        frames: acc.frames,
      };
    }, { percent: 0, frames: [] as number[] }),
    map(v => v.percent),
  )
}


export function generateSoundScene(micStream: Observable<Buffer>): Observable<SceneFrame> {
  return micStream.pipe(
    map(v => getDecibels(v)),
    decibelsToSoundPercentage(1000),
    distinctUntilChanged(),
    filter(v => v > 0),
    map(v => 100 - Math.max(v, 0)),
    map(brightness => ({
      star: { brightness },
      light1: { brightness, flip: false },
      light2: { brightness, flip: false },
    }))
  );
}

