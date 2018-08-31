import Router from "koa-router";
import {UserController} from "../controllers";

var router = new Router();

router.get("/verify/user", UserController.verifyUser);

if(process.env.NODE_ENV === "maintenance") {
  router.get("*", async (ctx) => {
    ctx.body = "<h1></ht>Site is Under Maintenance</h1>";
  });
}
if(process.env.NODE_ENV !== "maintenance" && process.env.FRONTEND) {
  router.get("*", async (ctx) => {
    await ctx.render("index.html");
  });
}

export default router.routes();