import Router from "koa-router";
import Composer from "koa-compose";
import User from "./UserRoutes";

var router = new Router({
  prefix: process.env.BASE_API_URL
});  //Prefixed all routes with /api/v1

router.get("/", async (ctx) => {
  ctx.body = "api routes";
});

export default Composer([router.routes(), User]);