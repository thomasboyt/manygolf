import Raven from 'raven-js';

if (process.env.NODE_ENV === 'production') {
  Raven
    .config(process.env.RAVEN_DSN)  // see Webpack configuration!
    .install();
}
