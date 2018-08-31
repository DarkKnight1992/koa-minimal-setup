import {connect} from "./connection";

let driver;
if(process.env.DB === "mongodb") {
  driver = require("./mongodb");
}

if(process.env.DB === "postgre") {
  driver = require("./postgre");
}


export default function () {
  return async function (ctx, next) {
    let dbPool = driver.getPool();
    let dbClient = driver.getClient();
    
    if(!dbPool || !dbClient) {
      await connect();
      dbPool = driver.getPool();
      dbClient = driver.getClient();
    }

    ctx.dbPool = dbPool;
    ctx.dbClient = dbClient;
    ctx.dbPool && ctx.dbClient;
    await next();
  };
}