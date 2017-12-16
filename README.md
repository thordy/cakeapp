# DartApp
Playground for NodeJS, Express and Sqlite3

## Requirements
npm, nodejs\
Application uses bookshelf.js library as ORM for node.js and Knex query builder.

## Installation
`npm install`

## How to run the app
`DEBUG:ckapp.* node app.js`
To run in a different environment specify `NODE_ENV=<env>`

## Database migration
To set up database in docker, run:
`docker-compose up -d`

DB migration is handled by knex. Scripts are stored in migrations subdirectory.
You may want to set up knex to run globally first

`npm install -g knex`

To migrate database simply run

`knex migrate:latest --env development`

`knex seed:run --env=development`

http://perkframework.com/v1/guides/database-migrations-knex.html



