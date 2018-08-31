import logger from "../../utils/logger";

let driver;
if(process.env.DB === "mongodb") {
  driver = require("./mongodb");
}

if(process.env.DB === "postgre") {
  driver = require("./postgre");
}


export async function connect() {
  const dbPool = driver.getPool();
  const dbClient = driver.getClient();
  try {
    if(!dbPool && !dbClient) {
      await driver.createPool();
      await driver.createClient();
    }
  } catch (e) {
    logger.error("unable to connect to db", e);
  }
  
  return "db connected";
}
