import type pigpioTypes from 'pigpio';
import type { Scene, SceneFrame } from './lighting';
import { Observable, map, repeat, share, skip, take, timer } from 'rxjs';
import { platform } from 'os';
import { spawn } from 'child_process';

const isWindows = platform() === 'win32';


const { Gpio } = (isWindows ? require('pigpio-mock') : require('pigpio')) as typeof pigpioTypes;


const PWM_RANGE = 255;

export interface Hardware {
  star: {
    setBrightness(value: number): void;
  },
  light1: {
    setBrightness(value: number): void;
    setDirection(reverse: boolean): void;
  },
  light2: {
    setBrightness(value: number): void;
    setDirection(reverse: boolean): void;
  },
}



export function initHardware(): Hardware {

  const star = new Gpio(12, { mode: Gpio.OUTPUT });

  const ena = new Gpio(13, {mode: Gpio.OUTPUT});
  const in1 = new Gpio(26, { mode: Gpio.OUTPUT });
  const in2 = new Gpio(6, { mode: Gpio.OUTPUT });

  const enb = new Gpio(25, {mode: Gpio.OUTPUT});
  const in3 = new Gpio(23, { mode: Gpio.OUTPUT });
  const in4 = new Gpio(24, { mode: Gpio.OUTPUT });


  function setPwm(gpio: pigpioTypes.Gpio, value: number) {
    gpio.pwmWrite(Math.round(PWM_RANGE * (value / 100)));
  }

  function setDirection(gpio1: pigpioTypes.Gpio, gpio2: pigpioTypes.Gpio, reverse: boolean) {
    gpio1.digitalWrite(reverse ? 1 : 0);
    gpio2.digitalWrite(reverse ? 0 : 1);
  }

  return {
    star: {
      setBrightness: v => setPwm(star, v),
    },
    light1: {
      setBrightness: v => setPwm(ena, v),
      setDirection: v => setDirection(in1, in2, v),
    },
    light2: {
      setBrightness: v => setPwm(enb, v),
      setDirection: v => setDirection(in3, in4, v),
    }
  };
}

export function actionSceneFrame(hardware: Hardware, frame: SceneFrame) {
  hardware.star.setBrightness(frame.star.brightness);
  hardware.light1.setBrightness(frame.light1.brightness);
  hardware.light1.setDirection(frame.light1.flip);
  hardware.light2.setBrightness(frame.light2.brightness);
  hardware.light2.setDirection(frame.light2.flip);
}


export function createSceneObservable(hardware: Hardware, scene: Scene): Observable<void> {
  return timer(0, scene.interval).pipe(
    take(scene.frames.length),
    repeat(),
    map(frameIdx => actionSceneFrame(hardware, scene.frames[frameIdx])),
    share(),
  )
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
