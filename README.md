# Express + SQL API boilerplate

## Note:

Plain SQL queries are used in the repo. This is unmaintainable on the long run.
Ditching for sequelize implementation in `main` branch.

To start development, you'd need sqlite3 installed in your machine.

```
sudo apt install sqlite3
```

Then setup the database

```
sqlite3 myapp.db < app/db/sql/000-init.sql
```

Replace `myapp.db` with your preferred database name.

## Dev

```
$ cp .env.example .env
$ nvm use
$ npm i
$ npm run dev
```

**Happy Hacking!**
