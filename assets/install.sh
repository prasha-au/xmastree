npm ci --prefer-offline --production
cp xmastree.service /lib/systemd/system/xmastree.service
systemctl daemon-reload
systemctl restart xmastree
