import { getLightHardware } from './hardware';

process.env.PIGPIO_NO_LOGGING = '1';


jest.mock('pigpio-mock', () => ({
  ...jest.requireActual<object>('pigpio-mock'),
  waveTxStop: jest.fn(),
  waveCreate: jest.fn(),
  waveClear: jest.fn(),
  waveAddGeneric: jest.fn(),
  waveTxSend: jest.fn(),
}));

jest.mock('pigpio', () => jest.requireMock<object>('pigpio-mock'));


let hardware: ReturnType<typeof getLightHardware>;

beforeAll(() => {
  hardware = getLightHardware();
});

it('should be able to init correctly', () => {
  expect(hardware).toBeDefined();
});

it('should be able to push light states', () => {
  hardware.setLightState({
    star: { brightness: 80 },
    light1: { brightness: 80, direction: 'positive' },
    light2: { brightness: 56, direction: 'negative' },
  })
});
