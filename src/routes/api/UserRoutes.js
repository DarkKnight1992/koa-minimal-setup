import Router from "koa-router";
import {UserController} from "../../controllers";
import passport from "koa-passport";

var router = new Router({
  prefix: "/user"
});

router.post("/register", UserController.register);
router.post("/login", passport.authenticate("login"),  UserController.login);
router.put("/", passport.authenticate("updateUser"), UserController.updateUser);
router.get("/is_logged_in", UserController.isLoggedIn);
router.get("/logout", UserController.logout);

export default router.routes();