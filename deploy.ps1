Set-Location -Path $PSScriptRoot
npm run build

$extraFiles = @(
  'package.json',
  'package-lock.json',
  'assets\install.sh',
  'assets\xmastree.service'
)

scp -r dist\* @extraFiles xmastree:/root/xmastree
ssh xmastree "chmod +x /root/xmastree/install.sh"
ssh xmastree "systemctl restart xmastree"
