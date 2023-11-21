Set-Location -Path $PSScriptRoot
npm run build
cp package.json,package-lock.json,assets\* dist\

scp -r dist\* root@xmastree:/root/xmastree
ssh xmastree "chmod +x /root/xmastree/install.sh"
# ssh xmastree "systemctl restart xmastree"
