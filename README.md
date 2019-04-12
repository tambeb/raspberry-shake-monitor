# About
A logging server and a separate server for web based live charting of Raspberry Shake data. The logger logs data received from your Shake's UDP output ([Raspberry Shake Data Producer UDP Port Output — Instructions on Setting Up Your Raspberry Shake](https://manual.raspberryshake.org/udp.html)). If you have a valid SSL certificate and enable https the web app will run as a PWA and be optionally installable on a number of platforms including Linux, Android and Windows ([Progressive Web Apps  |  Web  |  Google Developers](https://developers.google.com/web/progressive-web-apps/)).

## Demo
[Live Demo with my Raspberry Shake](https://shakedemo.tambeb.com)

## Installation 
```
git clone https://github.com/tambeb/raspberry-shake-monitor.git
cd raspberry-shake-monitor
npm install
cd www
npm install
```
### Settings
There are a few settings that you can optionally change. 

#### Logger Server
Settings are stored in __serverLoggerSettings.json__ 
  * udpPortShake - this is the port that you tell your Shake to send to
  * udpPortServerWeb - this is the port used to communicate with the web server (note: this should match the port set in the web server settings)

#### Web Server 
Settings are stored in __serverWebSettings.json__
  * httpPort - port to be used for http website
  * httpsPort - port to be used for https website
  * udpPort - port to be used to communicate with the logging server (note: this should match the port set in the logging server settings)
  * httpsServer - whether or not you want to run an https server (you have to create or have an SSL cert)
  * passphraseFile - file that contains your passphrase for your SSL cert
  * pfxFile - filename of your cert in .p12 format
  
### Running
There are two servers, one for logging UDP data from the Shake and another for serving up the web app. The web server communicates with the logger to get Shake data as needed. I have them separated so that making changes to the web app (requiring you to restart it) won't interrupt the data logging. Once you get your shake set up and sending you can more or less leave the logger running indefinitely so that you can have uninterrupted historical data.
  
Quick start:
```
node server_logger.js
```
and
```
node server_web.js
```
Once you've got things working there are a few bash scripts for running things in "production" mode. You'll see that they use PM2 for managing the Node.js processes and set everything to run automatically at startup. To go this route, which I recommend, run __start_all.sh__. 

### Notes
My particular shake has EHZ and HDF data. I think the other data types, if your shake has them, will be handled fine, but since I only tested on mine it's entirely possible that non-EHZ/HDF data will outright break everything. If that happens please let me know of course, it'd be a super quick fix.

All development and testing was done on very capable computers and only one mobile phone (my Pixel 3 XL, so pretty capable also). I say this because the web app is pretty CPU intensive (on whatever client device you're viewing on) when doing live charting set to frequent updates, and when pulling historical data the server also hits its CPU decently hard. So I have no idea what kind of luck you'll have if you try to view the web app on a 900-year-old HTC phone or try to install on a Raspberry Pi or something like that. Also, with something like a Pi, you'll probably have the same SD card issues that the Shake has (i.e., needing a high-grade card because of frequent writes). But I think you should be totally fine running it on a random old computer you have laying around somewhere (if you want it on a standalone device and not your daily use computer). 

I don't do Apple. So I don't know how the mobile version of the web app will look on an iPhone. Or how the desktop version will look on macOS. If either of them is broken or weird, it's your fault because you chose Apple. I recommend you seal yourself in a barrel and fall off a waterfall. (If you know where that quote is from without Googling it then you are awesome and I'd like to be your friend.)  

I'm still working on adding the spectrum views. 

The historical data viewing is more or less garbage right now, both in terms of interface and performance. When you pick the period to view it'll take a few seconds to load up. Eventually I plan on having a much smoother and lighter historical data viewer.    

I'm not a developer/programmer by trade. I went to school for math and work at a hedge fund as a quant, so as far as programming goes I'm self-taught and my coding style is that I have no style. My code is ugly. I don't comment EVER (good luck figuring out my retarted program flow if you decide you want to edit my code). I'm not efficient. I don't follow best practices (or know a lot of them).     
