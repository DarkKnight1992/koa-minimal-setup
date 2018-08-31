import { Pool, Client } from "pg";

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// const dbConfig = {
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME
// };
let pool, client;

export async function createPool() {
  if(!pool) pool = new Pool({connectionString: connectionString});
  return pool;
}

export async function createClient() {
  if(!client) client = new Client({connectionString: connectionString});
  return client;
}

export function getPool() { return pool;}
export function getClient() { return client;}