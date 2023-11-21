import type pigpioTypes from 'pigpio';
import type { Scene } from './lighting';
import { Observable, map, repeat, share, skip, take, timer } from 'rxjs';
import { platform } from 'os';
import { spawn } from 'child_process';

const isWindows = platform() === 'win32';


const pigpio = (isWindows ? require('pigpio-mock') : require('pigpio')) as typeof pigpioTypes;


const PWM_RANGE = 255;


export interface LightState {
  star: { brightness: number; };
  light1: { brightness: number; direction: 'positive' | 'negative' | 'both'; };
  light2: { brightness: number; direction: 'positive' | 'negative' | 'both'; };
}


export interface Hardware {
  setLightState(scene: LightState): void;
}


export function getLightHardware(): Hardware {

  const star = new pigpio.Gpio(12, { mode: pigpio.Gpio.OUTPUT });

  const ena = new pigpio.Gpio(13, {mode: pigpio.Gpio.OUTPUT});
  const in1 = new pigpio.Gpio(26, { mode: pigpio.Gpio.OUTPUT });
  const in2 = new pigpio.Gpio(6, { mode: pigpio.Gpio.OUTPUT });

  const enb = new pigpio.Gpio(25, {mode: pigpio.Gpio.OUTPUT});
  const in3 = new pigpio.Gpio(23, { mode: pigpio.Gpio.OUTPUT });
  const in4 = new pigpio.Gpio(24, { mode: pigpio.Gpio.OUTPUT });


  function setPwm(gpio: pigpioTypes.Gpio, value: number) {
    gpio.pwmWrite(Math.round(PWM_RANGE * (value / 100)));
  }


  let lastWaveState: string | null = null;
  let lastWaveId: number | null = null;
  return {
    setLightState: (frame: LightState) => {
      setPwm(star, frame.star.brightness);
      setPwm(ena, frame.light1.brightness);
      setPwm(enb, frame.light2.brightness);

      if (frame.light1.direction !== 'both') {
        in1.digitalWrite(frame.light1.direction === 'positive' ? 1 : 0);
        in2.digitalWrite(frame.light1.direction === 'positive' ? 0 : 1);
      }
      if (frame.light1.direction !== 'both') {
        in3.digitalWrite(frame.light2.direction === 'positive' ? 1 : 0);
        in4.digitalWrite(frame.light2.direction === 'positive' ? 0 : 1);
      }


      const waveform = [
        ...(frame.light1.direction === 'both' ? [
          { gpioOn: 26, gpioOff: 6, usDelay: 10 },
          { gpioOn: 6, gpioOff: 26, usDelay: 10 },
        ] : []),
        ...(frame.light2.direction === 'both' ? [
          { gpioOn: 23, gpioOff: 24, usDelay: 10 },
          { gpioOn: 24, gpioOff: 23, usDelay: 10 },
        ] : []),
      ];
      const newWaveState = JSON.stringify(waveform);
      if (newWaveState === lastWaveState) {
        return;
      }
      lastWaveState = newWaveState;
      pigpio.waveClear();
      if (waveform.length === 0) {
        return;
      }
      pigpio.waveAddGeneric(waveform);
      if (lastWaveId) {
        pigpio.waveDelete(lastWaveId);
      }
      const waveId = pigpio.waveCreate();
      pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT);
    }
  };
}


export function getMicStream() {
  return new Observable<Buffer>(observer => {
    const ps = platform()
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
