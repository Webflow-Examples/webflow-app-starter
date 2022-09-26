import { AuthorizationCode } from "simple-oauth2";
import { createHmac } from "crypto";
import Client from "webflow-api";
import { Level } from "level";

class App {
  /**
   * @param {string} clientId The OAuth client ID for the app
   * @param {string} clientSecret The OAuth client secret for the app
   */
  constructor(clientId, clientSecret) {
    this.clientSecret = clientSecret;

    // KVS for app data
    this.data = new Level("data");

    // OAuth options
    this.oauth = new AuthorizationCode({
      client: {
        id: clientId,
        secret: clientSecret,
      },
      options: {
        bodyFormat: "json",
        authorizationMethod: "body",
      },
      auth: {
        tokenHost: "https://api.webflow.com",
        authorizeHost: "https://webflow.com",
      },
    });
  }

  /**
   * Install an App and get the user's access token
   *
   * @param {string} code The authorization code used to retrieve an access_token for the user. Can only be used once.
   *
   * @returns The user's access token
   */
  async install(code) {
    const access = await this.oauth.getToken({ code });
    return access.token.access_token;
  }

  /**
   * Create Webhooks for all sites available
   *
   * @param {string} triggerType The webhook trigger type to listen for
   * @param {string} url The url to send the webhook events to
   * @param {string} token The access token to use for creating the webhooks
   *
   * @returns An array of webhook created
   */
  async addWebhooks(triggerType, url, token) {
    const client = new Client({ token });
    const sites = await client.sites();
    const created = [];

    // create a webhook for each site
    for (const { _id } of sites) {
      const args = { triggerType, siteId: _id, url };
      const webhook = await client.createWebhook(args);
      created.push(webhook);

      // store token for a site_id to handle webhooks events
      await this.data.put(webhook.site, token);
    }

    // Return all webhooks created
    return created;
  }

  /**
   * Generate a URL for a user to install the App on Webflow
   *
   * @param params
   * @param params.redirectURI String representing the registered application URI where the user is redirected after authentication
   * @param params.scope String or array of strings representing the application privileges
   * @param params.state String representing an opaque value used by the client to main the state between the request and the callback
   *
   * @return The Webflow installation url
   */
  installUrl(params = {}) {
    return this.oauth.authorizeURL(params);
  }

  /**
   * Verify the an incoming request is from Webflow
   *
   * @param {object} headers An object containing the request headers
   * @param {object} body The request body
   * @returns The results of the HMAC verification
   */
  verifyRequest(headers, body) {
    const signature = headers["x-webflow-signature"];
    const timestamp = Number(headers["x-webflow-timestamp"]);
    const content = timestamp + ":" + JSON.stringify(body);

    // timestamp shouldn't be older than 5 minutes
    const ellapsedTime = Date.now() - timestamp;
    if (ellapsedTime > 60 * 5) return false;

    // compare signature
    const hmac = createHmac("sha256", this.clientSecret);
    return signature === hmac.update(content).digest("hex");
  }
}

export default App;
