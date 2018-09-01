import Router from "koa-router";
import UserRoutes from "./UserRoutes";

var router = new Router({
  prefix: process.env.BASE_API_URL
});  //Prefixed all routes with /api/v1

router.get("/", async (ctx) => {
  ctx.body = "api routes";
});

router.use(UserRoutes);
export default router.routes();