import {Express} from 'express';
import {OAuth} from 'oauth';

import {
  getUserByTwitterId,
  getUserByAuthToken,
  setUserTwitterInformation,
} from './models';

/*
 * Here's how Twitter auth works:
 * 1. Visit /twitter-sign-in in a new window. This gets a request token and sends you to
 *    twitter.com/oauth/authenticate to do the Twitter OAuth flow.
 *
 * 2. Get redirected to /twitter-sign-in-callback. This page gets an access token, and then
 *    sends it back to the original page using window.opener.postMessage.
 *
 * 3. Original page then sends the Twitter token+secret to POST /twitter-auth-token, along with
 *    their Manygolf auth token. This endpoint either fetches the account already associated with
 *    this Twitter ID, or adds the Twitter token+secret+ID to the current auth token's account.
 *    Either way, an auth token is returned that is the new Manygolf auth token for the client.
 *    The client sets this auth token and refreshes.
 */

export default function registerTwitterEndpoints(app: Express) {
  const oa = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET,
    '1.0A',
    `${process.env.APP_URL}/server/twitter-sign-in-callback`,
    'HMAC-SHA1'
  );

  app.get('/twitter-sign-in', (req, res) => {
    oa.getOAuthRequestToken((err, token, tokenSecret, parsedQueryString) => {
      if (err) {
        console.error(`Twitter request token error`);
        console.error(err);
        res.send(500);
        return;
      }

      const authUrl = `https://twitter.com/oauth/authenticate?oauth_token=${token}`;

      res.redirect(authUrl);
    });
  });

  app.get('/twitter-sign-in-callback', (req, res) => {
    oa.getOAuthAccessToken(req.query.oauth_token, '', req.query.oauth_verifier, (err, token, secret, authorizeUrl, additionParameters) => {
      if (err) {
        console.error(`Twitter access token error`);
        console.error(err);
        res.send(500);
        return;
      }

      const resp = `
      <html>
        <head>
          <script>
            window.opener.postMessage(JSON.stringify({
              type: 'twitterAuth',
              token: "${token}",
              secret: "${secret}",
            }), document.location.origin);
            window.close();
          </script>
        </head>
      </html>`;

      res.send(200, resp);
    });
  });

  app.post('/twitter-auth-token', async (req, res) => {
    const authToken = req.body.authToken;
    const twitterToken = req.body.twitterToken;
    const twitterSecret = req.body.twitterSecret;

    const user = await getUserByAuthToken(authToken);

    if (!user) {
      res.send(500, 'invalid user auth token');
      return;
    }

    oa.get('https://api.twitter.com/1.1/account/verify_credentials.json', twitterToken, twitterSecret, async (err, data) => {
      if (err) {
        console.error(`Twitter user fetch error`);
        console.error(err);
        res.send(500);
        return;
      }

      const twitterId = JSON.parse(data).id_str;

      const twitterUser = await getUserByTwitterId(twitterId);

      if (!twitterUser) {
        await setUserTwitterInformation(user.id, twitterId, twitterToken, twitterSecret);
        res.send(200, { authToken: user.authToken });
      } else {
        res.send(200, { authToken: twitterUser.authToken });
      }
    });
  });
}