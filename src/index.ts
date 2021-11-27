import { Gpio } from 'pigpio';
import * as mqtt from 'mqtt';
import { BehaviorSubject, delay, map, merge, switchMap, timer, NEVER, throttleTime, asyncScheduler } from 'rxjs';

const MQTT_URL = 'mqtt://192.168.1.4';
const DEVICE_ID = 'xmastree';

const star = new Gpio(12, { mode: Gpio.OUTPUT });

const ena = new Gpio(13, {mode: Gpio.OUTPUT});
const in1 = new Gpio(26, { mode: Gpio.OUTPUT });
const in2 = new Gpio(6, { mode: Gpio.OUTPUT });

const enb = new Gpio(25, {mode: Gpio.OUTPUT});
const in3 = new Gpio(23, { mode: Gpio.OUTPUT });
const in4 = new Gpio(24, { mode: Gpio.OUTPUT });



ena.pwmWrite(0);
in1.digitalWrite(0);
in2.digitalWrite(1);

enb.pwmWrite(0);
in3.digitalWrite(0);
in4.digitalWrite(1);


function turnOff() {
  star.pwmWrite(0);

  ena.pwmWrite(0);
  in1.digitalWrite(0);
  in2.digitalWrite(0);

  enb.pwmWrite(0);
  in3.digitalWrite(0);
  in4.digitalWrite(0);
}



interface LightConfig {
  pwm: Gpio,
  brightness: number;
  pulseTime: number;
  minBrightness?: number;
  alternate?: { pos: Gpio; neg: Gpio };
  delayTime?: number;
}

function createTimer(config: LightConfig) {
  const { pwm, brightness, pulseTime, alternate } = config;

  const pwmChangeSpeed = pulseTime < 500 ? 20 : 100;

  const delayTime = config.delayTime ?? 0;
  const minBrightness = config.minBrightness ?? 0;

  const minPwm = Math.floor(255 * (minBrightness / 100));
  const maxPwm = Math.floor(255 * (brightness / 100));

  const pwmRange = maxPwm - minPwm;

  const iterationsPerCycle = Math.floor(pulseTime / pwmChangeSpeed);
  const pwmChangePerIteration = (pwmRange * 2) / (pulseTime / pwmChangeSpeed);

  let flip = false;
  return timer(0, pwmChangeSpeed).pipe(
    delay(delayTime ?? 0),
    map((idx) => {
      const iteration = idx % iterationsPerCycle;
      const countUp = iteration <= (iterationsPerCycle / 2);
      const dutyCycleMod = countUp
        ? pwmChangePerIteration * iteration
        : (pwmChangePerIteration * (iterationsPerCycle - iteration));
      return Math.floor(minPwm + dutyCycleMod);
    }),
    map(dutyCycle => {
      pwm.pwmWrite(dutyCycle);
      if (dutyCycle === minPwm && alternate) {
        flip = !flip;
        alternate.pos.digitalWrite(flip ? 1 : 0);
        alternate.neg.digitalWrite(flip ? 0 : 1);
      }
    })
  )
}





interface TreeState {
  power: boolean;
  brightness: number;
  speed: number;
}

const INITIAL_STATE = {
  power: false,
  brightness: 100,
  speed: 70
} as const;


const stateSubject = new BehaviorSubject<TreeState>(INITIAL_STATE);


stateSubject.asObservable().pipe(
  throttleTime(500, asyncScheduler, { leading: true, trailing: true }),
  switchMap(state => {
    console.log('Setting up new state: ', state);
    if (!state.power) {
      turnOff();
      return NEVER;
    } else {
      const pulseTime = 5000 - Math.floor(4800 * (state.speed / 100));
      return merge(
        createTimer({ pwm: star, brightness: Math.min(state.brightness + 20, 100), pulseTime: pulseTime, minBrightness: Math.ceil(30 - state.brightness / 100) }),
        createTimer({ pwm: ena, brightness: state.brightness, pulseTime: pulseTime, alternate: { pos: in1, neg: in2 } }),
        createTimer({ pwm: enb, brightness: state.brightness, pulseTime: pulseTime, alternate: { pos: in3, neg: in4 }, delayTime: pulseTime / 2 })
      );
    }
  })
).subscribe();



const client = mqtt.connect(
  MQTT_URL,
  {
    will: {
      topic: 'device/lwt',
      payload: DEVICE_ID,
      qos: 0,
      retain: false,
    },
  },
);


client.subscribe(`device/runAction/${DEVICE_ID}`);
client.subscribe(`device/requestRegister`);

const triggerStatusPublish = () => {
  const currentState = stateSubject.getValue();
  client.publish(`device/update/${DEVICE_ID}`, JSON.stringify({
    id: DEVICE_ID,
    name: 'Christmas Tree',
    controls: {
      power: { type: 'toggle', label: currentState.power ? 'Turn Off' : 'Turn On', state: currentState.power },
      brightness: { type: 'slider', label: 'Brightness', state: currentState.brightness },
      speed: { type: 'slider', label: 'Speed', state: currentState.speed },
      resetState: { type: 'simple', label: 'Reset' }
    },
  }), (err) => {
    if (err) {
      console.error('Failed to publish ', err);
    } else {
      console.log('Published');
    }
  });
};


client.on('message', async (topic, payloadBuffer) => {
  console.log('<<< ', topic, payloadBuffer.toString());
  const payload = JSON.parse(payloadBuffer.toString());
  switch (topic) {
    case 'device/requestRegister':
      console.log('Sending register message.');
      triggerStatusPublish();
      break;
    case `device/runAction/${DEVICE_ID}`:
      console.log('got action payload', payload);
      const currentState = stateSubject.getValue();
      switch (payload.data.control) {
        case 'power': {
          const newPowerValue = payload.data.value === undefined ? !currentState.power : !!payload.data.value;
          stateSubject.next({ ...currentState, power: newPowerValue });
          break;
        }
        case 'brightness': {
          stateSubject.next({ ...currentState, power: true, brightness: payload.data.value });
          break;
        }
        case 'speed': {
          stateSubject.next({ ...currentState, power: true, speed: payload.data.value });
          break;
        }
        case 'resetState': {
          stateSubject.next({ ...INITIAL_STATE, power: true });
          break;
        }
        default:
          console.log(`Invalid control ${payload.data.control} provided.`);
      }
      triggerStatusPublish();
      break;
    default:
      console.log(`Unhandled topic ${topic} provided.`);
  }
});

client.on('connect', () => {
  console.log('connected to MQTT');
  triggerStatusPublish();
});

