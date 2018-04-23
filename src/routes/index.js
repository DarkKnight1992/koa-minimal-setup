import Router from "koa-router";
import logRoutes from "./logRoutes";
var router = new Router();

router.get("/", (ctx) => {
  ctx.body = "Hello World here";
});

export default router.routes();

export {
  logRoutes
};