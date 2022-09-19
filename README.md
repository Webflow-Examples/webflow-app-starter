# Webflow App Starter

Use this starter to spin-up a Webflow App server, enable OAuth installation, create webhooks on sites, and respond to those webhook events.

This project is not meant to be used in production - only an example of how to create an integtation that uses OAuth. The access tokens are being stored in a KVS and looked-up by site id. In production, you'll need to encrypt these access tokens and likely store more than just the token.

## Get Running

1. [Register](https://developers.webflow.com/#oauth-applications) an OAuth App in Webflow
2. Copy `.env.example` to `.env` and populate the values
3. Clone and run `yarn install` or `npm install`
4. run `yarn dev` or `npm run dev` to start the server

## This starter uses the following tools

- [Fastify](https://www.fastify.io/) for a webserver
- [Level](https://github.com/Level/level) for a key-value store
- [Webflow SDK](https://github.com/webflow/js-webflow-api) for the Webflow API client
- [Nodemon](https://nodemon.io/) for live-reload during development

## Requirements

This server needs to be accessible by Webflow to recieve Webhook events. You have a couple of options to enable this:

#### Free Hosts

- [Railway.app](https://railway.app/)
- [Fly.io](https://fly.io/)
- [Vercel](https://vercel.com/)

#### Tunnel

- [ngrok](https://ngrok.com/)
- [localtunnel](https://theboroer.github.io/localtunnel-www/)
