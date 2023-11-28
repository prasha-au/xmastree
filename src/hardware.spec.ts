import pigpio from 'pigpio';
import { getLightHardware } from './hardware';

process.env.PIGPIO_NO_LOGGING = '1';

jest.mock('os', () => ({
  ...jest.requireActual<object>('os'),
  platform: () => 'linux',
}));

const pwmWriteSpy = jest.fn<unknown, [number, number]>();
jest.mock('pigpio', () => ({
  Gpio: jest.fn((pin: number) => ({
    pwmWrite: (value: number) => pwmWriteSpy(pin, value),
  })),
  waveTxStop: jest.fn(),
  waveCreate: jest.fn(),
  waveClear: jest.fn(),
  waveAddGeneric: jest.fn(),
  waveTxSend: jest.fn(),
}));

beforeEach(() => {
  pwmWriteSpy.mockClear();
});

it('should initialize all required GPIOs as outputs', () => {
  const spy = jest.spyOn(pigpio, 'Gpio');
  const hardware = getLightHardware();
  expect(hardware).toBeDefined();
  for (const pin of [6, 12, 13, 23, 24, 25, 26]) {
    expect(spy).toHaveBeenCalledWith(pin, { mode: pigpio.Gpio.OUTPUT });
  }
});

it('should be able to push light states', () => {
  const waveAddGenericSpy = jest.spyOn(pigpio, 'waveAddGeneric');
  const hardware = getLightHardware();
  hardware.setLightState({
    star: { brightness: 80 },
    light1: { brightness: 80, direction: 'positive' },
    light2: { brightness: 56, direction: 'negative' },
  });
  expect(pwmWriteSpy).toHaveBeenCalledWith(12, Math.round(255 * 0.8));
  expect(pwmWriteSpy).toHaveBeenCalledWith(13, Math.round(255 * 0.8));
  expect(pwmWriteSpy).toHaveBeenCalledWith(25, Math.round(255 * 0.56));
  expect(waveAddGenericSpy).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ gpioOn: 26 }), expect.objectContaining({ gpioOn: 24 })])
  );
});
