require "light_timer"


local MQTT_URL = "mqtt://192.168.1.4"
local DEVICE_ID = "xmastree"


local PIN_STAR = 1

local PIN_ENA = 2
local PIN_IN1 = 3
local PIN_IN2 = 4

local PIN_ENB = 5
local PIN_IN3 = 6
local PIN_IN4 = 7



local duty_timer = tmr.create()


local BASE_ITERATION_CYCLE = 1000

local power = true
local brightness = 100
local speed = 100



-- pwm.setup(PIN_STAR, 200, 0)

pwm.setup(PIN_ENA, 200, 0)
gpio.mode(PIN_IN1, gpio.OUTPUT)
gpio.mode(PIN_IN2, gpio.OUTPUT)

-- pwm.setup(PIN_ENB, 200, 0)
-- gpio.mode(PIN_IN3, gpio.OUTPUT)
-- gpio.mode(PIN_IN4, gpio.OUTPUT)


gpio.write(PIN_IN1, gpio.LOW)
gpio.write(PIN_IN2, gpio.LOW)

pwm.setduty(PIN_ENA, 0)


local iterations = 0


local lights_a = AlternatingLightTimer:new()
lights_a:set_config(BASE_ITERATION_CYCLE, speed, 0, brightness)





local function recalibrate_timer()
  duty_timer:stop()
  duty_timer:unregister()

  if power == false then
    return
  end


  duty_timer:register(20, tmr.ALARM_AUTO, function()
    iterations = (iterations + 10) % 10000
    local values = lights_a:iterate(iterations)
    pwm.setduty(PIN_ENA, values.brightness_this_itr)
    if values.light_idx == 0 then
      gpio.write(PIN_IN2, gpio.LOW)
      gpio.write(PIN_IN1, gpio.HIGH)
    else
      gpio.write(PIN_IN1, gpio.LOW)
      gpio.write(PIN_IN2, gpio.HIGH)
    end
  end)
  duty_timer:start()

end



recalibrate_timer()









