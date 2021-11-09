console.log('initializing');

const { Gpio } = require('pigpio');
const mqtt = require('mqtt');

const MQTT_URL = 'mqtt://192.168.1.4';
const DEVICE_ID = 'xmastree';

let state = false;

const relayTrigger = new Gpio(4, {mode: Gpio.OUTPUT});
relayTrigger.digitalWrite(0);

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


const led = new Gpio(18, { mode: Gpio.OUTPUT });

let dutyCycle = 0;
let countUp = true;
setInterval(() => {
  if (!state) {
    led.pwmWrite(0);
  } else {
    led.pwmWrite(dutyCycle);
    dutyCycle = dutyCycle + (countUp ? 5 : -5);
    if (dutyCycle >= 255) {
      countUp = false;
    } else if (dutyCycle <= 80) {
      countUp = true;
    }
  }
}, 20);

client.subscribe(`device/runAction/${DEVICE_ID}`);
client.subscribe(`device/requestRegister`);

const triggerStatusPublish = () => {
  client.publish(`device/update/${DEVICE_ID}`, JSON.stringify({
    id: DEVICE_ID,
    name: 'Christmas Tree',
    controls: {
      power: {
        type: 'toggle',
        label: state ? 'Turn Off' : 'Turn On',
        state: state
      },
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
      switch (payload.data.control) {
        case 'power': {
          if (payload.data.value === undefined) {
            state = !state;
          } else {
            state = !!payload.data.value;
          }
          relayTrigger.digitalWrite(state ? 1 : 0);
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

