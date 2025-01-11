# Express + SQL API boilerplate

This will provide a boilerplate codebase for an express/nodejs api built ontop of sequelize.
At the moment, it supports sqlite and postgres. This is configured in the .env file.
An example env file is provided.

## Dev

```sh
$ cp .env.example .env
$ nvm use # optional
$ npm i
$ npm run dev
```

## The contrib folder

- A [bruno](https://www.usebruno.com/) collection to interact with the api.
- An nginx config to host this thing.
- To start the app server on a VM use the provided `pm2.config.js` file.

```sh
$ npx pm2 start contrib/pm2.config.js
```

## Deployment

There is a github action for deploying the app to a VM
in the `.github` folder. This requires the presence of a `dev` branch and the
VMs ssh details set in the GH project's settings > secrets > actions section.

In the server, the `pm2.config.js` file would be in the root folder
if deployed via the provided GH action.

## Access Tokens and Refresh Tokens

The api author suggests the frontend and backend to be hosted from the same domain.

For example,

- https://myapp.com - frontend/client side
- https://myapp.com/api - this backend

This way when the api's login route is called, an http-only cookie will be set with the
refresh token. The access token by default expires in 15 mins. The refresh token
on the other hand by default expires in 30 days. So keep it safe. This is just a
suggestion, if anyone has a better way, please share.

**Happy Hacking!**
