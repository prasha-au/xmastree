
LightTimer = {
  total_cycle_time = nil,

  brightness_min = 0,
  brightness_max = 0,
  brightness_adjust_per_itr = 0,
}

function LightTimer:new ()
  local o = {}
  setmetatable(o, self)
  self.__index = self
  return o
end


function LightTimer:set_config(iterations, speed, brightness_min, brightness_max)
  self.total_cycle_time = math.floor(iterations / (speed / 100));
  self.brightness_min = brightness_min
  self.brightness_max = brightness_max
  local brightness_range = brightness_max - brightness_min
  self.brightness_adjust_per_itr = brightness_range / self.total_cycle_time * 2
end


function LightTimer:iterate(itr_num)
  local itr = itr_num % self.total_cycle_time

  local brightness_this_itr = self.brightness_min + self.brightness_adjust_per_itr * itr
  if itr > self.total_cycle_time / 2 then
    brightness_this_itr = self.brightness_max * 2 - brightness_this_itr
  end

  return brightness_this_itr
end






AlternatingLightTimer = {
  light_timer = nil,
}

function AlternatingLightTimer:set_config(iterations, speed, brightness_min, brightness_max)
  self.light_timer = LightTimer:new()
  self.light.set_config(iterations / 2, speed, brightness_min, brightness_max)
end


function AlternatingLightTimer:iterate(itr_num)
  local itr = itr_num & (self.light_timer.total_cycle_time * 2)
  local light_idx = itr > self.light_timer.total_cycle_time and 1 or 0
  return {
    brightness_this_itr = self.light_timer:iterate(itr),
    light_idx = light_idx,
  }
end

