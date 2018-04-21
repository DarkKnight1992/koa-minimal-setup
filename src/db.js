import mongodb from "mongodb";
import logger from "./logger";

const MongoClient = mongodb.MongoClient;

// Connection URL
const url = "mongodb://localhost:27017";

// Database Name
const dbName = "local";

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  logger.info("Connected successfully to server");

  const db = client.db(dbName);

  findDocuments(db, function() {
    client.close();
  });

  client.close();
});

const findDocuments = function(db, callback) {
  // Get the documents collection
  const collection = db.collection("startup_log");
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    logger.info("Found the following records");
    logger.info(docs);
    callback(docs);
  });
};