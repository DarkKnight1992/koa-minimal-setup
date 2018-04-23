import Koa from "koa";
import db from "./db";
import bodyParser from "koa-body";
import path from "path";
import logger from "./logger";
import indexRoute, { logRoutes } from "./routes";


const app = new Koa();

//Set up body parsing middleware
app.use(bodyParser({
  formidable:{uploadDir: path.join(__dirname, process.env.UPLOADS_DIR)},
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