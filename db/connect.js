import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.ATLAS_URI || '';
const client = new MongoClient(url);
let db;

async function run() {
  try {
    await client.connect();
    db = client.db(process.env.DB);
    return db;
  } catch (err) {
    console.error(err.stack);
    throw err;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call run() first.');
  }
  return db;
}

export { client, run, getDb }