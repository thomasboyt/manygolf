-- Revert manygolf:appschema from pg

BEGIN;

DROP SCHEMA manygolf;

COMMIT;
