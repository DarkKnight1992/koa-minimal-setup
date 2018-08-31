import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

let smtpDetails = {
  host 	  : process.env.MAIL_HOST,
  port 	  : parseInt(process.env.MAIL_PORT),
  secure  : JSON.parse(process.env.MAIL_SECURE),
  auth 	  : {
    user	  :	process.env.MAIL_USER,
    pass	  : process.env.MAIL_PASS
  }
};

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport(smtpDetails);

// setting up templates
transporter.use("compile", hbs({
  viewPath 	: path.join(__dirname, "../views/email_templates"),
  extName 	: ".html"
}));

// exporting function to express
export default transporter;
