import type pigpioTypes from 'pigpio';
import { BehaviorSubject, Observable, Subscription, distinctUntilChanged, map, merge, scan, share, skip } from 'rxjs';
import { platform } from 'os';
import { spawn } from 'child_process';
import objectHash from 'object-hash';

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


class LightHardwareData {
  private gpios = {
    star: new pigpio.Gpio(PIN_MAP.star.pwm, { mode: pigpio.Gpio.OUTPUT }),
    light1: new pigpio.Gpio(PIN_MAP.light1.pwm, {mode: pigpio.Gpio.OUTPUT}),
    light2: new pigpio.Gpio(PIN_MAP.light2.pwm, {mode: pigpio.Gpio.OUTPUT}),
  } as const;


  private lightStateSubject = new BehaviorSubject<LightState>({
    star: { brightness: 0 },
    light1: { brightness: 0, direction: 'positive' },
    light2: { brightness: 0, direction: 'positive' },
  });

  private lightState = this.lightStateSubject.asObservable().pipe(
    distinctUntilChanged((a, b) => objectHash(a) === objectHash(b)),
  );

  private subscription?: Subscription;

  setLightState(state: LightState): void {
    this.lightStateSubject.next(state);
  }


  public init(): void {
    this.subscription?.unsubscribe();
    this.subscription = new Subscription();

    const brightnessSub = this.lightState.pipe(
      map(state => [state.star.brightness, state.light1.brightness, state.light2.brightness]),
      map(values => values.map(v => Math.round(PWM_RANGE * (v / 100)))),
    ).subscribe(([star, light1, light2]) => {
      this.gpios.star.pwmWrite(star);
      this.gpios.light1.pwmWrite(light1);
      this.gpios.light2.pwmWrite(light2);
    });
    this.subscription.add(brightnessSub);

    const directionSubStatic = this.lightState.subscribe(state => {
      for (const key of ['light1', 'light2'] as const) {
        const direction = state[key].direction;
        if (direction !== 'both') {
          this.gpios[key].digitalWrite(direction === 'positive' ? 1 : 0);
          this.gpios[key].digitalWrite(direction === 'positive' ? 0 : 1);
        }
      }
    });
    this.subscription.add(directionSubStatic);

    const directionSubWave = this.lightState.pipe(
      map(state => [state.light1.direction === 'both', state.light2.direction === 'both']),
      distinctUntilChanged((a, b) => objectHash(a) === objectHash(b)),
    ).subscribe(([light1, light2]) => {
      const waveform: pigpioTypes.GenericWaveStep[] = [
        light1 ? { gpioOn: PIN_MAP.light1.pos, gpioOff: PIN_MAP.light1.neg, usDelay: 10 } : undefined,
        light2 ? { gpioOn: PIN_MAP.light2.pos, gpioOff: PIN_MAP.light2.neg, usDelay: 10 } : undefined,
        light1 ? { gpioOn: PIN_MAP.light1.neg, gpioOff: PIN_MAP.light1.pos, usDelay: 10 } : undefined,
        light2 ? { gpioOn: PIN_MAP.light2.neg, gpioOff: PIN_MAP.light2.pos, usDelay: 10 } : undefined,
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
      pigpio.waveTxStop();
      pigpio.waveClear();
      if (waveform.length > 0) {
        pigpio.waveAddGeneric(waveform);
      }
      const waveId = pigpio.waveCreate();
      pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT);
    });
    this.subscription.add(directionSubWave);
  }
}


export type LightHardware = InstanceType<typeof LightHardwareData>;

export function getLightHardware(): LightHardware {
  return new LightHardwareData();
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
