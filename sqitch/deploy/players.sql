-- Deploy manygolf:players to pg
-- requires: appschema

BEGIN;

SET client_min_messages = 'warning';

CREATE TABLE manygolf.players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  authentication_token TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
