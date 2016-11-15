-- Deploy manygolf:twitter to pg
-- requires: players

BEGIN;

SET client_min_messages = 'warning';

ALTER TABLE manygolf.players
  ADD COLUMN twitter_id TEXT UNIQUE,
  ADD COLUMN twitter_token TEXT,
  ADD COLUMN twitter_secret TEXT;

COMMIT;
