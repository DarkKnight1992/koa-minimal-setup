import Koa from "koa";
import bodyParser from "koa-body";
import logger from "./logger";
import indexRoute, { logRoutes } from "./routes";

import db from "./db";

const app = new Koa();

//Set up body parsing middleware
app.use(bodyParser({
  formidable:{uploadDir: "./uploads"},
  multipart: true,
  urlencoded: true
}));

app
  .use(db())
  .use(logRoutes)
  .use(indexRoute);

app.on("error", err => {
  logger.error("server error", err);
});

module.exports = app;