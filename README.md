# webex_web_calling_client

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)

The Webex SDK is a powerful and flexible tool for creating tailor-made experiences that enable any business vertical to incorporate voice and video to their environments. 

This repo consists on a very basic web client based on the examples provided in the official documentation showcasing the usage of the Browser SDK in a more visual and integrated way, with some interesting functionalities added, such as [Anonymous calling with auto-generated random caller IDs](https://github.com/ponchotitlan/webex_web_calling_client/wiki/%F0%9F%94%91-Guest-Issuer-Token-creation-and-individual-user-anonymous-access), and auto-dialing.

This clean and straightforward application is a Node based, client-side web portal which can be adapted to any use case, or leveraged for the incorporation of new features and capabilities.

For getting started, clone this repo in your local environment:
```
git clone https://github.com/ponchotitlan/https://github.com/ponchotitlan/webex_web_calling_client.git
```

## Project setup

Once cloned, enter the following command in the root location of this repo for installing the Node libraries included in the *package.json* file:
```
npm install
```

In order to enable the Webex functionalities, follow the instructions in this repo's [Wiki entry](https://github.com/ponchotitlan/webex_web_calling_client/wiki/%F0%9F%94%91-Guest-Issuer-Token-creation-and-individual-user-anonymous-access) in order to setup an Issuer ID and Shared Secret codes. Once setup, locate the *.env* file and enter them:
```
ISSUER_ID = <your issuer ID. See this repo's Wiki for more information>
SHARED_SECRET = <your shared secret. See this repo's Wiki for more information>
```

## Web server deployment

The project is built on top of the Parcel bundler. In order to execute the bundling process and mounting the incorporated Web server, execute the following command:
```
node_modules\.bin\parcel index.html
```

This defaults to the address *http://localhost:1234*. In order to change the port, you can execute Parcel in the following way:
```
node_modules\.bin\parcel index.html --port 1122
```

## User experience

The Welcome screen attempts to authenticate and create a Client session as soon as the application loads. The animation lets the user know once it is ready.

![Loading sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_01.PNG)

Once the authentication with the Webex services is complete, the following screen allows the user to input the personal or meeting Webex address in the bar on the top. The call button is enabled.

![Welcome sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_02.PNG)

The user can enter the desired personal or meeting Webex address and click *Call*. If the address is a meeting or PMR one and that event hasn't started, the following screen will show up, telling the user that the call landed in the Lobby or that it hasn't begun yet.

![Lobby sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_03.PNG)

Once the callee accepts the incoming call, or the meeting starts, the Webex call begins. The UI allows only for the most basic in-call operations (mute audio/video, exit).

![Call sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_04.PNG)

Additionally, the application can be accessed in the web browser with parameters in the URL:
- _meetingid=user-or-meeting@webexdomain.com_: 
- _callnow=yes_: The client inmediately attempts to call the address mentioned in the *meetingid* URL parameter

If so, the following screen is delivered, without the option to manually enter a callee address:

![Call sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_05.PNG)

Once a call ends in this mode, the following screen is showed, without allowing the user to trigger a new call by itself. This is ideal for one-use call cases:

![Call sreen](https://github.com/ponchotitlan/webex_web_calling_client/blob/main/screenshots/SCREEN_06.PNG)

Crafted with :heart: by [Alfonso Sandoval - Cisco](https://linkedin.com/in/asandovalros)