require "light_timer"





local l = AlternatingLightTimer:new()
l:set_config(1000, 100, 0, 100)

for i = 0, 10000 do
  if i % 50 == 0 then
    print(l:iterate(i))

  end
end

