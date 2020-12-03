process.env.TZ = 'Australia/Perth';

console.log('initializing');

const { Gpio } = require('pigpio');
const mqtt = require('mqtt');

const MQTT_URL = 'mqtt://192.168.1.4';
const DEVICE_ID = 'xmastree';

const relayTrigger = new Gpio(20, {mode: Gpio.OUTPUT});
relayTrigger.digitalWrite(0);

const client = mqtt.connect(
  MQTT_URL,
  {
    will: {
      topic: 'remote/lwt',
      payload: DEVICE_ID,
      qos: 0,
      retain: false,
    },
  },
);

client.subscribe(`remote/runAction/${DEVICE_ID}`);
client.subscribe(`remote/requestRegister`);

const triggerStatusPublish = () => {
  client.publish('remote/registerDevice', JSON.stringify({
    id: DEVICE_ID,
    controls: {
      toggleOn: {
        type: 'simple',
        label: lastState ? 'Turn Off' : 'Turn On',
      },
    },
  }));
};


let lastState = false;
let forcedState = undefined;
const checkAndTrigger = () => {
  console.log('checkAndTrigger');
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeNum = hours + minutes / 100;
  console.log('current timeNum is ', timeNum);
  let newState = (timeNum >= 5.3 && timeNum <= 7) || (timeNum >= 18 && timeNum <= 22.2);
  if (forcedState === newState) {
    forcedState = undefined;
  } else if (forcedState !== undefined) {
    newState = forcedState;
  }
  if (newState !== lastState) {
    console.log('states do not match', lastState, 'to', newState);
    relayTrigger.digitalWrite(newState ? 1 : 0);
    lastState = newState;
    triggerStatusPublish();
  }
}

setInterval(() => checkAndTrigger, 10 * 60 * 1000);
checkAndTrigger();


client.on('message', async (topic, payloadBuffer) => {
  console.log('<<< ', topic, payloadBuffer.toString());
  const payload = JSON.parse(payloadBuffer.toString());
  switch (topic) {
    case 'remote/requestRegister':
      console.log('Sending register message.');
      triggerStatusPublish();
      break;
    case `remote/runAction/${DEVICE_ID}`:
      switch (payload.data.control) {
        case 'toggleOn': {
          forcedState = !lastState;
          checkAndTrigger();
          break;
        }
        default:
          console.log(`Invalid control ${payload.data.control} provided.`);
      }
      break;
    default:
      console.log(`Unhandled topic ${topic} provided.`);
  }
});

