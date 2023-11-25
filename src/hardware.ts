import type pigpioTypes from 'pigpio';
import { Observable, share, skip } from 'rxjs';
import { platform } from 'os';
import { spawn } from 'child_process';

const isWindows = platform() === 'win32';

const pigpio = (isWindows ? require('pigpio-mock') : require('pigpio')) as typeof pigpioTypes;

const PWM_RANGE = 255;

const PIN_MAP = {
  star: { pwm: 12 },
  light1: { pwm: 13, pos: 26, neg: 6 },
  light2: { pwm: 25, pos: 23, neg: 24 },
} as const;


export interface LightState {
  star: { brightness: number; };
  light1: { brightness: number; direction: 'positive' | 'negative' | 'both'; };
  light2: { brightness: number; direction: 'positive' | 'negative' | 'both'; };
}


class LightHardware {
  private gpios = {
    star: new pigpio.Gpio(PIN_MAP.star.pwm, { mode: pigpio.Gpio.OUTPUT }),
    light1: new pigpio.Gpio(PIN_MAP.light1.pwm, {mode: pigpio.Gpio.OUTPUT}),
    light2: new pigpio.Gpio(PIN_MAP.light2.pwm, {mode: pigpio.Gpio.OUTPUT}),
  } as const;

  public setLightState(state: LightState): void {
    this.handleBrightness(state);
    this.handleDirection(state);
  }

  private handleBrightness(state: LightState) {
    const convertToPwm = (percent: number) => Math.round(PWM_RANGE * (percent / 100));
    this.gpios.star.pwmWrite(convertToPwm(state.star.brightness));
    this.gpios.light1.pwmWrite(convertToPwm(state.light1.brightness));
    this.gpios.light2.pwmWrite(convertToPwm(state.light2.brightness));
  }

  private lastDirectionHash?: string;
  private handleDirection(state: LightState) {
    const currentDirectionHash = `${state.light1.direction}|${state.light2.direction}`;
    if (this.lastDirectionHash === currentDirectionHash) {
      return;
    }
    this.lastDirectionHash = currentDirectionHash;

    const createPulses = (pins: { pos: number; neg: number }, direction: 'positive' | 'negative' | 'both') => {
      return direction === 'both' ?  [
        { gpioOn: pins.pos, gpioOff: pins.neg, usDelay: 1000 },
        { gpioOn: pins.neg, gpioOff: pins.pos, usDelay: 1000 }
      ] : [{
        gpioOn: direction === 'positive' ? pins.pos : pins.neg,
        gpioOff: direction === 'negative' ? pins.pos : pins.neg,
        usDelay: 1000
      }];
    };
    const waveform = [...createPulses(PIN_MAP.light1, state.light1.direction), ...createPulses(PIN_MAP.light2, state.light2.direction)];
    pigpio.waveTxStop();
    pigpio.waveClear();
    pigpio.waveAddGeneric(waveform);
    const waveId = pigpio.waveCreate();
    pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT);
  }

}


export function getLightHardware(): LightHardware {
  return new LightHardware();
}


export function getMicStream() {
  return new Observable<Buffer>(observer => {
    const ps = isWindows
      ? spawn('C:\\tools\\sox\\sox', ['-c', '1', '-r', '8000', '-b', '8', '-e', 'unsigned-integer', '-t', 'waveaudio', 'default', '-p', '--buffer', '500'])
      : spawn('arecord', ['-c', '1', '-r', '8000', '-f', 'U8', '-D', 'plughw:1,0']);
    ps.stdout.on('data', (data: Buffer) => observer.next(data));
    ps.stderr.on('error', data => observer.error(data.toString()));
    ps.on('close', () => observer.error('Prematurely closed'));
    return () => { observer.complete(); ps.kill(); };
  }).pipe(
    skip(2),
    share({ resetOnRefCountZero: true, resetOnError: true }),
  );
}
