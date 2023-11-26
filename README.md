# XMas Tree Lights


## Hardware

### Parts
- Raspberry Pi (I use 3b)
- 1 [L298N Motor Driver](https://components101.com/modules/l293n-motor-driver-module)
- 1 LED string (for star)
- [2 reversible LED strings](https://www.aliexpress.com/item/1005006060314254.html) (find one with "modes")


### Wiring
- **Star**: GPIO12 PWM
- **Light 1**: GPIO13 ENA, GPIO26 IN1, GPIO6 IN2
- **Light 2**: GPIO25 ENB, GPIO23 IN1, GPIO24 IN2


![Circuit layout](./assets/circuit.png)



## Installation

Most of the installation stuff is useless as several values are hard coded. I'd suggest just taking the code and creating your own deploy procedures.

Run `./deploy.ps1` to deploy the files to the server. (hard coded server name/paths)
After that log on and either run install or just restart the service (depending on what changed).
