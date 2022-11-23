require "light_timer"





local l = LightTimer:new()
l:set_config(100, 0, 70)

for i = 0, 2000 do
  if i % 50 == 0 then
    l:iterate(i)

  end
end

