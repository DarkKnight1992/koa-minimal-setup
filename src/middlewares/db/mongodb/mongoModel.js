import { ObjectId } from "mongodb";
import { getPool, getClient } from "./mongoConnect";
import Joi from "joi";

/**
 *  DATATYPES
    Double : "Double", //	1
    String : "String", //	2
    Object : "Object", //	3
    Array : "Array", //	4
    Binary : "Binary Data", // data	5
    Undefined : "Undefined", //	6
    UUID : "Object ID", // Id	7
    Boolean : "Boolean", //	9
    Date : "Date", //	10
    Null : "Null", //	11
    REGEX : "Regular Expression", // 12
    JS : "JavaScript", //	13
    symbol : "symbol", //	14
    JSS : "JavaScript with scope", // 	15
    Integer : "Integer", //	16 and 18
    timestamp : "timestamp", //	10
    Min : "Min key", // 	255
    Max : "Max key", // 	127
 */


export default class MongoNest {
  constructor(connectionType){
    this.db = connectionType === "pool" ? getPool() : getClient();
    this.collection = null;
    this.schema = null;
    this.schemaUpdate = null;
  }

  /**
   * create joi schema for validating
   * @param {Object} param0 
   */
  _schemaValidations({type, accepts, regex, min, max, required}) {

    let validations = Joi;
    switch(type) {
    case "Char":
    case "String":
    case "Text":
      validations = validations.string().allow("");
      break;
    default:
        // do nothing
    }
      
    switch(accepts){
    case "alphanum":
      validations = validations.alphanum();
      break;
    case "regex":
      validations = validations.regex(regex);
      break;
    case "email":
      validations = validations.email();
      break;
    default:
          // do nothing
    }
  
    if(min) validations = validations.min(min);
    if(max) validations = validations.max(max);
    if(required) validations = validations.required();
  
    return validations;
  }

  /**
   * 
   * @param {String} name 
   * @param {Object} schema 
   */
  async model(name, schema) {
    const client = this.db,
      fields = Object.keys(schema);
    
    let schemaValidations = {}, schemaValidationsUpdate = {};
    
    fields.forEach(field => {

      // create table schema
      const colData = schema[field];

      schemaValidations[field] = this._schemaValidations(colData);
      delete colData.required;
      schemaValidationsUpdate[field] = this._schemaValidations(colData);
    });

    this.schema = Joi.object().keys(schemaValidations);
    this.schemaUpdate = Joi.object().keys(schemaValidationsUpdate);

    try {
      this.collection = client.collection(name);
    } catch (e) {
      throw new Error (e);
    }
  }
  
  /**
   * 
   * @param {Object} doc 
   */
  async add(doc) {
    
    if(!doc 
      || (doc.constructor !== Object) 
      || (doc.constructor === Object && Object.keys(doc).length === 0) 
    ) {
      throw new Error("Supplied document is not supported! Only Objects Accepted");
    }

    const {error} = Joi.validate(doc, this.schema);
    if(!error) {
      try {
        return await this.collection.insertOne(doc);
      } catch (e) {
        throw new Error(e);
      }
    } else {
      throw new Error(error);
    }
  }

  /**
   * 
   * @param {Object Array} doc 
   */
  async addMany(docs) {
    if(!docs || !Array.isArray(docs) || (Array.isArray(docs) && docs.length === 0)) {
      throw new Error("Supplied document is not supported! Only Arrays Accepted");
    }
    
    let schemaError;
    docs.map(doc => {
      const {error} = Joi.validate(doc, this.schema);
      if(error) schemaError = error;
    });

    if(!schemaError) {
      try {
        return await this.collection.insertMany(docs);
      } catch (e) {
        throw new Error(e);
      }
    } else {
      throw new Error(schemaError);
    }
  }

  /**
   * 
   * @param {Object Array} doc 
   */
  async addBulk(docs) {
    if(!docs || !Array.isArray(docs) || (Array.isArray(docs) && docs.length === 0)) {
      throw new Error("Supplied document is not supported! Only Arrays Accepted");
    }

    try {
      if(Array.isArray(docs)) return await this.collection.insertMany(docs);
      return await this.collection.insertOne(docs);
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {String} id 
   */
  async findById(id){
    try {
      return await this.collection.findOne({_id:ObjectId(id)});
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   * @param {Mongo Options Object} opts 
   */
  async findOne(query = {}, opts = {}) { 

    try {
      return await this.collection.findOne(query, opts);
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   * @param {Mongo Options Object} opts 
   */
  async find(query = {},opts = {}){
    try {
      return await this.collection.find(query, opts).toArray();
    } catch (e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   * @param {Mongo Update Object} updateObj 
   */
  async update(query, update, opts ={}){
    try {
      return await this.collection.update(query, update, opts);
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   */
  async count(query){
    try {
      return await this.collection.count(query);
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   * @param {Mongo Options Object} opts 
   */
  async list(query = {}, opts = {}){
    try {
      return {
        list: await this.find(query,opts),
        count: await this.count(query)
      };
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {String} id 
   */
  async removeById(id){
    try {
      return await this.collection.remove({_id:ObjectId(id)});
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Mongo Query Object} query 
   */
  async remove(query){
    try {
      return await this.collection.remove(query);
    } catch(e){
      throw new Error(e);
    }
  }

  /**
   * 
   * @param {Array} ids 
   */
  async removeMany(ids){
    ids = ids.map((id)=> ObjectId(id));
      
    try {
      return await this.collection.remove({_id:{$in:ids}});
    } catch(e){
      throw new Error(e);
    }
  }

}