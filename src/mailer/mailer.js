import transporter from "./transporter";
import logger from "../utils/logger";


// fnction to trigger email
let sendMail = async (details, template) => {

  let body = {
    from 			: process.env.SUPPORT_EMAIL,
    to 				: details.to,
    subject 	: details.subject,
    template 	: template,
    context 	: details
  };
  
  try {
    if(await transporter.verify()){
      return await transporter.sendMail(body);
    } 
  } catch (e) {
    logger.error("problem sending email " + e);
  }

};

export default sendMail;
