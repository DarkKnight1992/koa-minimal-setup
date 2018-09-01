import Koa from "koa";

// improt app routes
import indexRoute from "./routes";
import apiRoutes from "./routes/api";

// advanced utils
import path from "path";
import moment from "moment-timezone";
import fs from "fs";
import logger from "./utils/logger";

// import middlwares
import viewEngine from "koa-views";
import bodyParser from "koa-body";
import staticPath from "koa-static";
import passport from "koa-passport";
import session from "koa-session";
import morgan from "koa-morgan";
import db from "./middlewares/db";
import auth from "./middlewares/auth";

// App Setup
const app = new Koa();
const bodyParseOpts = {
  formidable:{
    uploadDir: path.join(__dirname, process.env.UPLOADS_DIR, "/uploads"),
    onFileBegin: function(name, file) {
      let path = file.path.split("/");
      path.pop();
      path = path.join("/");
      let filename = file.name.split(".");
      filename.pop();
      filename = filename.join("_");
      let type = file.type.split("/")[1];
      let datetime = moment().format("YYYY_MM_DD");
      file.path = `${path}/${filename}_${datetime}.${type}`;
      file.name = `${filename}_${datetime}.${type}`;
    }
  },
  multipart: true,
  urlencoded: true,
  strict: false
};

const publicPath = path.join(__dirname, process.env.VIEWS);
var accessLogStream = fs.createWriteStream(path.join(__dirname, process.env.ACCESS_LOGS), {flags: "a"});

// Create App Session
app.keys = [process.env.SESSION_SECRET];
app.use(session({}, app));

//Set up middlewares
if(process.env.NODE_ENV !== "maintenance") {
  app.use(bodyParser(bodyParseOpts)) // parse post body
    .use(viewEngine(publicPath), { extension: "html"}) // set view engine to use html
    .use(staticPath(path.join(__dirname, process.env.UPLOADS_DIR))) // set to serve static files
    .use(staticPath(publicPath)) // set to serve static files
    .use(db()) // db connection avaible dbPool and dbClient
    .use(auth()) // passport auth middleware
    .use(passport.initialize())
    .use(passport.session()) // create passport session
    .use(morgan("combined", {stream: accessLogStream})) // log every request
    .use(apiRoutes) // all api are under here
    .use(indexRoute); // indexroutes
} else {
  app.use(indexRoute);
}

app.on("error", err => {
  logger.error("server error " + err);
});

module.exports = app;
