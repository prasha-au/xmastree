npm run build
scp -r dist\* root@testpi:/root/xmastree
ssh testpi "cd xmastree && /root/.nvm/versions/node/v16.20.2/bin/node dev.js"
