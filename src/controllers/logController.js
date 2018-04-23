const collectionName = "startup_log";

const contoller = {
  findLogs: async function (ctx) {
    const collection = ctx.dbInstance.collection(collectionName);
    // Find some documents
    const docs = await collection.find({}).toArray();
    ctx.body = docs;
  }
};

export default contoller;
