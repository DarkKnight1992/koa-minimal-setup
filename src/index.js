import Koa from "koa";
import http from "http";
import bodyParser from "koa-body";
import logger from "./logger";
import movies from "./router";
require("./db");
var Router = require("koa-router");

const app = new Koa();

//Set up body parsing middleware
app.use(bodyParser({
  formidable:{uploadDir: "./uploads"},
  multipart: true,
  urlencoded: true
}));


var router = new Router();

router.get("/", (ctx) => {
  // ctx.router available
  ctx.body = "Hello World here";
});
 
app
  .use(router.routes())
  .use(movies.routes())
  .use(router.allowedMethods());

// x-response-time

// app.use(async (ctx, next) => {
//  const start = Date.now();
// 	await next();
// 	const ms = Date.now() - start;
// 	ctx.set("X-Response-Time", `${ms}ms`);
// });

// // logger

// app.use(async (ctx, next) => {
// 	const start = Date.now();
// 	await next();
// 	const ms = Date.now() - start;
// 	logger.info(`${ctx.method} ${ctx.url} - ${ms}`);
// });

// // response

// app.use(async ctx => {
// 	ctx.body = "Hello World test";
// });

app.on("error", err => {
  logger.error("server error", err);
});

http.createServer(app.callback()).listen(3000, function(){
  logger.info("server running on port", 3000);
});