
import logger from "../utils/logger";
import mail from "../mailer";

const controller = {
  emailNewUser: async (user, token) => {
    try {
      await mail({
        to: user.email,
        subject: "Login Details",
        username: user.email,
        password: user.password,
        name: user.name,
        url: process.env.SITE_URL + "/verify/user/",
        token: token
      }, "email-verification");
      return 1;
    } catch (e) {
      logger.error("error sending email " + e, );
      return 0;
    }
  },
  emailOrderConfirmation: async (orderDetails, paymentInfo) => {
    try {
      await mail({
        to: process.env.ADMIN_EMAIL,
        subject: "Order Details",
        orderDetails: orderDetails,
        paymentInfo: paymentInfo,
        url: process.env.SITE_URL
      }, "email-order-confirm");
      return 1;
    } catch (error) {
      logger.error("error sending order confirmation email " + error );
      return 0;
    }
  }
};

export default controller;
