import { LightHardware, getLightHardware } from './hardware';

process.env.PIGPIO_NO_LOGGING = '1';

jest.mock('pigpio', () => require('pigpio-mock') as unknown);


let hardware: LightHardware;


beforeAll(() => {
  hardware = getLightHardware();
});

it('should be able to init correctly', () => {
  expect(hardware).toBeDefined();
});

it('hould be bale to push light states', () => {
  hardware.setLightState({
    star: { brightness: 80 },
    light1: { brightness: 80, direction: 'positive' },
    light2: { brightness: 56, direction: 'negative' },
  })
});
