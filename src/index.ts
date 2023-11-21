import * as mqtt from 'mqtt';
import { BehaviorSubject, switchMap, NEVER, throttleTime, map } from 'rxjs';
import { generateOffScene, generatePulseScene, generateTwinkleScene } from './lighting';
import { actionSceneFrame, createSceneObservable, initHardware } from './hardware';

const MQTT_URL = 'mqtt://192.168.1.4';
const DEVICE_ID = 'xmastree';


const hardware = initHardware();


const MODES = ['twinkle', 'pulse'] as const;

interface TreeState {
  power: boolean;
  mode: typeof MODES[number],
  brightness: number;
  speed: number;
}

const INITIAL_STATE = {
  power: true,
  mode: 'twinkle',
  brightness: 100,
  speed: 35,
} as const;


const stateSubject = new BehaviorSubject<TreeState>(INITIAL_STATE);


stateSubject.asObservable().pipe(
  throttleTime(500, undefined, { leading: true, trailing: true }),
  switchMap(state => {
    console.log('Setting up new state: ', state);
    if (!state.power) {
      actionSceneFrame(hardware, generateOffScene());
      return NEVER;
    }
    switch (state.mode) {
      case 'pulse':
        return createSceneObservable(hardware, generatePulseScene(state, 20));
      case 'twinkle':
      default:
        return createSceneObservable(hardware, generateTwinkleScene(state, 1));
    }
  })
).subscribe();



const client = mqtt.connect(
  MQTT_URL,
  {
    will: {
      topic: 'device/lwt',
      payload: Buffer.from(DEVICE_ID),
      qos: 0,
      retain: false,
    },
  },
);


client.subscribe(`device/runAction/${DEVICE_ID}`);
client.subscribe(`device/requestRegister`);

async function publishStatus(): Promise<void> {
  const currentState = stateSubject.getValue();
  await client.publishAsync(`device/update/${DEVICE_ID}`, JSON.stringify({
    id: DEVICE_ID,
    name: 'Christmas Tree',
    controls: {
      power: { type: 'toggle', label: currentState.power ? 'Turn Off' : 'Turn On', state: currentState.power },
      ...Object.fromEntries(MODES.map(mode => [`mode_${mode}`, { type: 'toggle', label: mode, state: currentState.mode === mode && currentState.power }])),
      brightness: { type: 'slider', label: 'Brightness', state: currentState.brightness },
      speed: { type: 'slider', label: 'Speed', state: currentState.speed },
      resetState: { type: 'simple', label: 'Reset' }
    },
  }));
}


type ControlMessage = {
  control: 'power'; value: boolean;
} | {
  control: `mode_${typeof MODES[number]}`;
} | {
  control: 'brightness'; value: number;
} | {
  control: 'speed'; value: number;
} | {
  control: 'resetState';
};


client.on('message', (topic, payloadBuffer) => {
  console.log('<<< ', topic, payloadBuffer.toString());
  const payload = JSON.parse(payloadBuffer.toString()) as { data: ControlMessage; };
  switch (topic) {
    case 'device/requestRegister':
      console.log('Sending register message.');
      void publishStatus();
      break;
    case `device/runAction/${DEVICE_ID}`: {
      console.log('got action payload', payload);
      const currentState = stateSubject.getValue();
      switch (payload.data.control) {
        case 'power': {
          const newPowerValue = payload.data.value === undefined ? !currentState.power : !!payload.data.value;
          stateSubject.next({ ...currentState, power: newPowerValue });
          break;
        }
        case 'mode_twinkle':
        case 'mode_pulse':
          stateSubject.next({
            ...currentState,
            power: true,
            mode: payload.data.control.replace(/^mode_/g, '') as typeof MODES[number],
          });
          break;
        case 'brightness': {
          stateSubject.next({ ...currentState, power: true, brightness: payload.data.value });
          break;
        }
        case 'speed': {
          stateSubject.next({ ...currentState, power: true, speed: payload.data.value });
          break;
        }
        case 'resetState': {
          stateSubject.next({ ...INITIAL_STATE });
          break;
        }
        default: {
          const _badControl: never = payload.data['control'];
          console.log(`Invalid control ${JSON.stringify(_badControl)} provided.`);
        }
      }
      void publishStatus();
      break;
    }
    default:
      console.log(`Unhandled topic ${topic} provided.`);
  }
});

client.on('connect', () => {
  console.log('connected to MQTT');
  void publishStatus();
});

