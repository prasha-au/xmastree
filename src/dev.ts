
import pipgio, { Gpio, WAVE_MODE_REPEAT } from 'pigpio';


const ena = new Gpio(13, {mode: Gpio.OUTPUT});

const enb = new Gpio(25, {mode: Gpio.OUTPUT});

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