import mongodb from "mongodb";

// Connection URL
const url = "mongodb://localhost:27017";
// Database Name
const dbName = "local";

export default function () {
  return async function (ctx, next) {
    try {
      ctx.db = await mongodb.MongoClient.connect(process.env.DB_HOST || url);
      ctx.dbInstance = ctx.db.db(process.env.DB_NAME || dbName);
    } catch (e) {
      ctx.body = {
        success: false,
        error: "Database connection error",
      };

      return;
    }

    await next();

    ctx.db && ctx.db.close() && ctx.dbInstance;
  };
}