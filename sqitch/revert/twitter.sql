-- Revert manygolf:twitter from pg

BEGIN;

SET client_min_messages = 'warning';

ALTER TABLE manygolf.players
  DROP COLUMN twitter_id,
  DROP COLUMN twitter_token,
  DROP COLUMN twitter_secret;

COMMIT;
