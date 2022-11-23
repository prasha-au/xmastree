
local function startup()
  if file.open("init.lua") == nil then
    print("init.lua deleted or renamed")
  else
    print("Running")
    file.close("init.lua")
    -- the actual application is stored in 'application.lua'
    dofile("application.lua")
  end
end

print("Pausing for 2 seconds...")
tmr.create():alarm(2000, tmr.ALARM_SINGLE, startup)

