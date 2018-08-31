import { 
  UserModel
} from "../models";
import passport from "koa-passport";
import localPassport from "passport-local";
import bCrypt from "bcrypt-nodejs";
import logger from "../utils/logger";

export default function () {
  return async function (ctx, next) {
    // modules
    const LocalStrategy = localPassport.Strategy;

    passport.serializeUser(function(user, done) {
      if(user) {
        done(null, user._id);
      } else {
        done(null, null);
      }
    });
 
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await UserModel.findById(id);
        if(user) {
          done(null, user);
        } else {
          done(null, {});
        }
      } catch (e) {
        logger.error(e);
        done(e, {});
      }
    });

    passport.use("register", new LocalStrategy(
      { 
        usernameField: "email",
        name: "signup",
        passReqToCallback : true
      },
      async function(ctx, username, password, done) {
        let findOrCreateUser = async function(){
          try {
            const user = await findUser(username);
            
            // already exists
            if (user) {
              return done("user already exist", false);
            } else {
              const {email, password} = ctx.body;
              const token = createHash(new Date());
              const newUser = {
                username: username,
                password: createHash(password),
                email: email,
                verificationcode: token
              };
                          
              await UserModel.add(newUser);
              
              return done(null, newUser, token);
            }
          } catch (error) {
            // logger.error(error);
            return done(error, false);
          }
        };
     
        // Delay the execution of findOrCreateUser and execute 
        // the method in the next tick of the event loop
        process.nextTick(findOrCreateUser);
      })
    );

    passport.use("login", new LocalStrategy(
      {
        passReqToCallback : false
      },
      async function(username, password, done) { 
        let status, message, user;
        try {
          user = await findUser(username);
          if (!user){
            status = 401;
            message =  "Invalid username "+ username;
          } else if (!isValidPassword(user, password)){
            // User exists but wrong password, log the error 
            status = 401;
            message =  "Invalid Password ";
          } else if(!user.data.isverified || !user.data.isactive) {
            status = 401;
            message =  !user.data.isverified ? "Please verify your email" : "Your Account is disabled or deleted. Contact us as support@zoklean.com";
          } else {
            // User and password both match, return user from 
            delete user.password;
            status = 200;
            message = "Login SuccessFull";
          }
          
        } catch (error) {
          status =  500;
          message = error;
        }
        
        // add response to request
        ctx.login = {
          status,
          message,
          user 
        };
        
        // done method which will be treated like success complete request
        done(null, user);
      }
    ));

    passport.use("updateUser", new LocalStrategy(
      { 
        passReqToCallback : false
      },
      async function(username, password, done) {
        const existedUser = await findUser(username);

        let status, message, user;
        
        if(existedUser){
          if(isValidPassword(existedUser, password)){
            const {username, email, ...data} = ctx.request.body;
            delete data.password;

            const updateUser = {};
            if(email) {
              updateUser.email = email;
              updateUser.username = email;
            }

            if(data) updateUser.data = data;

            try {
              await findAndUpdate(username, updateUser);
              status = 200;
              message = "User details updated";
              user = await findUser(username);
              
            } catch (error) {
              status = 503;
              message = "Internal Server Error";
            }

          } else {
            status = 401;
            message = "Invalid password!";
          }
        } else {
          status = 401;
          message = "User doesn't exist";
        }
        ctx.auth = {
          status,
          message,
          user
        };
        done(null, existedUser);
      })
    );

    async function findUser(user) {
      if(process.env.DB === "mongodb") {
        return await UserModel.findOne({username: user});
      }
      if(process.env.DB === "postgre") {
        return await UserModel.findOne("username = $1", user);
      }
    }

    async function findAndUpdate(user, update) {
      if(process.env.DB === "mongodb") {
        return await UserModel.update({username: user}, {$set: update});
      }
      if(process.env.DB === "postgre") {
        return await UserModel.update("username = $1", user, update);
      }
    }

    await next();
  };
}

const isValidPassword = function(user, password){
  try {
    return bCrypt.compareSync(password, user.password);
  } catch (error) {
    logger.error("unable to compare passwords "+ error);
    throw new Error (error);
  }
};

const createHash = function(password){
  try {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  } catch (error) {
    logger.error(error);
    throw new Error (error);
  }
};