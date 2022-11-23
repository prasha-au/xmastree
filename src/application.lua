

-- local gpio = require "gpio"
-- local mqtt = require "mqtt"
local pwm = require "pwm"
local tmr = require "tmr"


local MQTT_URL = "mqtt://192.168.1.4"
local DEVICE_ID = "xmastree"


local PIN_STAR = 1

local PIN_ENA = 2
local PIN_IN1 = 3
local PIN_IN2 = 4

local PIN_ENB = 5
local PIN_EN3 = 6
local PIN_EN4 = 7



local duty_timer = tmr.create()


local power = false
local brightness = 100
local speed = 70



pwm.setup(PIN_STAR, 200, 0)
pwm.setup(PIN_ENA, 200, 0)
pwm.setup(PIN_ENB, 200, 0)










local function recalibrate_timer()
  duty_timer:stop()
  duty_timer:unregister()

  if power == false then
    return
  end

  duty_timer:register(10, tmr.ALARM_AUTO, function()




  end)
  duty_timer:start()


end



recalibrate_timer()
