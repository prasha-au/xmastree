import { basicPwm, transitionBrightness } from './wavegen';

it.only('should be able to generate a wave for brightness pwm', () => {
  // console.log(basicPwm(80, 100));
  console.log(transitionBrightness(20, 80, 1000));
});

