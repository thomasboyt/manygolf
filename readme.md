# manygolf

[![Build Status](https://travis-ci.org/thomasboyt/manygolf.svg?branch=master)](https://travis-ci.org/thomasboyt/manygolf)

massively multiplayer procedurally-generated 2d golf. think desert golf + trackmania

## play

https://manygolf.club/

## dev guide

### installing

after cloning the repo, run `npm install` in the project root to get all necessary dependencies to build, test, and run.

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
  "ravenDSNPublic": "https://foo@app.getsentry.com/1234"
  "ravenDSNPrivate": "https://foo:bar@app.getsentry.com/1234"
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

### database

#### migrations

Manygolf uses the [sqitch](https://github.com/theory/sqitch/) tool for DB migrations. To use locally:

```
createdb manygolf
cd sqitch
cp sqitch.conf.default sqitch.conf
sqitch deploy
```

This should create the local schema for you.

Sqitch is also used to deploy to remote targets. You can add a remote target to sqitch.conf using `sqitch target add`. sqitch.conf is gitignored for this reason. If you're using Heroku, you can add a remote target like this:

```
sqitch target add production "`heroku config:get DATABASE_URL --remote heroku`"
```

#### configuring locally

Manygolf uses [dotenv](https://www.npmjs.com/package/dotenv) to load the database configuration from a `.env` file. Just `cp _env .env` and replace the database URL with your local DB, e.g.:

```
DATABASE_URL=postgres://your_username_here@localhost:5432/manygolf
```

## todos

https://trello.com/b/EfK64dEy/manygolf

## credits

* virtual buttons for mobile by Kenney: http://kenney.nl/assets/game-icons
  * Licensed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
* emoticons by Austin Condiff: https://thenounproject.com/acondiff/collection/simplicicons/
  * Licensed under [CC Attribution 3.0 United States](http://creativecommons.org/licenses/by/3.0/us/)
  * Excited by Austin Condiff from the Noun Project
  * Disgusted by Austin Condiff from the Noun Project
  * speech-bubble by Austin Condiff from the Noun Project
  * Gear by Austin Condiff from the Noun Project
