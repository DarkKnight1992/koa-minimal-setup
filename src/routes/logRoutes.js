import Router from "koa-router";
import { logController } from "../controllers";

var router = new Router({
  prefix: "/logs"
});  //Prefixed all routes with /movies

router.get("/", logController.findLogs);

export default router.routes();