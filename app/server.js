import Webflow from "webflow-api";
import App from "./webflow.js";
import Fastify from "fastify";
import pinoInspector from "pino-inspector";


// Load environment variables from .env file
const { CLIENT_ID, CLIENT_SECRET, SERVER_HOST, PORT } = process.env;

// Create a new Webflow App instance
const app = new App(CLIENT_ID, CLIENT_SECRET);

const server = Fastify({
  logger: true,
});

// Response to Webhooks
server.post("/webhook", async (req, reply) => {
  // Get signature and timestamp headers for validation
  const request_signature = req.headers["x-webflow-signature"];
  const request_timestamp = req.headers["x-webflow-timestamp"];

  // Validate the request signature to ensure this request came from Webflow
  if (app.validateRequestSignature(request_signature, request_timestamp, req.body)){
    // Get site ID from webhook payload
    const { site } = req.body;

    // Get the site's access token
    const token = await app.data.get(site);

    // Initialize a new Webflow client
    const webflow = new Webflow({ token });

    // Make calls to the Webflow API
    const user = await webflow.get("/user");

    // Do other stuff with the API...

    // Return a 200 response to Webflow
    reply.statusCode = 200;
  } else {
    // Return a 403 response to Webflow if the request doesn't pass validation
    reply.statusCode = 403;
  }
});

// Install the App
server.get("/", async (req, reply) => {
  const { code } = req.query;

  // If a code is passed in, attempt to install the App
  // othersise, redirect to the install URL to start OAuth
  if (code) {
    // install the App and get an access token
    const token = await app.install(code);

    // add webhook to each site
    const triggerType = "site_publish";
    const url = SERVER_HOST + "/webhook";
    const webhooks = app.addWebhooks(triggerType, url, token);

    return webhooks;
  } else {
    // Generate a URL for a user to install the App on Webflow
    const installUrl = app.installUrl();

    // Redirect the user to the install URL
    return reply.redirect(installUrl);
  }
});

server.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) throw err;
});
