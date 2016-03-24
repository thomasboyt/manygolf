massively multiplayer proceedurally-generated 2d golf in the style of trackmania

### develop

in two different sessions:

```
npm run server
npm run dev
```

and navigate to localhost:8080

### production

create a secret.json with ssh deets

```
{
  "host": "zombo.com",
  "username": "bigjeffrey",
  "path": "/home/bigjeffrey/manygolf"
}
```

on your server, make sure you have node+npm and forever (`npm install -g forever`) installed

then locally:

```
npm run deploy
```

this builds files locally and bundles up built files + source, deploys it to your specified path, and runs it.

the server runs using the [forever](https://github.com/foreverjs/forever) tool. you can start/stop/look at logs with this.

it's up to you to expose the server (port `4080`) and the files in `build/` to the world. nginx can do it!

### notes

architecture
  - server 
    - generate level
    - send level to client
    - level is probably a SVG-like single line?
    - stub out with json file at start
  - client
    - render level data
    - on stroke input, send direction + power to server
  - universal code bits
    - calculating final position of ball/ball physics
  - netcode, if you can call it that
    - when user hits ball, power+direction is sent to server
    - server sends power+direction+ball ID to all users
    - client runs physics simulation on all balls in real-time to render them
    - server runs physics simulation in real-time to determine if you hit it into the hole

protocol
  - server events
    - ball hit
      - ID
      - velocity
      - direction
    - ball in goal
      - ID
    - ball fell off side of world (reset)
      - ID
    - new level
      - level data
  - client events
    - ball hit
      - velocity
      - direction
    - disconnect?
