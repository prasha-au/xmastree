
import pigpio, { Gpio, WAVE_MODE_REPEAT } from 'pigpio';
import { alternating, mergeWaveforms, toWaveform, transitionBrightness, transitionPulse } from './wavegen';



async function bootstrap() {

  pigpio.initialize();

  while (true) {
    // ena.pwmWrite(255);
    // enb.pwmWrite(255);
    pigpio.waveClear();


    pigpio.waveAddGeneric(mergeWaveforms([
      toWaveform(transitionPulse(1, 100, 2000), 12),
      // toWaveform(transitionPulse(1, 100, 2000), 13),
      toWaveform(transitionPulse(1, 100, 2000), 25),
      // alternating([26, 6], 2000),
      // alternating([23, 24], 2000),
    ]));

    const waveId = pigpio.waveCreate();

    while (true) {
      console.log('wave send');
      pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_REPEAT);
      while (pigpio.waveTxBusy()) {}
      console.log('wave done');

      // output.digitalWrite(1);
      // await new Promise(resolve => setTimeout(resolve, 500));
      // output.digitalWrite(0);
      // await new Promise(resolve => setTimeout(resolve, 1000));
    }



    // await new Promise(resolve => setTimeout(resolve, 5000));
    // ena.pwmWrite(0);
    // enb.pwmWrite(0);
    // await new Promise(resolve => setTimeout(resolve, 5000));
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

