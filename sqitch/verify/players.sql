-- Verify manygolf:players on pg

BEGIN;

-- XXX Add verifications here.
SELECT id, authentication_token, name, color, timestamp
  FROM manygolf.players
WHERE FALSE;

ROLLBACK;
