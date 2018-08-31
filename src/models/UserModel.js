import Model from "../middlewares/db/model";

const UserSchema = {
  username: {
    type: "String", 
    required: true,
  },
  password: {
    type: "String", 
    required: true
  },
  email: {
    type: "String", 
    accepts: "email", 
    required: true
  },
  verificationcode: {
    type: "String"
  }
};

const UserModel = new Model("pool");
UserModel.model("users", UserSchema);

export default UserModel;