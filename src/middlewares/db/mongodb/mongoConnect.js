import {MongoClient} from "mongodb";
import logger from "../../../utils/logger";
// Connection URL
const url = "mongodb://localhost:27017";
// Database Name
const dbName = "test";

let pool, client;

export async function createPool() {
  if(!pool) {
    try {
      const db = await MongoClient.connect(process.env.DB_HOST || url, {  
        poolSize: 10,
        useNewUrlParser: true
      });
      pool = db.db(process.env.DB_NAME || dbName);
    } catch (e) {
      logger.error("unable to connect to db", e);
    }
  }
  return pool;
}

export async function createClient() {
  if(!client) {
    try {
      const db = await MongoClient.connect(process.env.DB_HOST || url, {useNewUrlParser: true});
      client = db.db(process.env.DB_NAME || dbName);
    } catch (e) {
      logger.error("unable to connect to db", e);
    }
  }
  return client;
}

export function getPool() { return pool; }
export function getClient() { return client; }
