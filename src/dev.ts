
import pipgio, { Gpio, WAVE_MODE_REPEAT } from 'pigpio';


const ena = new Gpio(13, {mode: Gpio.OUTPUT});

const enb = new Gpio(25, {mode: Gpio.OUTPUT, });

async function bootstrap() {

  while (true) {
    ena.pwmWrite(255);
    enb.pwmWrite(255);
    pipgio.waveClear();

    const waveform = [
      { gpioOn: 26, gpioOff: 6, usDelay: 1 },
      { gpioOn: 23, gpioOff: 24, usDelay: 5 },
      { gpioOn: 6, gpioOff: 26, usDelay: 1 },
      { gpioOn: 24, gpioOff: 23, usDelay: 5 },
    ];
    pipgio.waveAddGeneric(waveform);

    const waveId = pipgio.waveCreate();
    pipgio.waveTxSend(waveId, WAVE_MODE_REPEAT);

    await new Promise(resolve => setTimeout(resolve, 5000));
    ena.pwmWrite(0);
    enb.pwmWrite(0);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }



}


void bootstrap();


// import pigpio from 'pigpio';
// import { toWaveform, transitionBrightness } from './wavegen';

// const _output = new pigpio.Gpio(18, {mode: pigpio.Gpio.OUTPUT});

// const data = transitionBrightness(1, 100, 2000);


// // pigpio.waveClear();

// const waveform = toWaveform(data, 18);
// console.log('waveformlength', waveform.length);
// pigpio.waveAddGeneric([...waveform, ...waveform.reverse()]);

// const waveId = pigpio.waveCreate();
// console.log('running wave', waveId);

// pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT);

// while (pigpio.waveTxBusy()) {}
// console.log('done');

