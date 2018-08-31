import EmailController from "./EmailController";
import logger from "../utils/logger";
import passport from "koa-passport";
import { UserModel } from "../models";
import removeProp from "../utils/removeProp";

const formatUser = (user) => {
  if(user.data) {
    user = {...user, ...user.data};
  }

  user = removeProp(user, ["password", "data", "createdat", "isActive", "isVerified", "verificationCode"]);
  return user;
}; 

const controller = {
  register: async (ctx) => {
    return passport.authenticate("register", async (err, user, token) => {
      if (err) {
        logger.error(err);
        ctx.status = 401;
        ctx.body = err;
      }
      else if (!user) {
        ctx.status = 401;
        ctx.body = err;
      }
      else {
        await EmailController.emailNewUser(user, token);
        ctx.status = 200;
        ctx.body = "User Created SuccessFully";
      }
    })(ctx);
  },
  verifyUser: async (ctx) => {
    logger.info("verify user", ctx);    
    // const {email, verification_token} = ctx.request.query;
    // try {
    //   const user = await UserModel.update("username = $1 and data ->> 'verificationCode' = $2", [email, verification_token], {
    //     data: {
    //       verificationCode: "",
    //       isVerified: true
    //     }
    //   });
    //   logger.info(user);
    //   ctx.redirect(process.env.FRONTEND_URL + "/login?verificationsuccessful");
    // } catch (error) {
    //   logger.error(error);  
    //   ctx.status = 503;
    // }
  },
  login: async (ctx) => {
    let {user, status, message} = ctx.login;
    ctx.status = status;

    if(status === 200) {
      ctx.body = {
        userInfo: formatUser(user)
      };
      
    } else {
      ctx.body = message;
    }
  },
  updateUser: async (ctx) => {

    const { auth } = ctx;
    if(auth.status === 200){
      ctx.body = {
        user: formatUser(auth.user)
      };
    } else {
      logger.error(auth.message);
      ctx.body = auth.message;
    }
  },
  isLoggedIn: async (ctx) => {
    ctx.body = ctx.isAuthenticated();
  },
  logout: async (ctx) => {
    ctx.logout();
    ctx.body = true;
  },
  getUserInfo: async (ctx) => {
    ctx.body = formatUser(ctx.state.user);
  },
  uploadPhoto: async (ctx)=>{
    const {files, body} = ctx.request;
    const { userId } = body;
    const image_name = files.file.name;
    const image_path = files.file.path;

    const updateData = {
      data : {
        profileImage: image_name,
        imagePath: image_path
      }
    };  

    try {
      await UserModel.updateByID(userId, updateData);
      ctx.body = {
        successMsg:"Upload completed!",
        profileImage: image_name,
        imagePath: image_path
      };
    } catch (error) {
      logger.error(error);
      ctx.status = 503;
      ctx.body = {
        message : error
      };
    }
  }
};

export default controller;


