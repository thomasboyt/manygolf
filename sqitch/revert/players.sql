-- Revert manygolf:players from pg

BEGIN;

DROP TABLE players;

COMMIT;
