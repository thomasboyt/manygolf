import randomColor from 'randomcolor';
import nameGen from './nameGen';

import crypto from 'crypto';

import pgp from 'pg-promise';

let db: pgp.IDatabase<any>;
export function configureDatabase() {
  db = pgp()(process.env.DATABASE_URL);
}

export interface User {
  id: number;
  name: string;
  color: string;
  authToken: string;
}

function padZeroes(num: number): string {
  const s = `0000${num}`;
  return s.substr(s.length - 4);
}

function numberGen(): string {
  // return a random 4-digit number to use as a unique identifer
  const max = 0;
  const min = 9999;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return padZeroes(num);
}

function genAuthToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(24, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }

      const str = buf.toString('hex') + Date.now();
      resolve(str);
    });
  });
}

export async function createUser(): Promise<User> {
  const color = randomColor();
  const authToken = await genAuthToken();

  let name;

  // TODO: this is duuuuumb
  let iterations = 0;
  while (true) {
    name = `${nameGen()} #${numberGen()}`;
    const nameExists = await db.query('SELECT EXISTS(SELECT 1 FROM manygolf.players WHERE name=$1 LIMIT 1)', [name]);
    if (!nameExists[0].exists) {
      break;
    }

    iterations += 1;

    if (iterations > 10) {
      throw new Error(`failed to create name for user after 10 iterations`);
    }
  }

  const rows = await db.query('INSERT INTO manygolf.players (color, name, authentication_token) VALUES ($1, $2, $3) RETURNING id', [color, name, authToken]);

  const row = rows[0];

  return {
    id: row.id,
    name,
    color,
    authToken,
  };
}

export async function getUserByAuthToken(token: string): Promise<User> {
  const rows = await db.query('SELECT * FROM manygolf.players WHERE authentication_token=$1', [token]);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    color: row.color,
    authToken: row.authentication_token,
  };
}

export async function getUserByTwitterId(twitterId: string): Promise<User> {
  const rows = await db.query('SELECT * FROM manygolf.players WHERE twitter_id=$1', [twitterId]);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    color: row.color,
    authToken: row.authentication_token,
  };
}

export async function setUserTwitterInformation(
  userId: number, twitterId: string, twitterToken: string, twitterSecret: string) {
  await db.query(
    'UPDATE manygolf.players SET twitter_id=$1, twitter_token=$2, twitter_secret=$3 WHERE id=$4',
    [twitterId, twitterToken, twitterSecret, userId]);
}