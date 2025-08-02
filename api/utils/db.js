import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.ATLAS_URI || '';
const client = new MongoClient(url);
let db;
let usersDb;

async function run() {
  try {
    await client.connect();

    if (!process.env.DB) {
      throw new Error('Environment variable DB is not set.');
    }
    if (!process.env.USERS_DB) {
      throw new Error('Environment variable USERS_DB is not set.');
    }

    db = client.db(process.env.DB);
    usersDb = client.db(process.env.USERS_DB);
    return { db, usersDb };
  } catch (err) {
    console.error(err.stack || err);
    throw err;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call run() first.');
  }
  return db;
}

function getUsersDb() {
  if (!usersDb) {
    throw new Error('Users database not initialized. Call run() first.');
  }
  return usersDb;
}

export { client, run, getDb, getUsersDb }