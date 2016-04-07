#!/usr/env/bin node

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});

require('./main');
