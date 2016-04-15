# manygolf

[![Build Status](https://travis-ci.org/thomasboyt/manygolf.svg?branch=master)](https://travis-ci.org/thomasboyt/manygolf)

massively multiplayer procedurally-generated 2d golf. think desert golf + trackmania

## play

http://manygolf.disco.zone/

## dev guide

### running

in two different sessions:

```
npm run server-watch
npm run client-watch
```

and navigate to localhost:8080

### test

```
npm run test-watch
```

### production

create a secret.json with ssh & sentry deets

```
{
  "host": "zombo.com",
  "username": "bigjeffrey",
  "path": "/home/bigjeffrey/manygolf",
  "ravenDSN": "https://foobarbaz@app.getsentry.com/1234"
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

## todos

https://workflowy.com/s/LI0MSA3cG0

## credits

* virtual buttons for mobile by Kenney: http://kenney.nl/assets/onscreen-controls
