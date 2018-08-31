let driver;
if(process.env.DB === "mongodb") {
  driver = require("./mongodb");
}

if(process.env.DB === "postgre") {
  driver = require("./postgre");
}

export default driver.model;