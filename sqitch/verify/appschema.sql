-- Verify manygolf:appschema on pg

BEGIN;

SELECT pg_catalog.has_schema_privilege('manygolf', 'usage');

ROLLBACK;
