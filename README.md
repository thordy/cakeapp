# DartApp
Playground for NodeJS, Express and Sqlite3

## Requirements
npm, nodejs\
Application uses bookshelf.js library as ORM for node.js and Knex query builder.

## Installation
`npm install`

## How to run the app
`node app.js`

## Database migration
DB migration is handled by knex. Scripts are stored in migrations subdirectory.
You may want to set up knex to run globally first

`npm install -g knex`

To migrate database simply run

`knex migrate:latest`

http://perkframework.com/v1/guides/database-migrations-knex.html

