-- Revert manygolf:players from pg

BEGIN;

DROP TABLE manygolf.players;

COMMIT;
