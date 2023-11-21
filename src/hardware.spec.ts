import { Hardware, initHardware } from './hardware';
import { Gpio } from 'pigpio';

process.env.PIGPIO_NO_LOGGING = '1';

jest.mock('pigpio', () => require('pigpio-mock') as unknown);


let hardware: Hardware;


beforeAll(() => {
  hardware = initHardware();
});

it('should be able to init correctly', () => {
  expect(hardware).toBeDefined();
});


it('should be able to set brightness', () => {
  const spy = jest.spyOn(Gpio.prototype, 'pwmWrite');
  hardware.star.setBrightness(100);
  expect(spy).toHaveBeenCalledWith(255);
});


it('should be able to reverse direction', () => {
  const spy = jest.spyOn(Gpio.prototype, 'digitalWrite');
  hardware.light1.setDirection(true);
  expect(spy).toHaveBeenCalledWith(1);
  expect(spy).toHaveBeenCalledWith(0);
  expect(spy.mock.instances[0]).not.toBe(spy.mock.instances[1]);
});
