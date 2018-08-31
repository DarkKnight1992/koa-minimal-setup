import Joi from "joi";
import { getPool, getClient } from "./connection";

const dataTypes = {
  Timestamp: "TIMESTAMPTZ",  // is a timezone-aware timestamp data type.
  Date: "DATE", // the date values only.
  Time: "Time", // the time of day values.
  interval: "INTERVAL", // periods of time.
  Number: "INT", // a 4-byte integer that has a range from -2,147,483,648 to -2,147,483,647.
  BNumber: "BIGINT",
  SNumber: "SMALLINT", // 2-byte signed integer that has a range from -32,768 to 32,767.
  Serial: "SERIAL", // similar to AUTO_INCREMENT column in MySQL
  Double: "FLOAT", // a floating-point number whose precision, at least, n, up to a maximum of 8 bytes
  Real: "REAL", // a double-precision (8-byte) floating-point number.
  Numeric: "NUMERIC", // a real number with p digits with s number
  Char: "CHAR", // fixed-length character with space padded
  String: "VARCHAR", // variable-length character string
  Text: "TEXT", // a character string with unlimited length.
  Object: "JSON", // plain JSON data that requires reparsing for each processing,
  SmartObject: "JSONB", //  JSON data in a binary format which is faster to process but slower to insert
  Array: "ARRAY", // an array of strings, an array of integers, etc., in array columns
  Binary: "BIT",
  Boolean: "BOOLEAN", // true || false, 1 || 0
  UUID: "UUID", // Universal Unique Identifiers, guarantee a better uniqueness than SERIAL
  Box:"box", //a rectangular box.
  Line:"line",// – a set of points.
  Point:"point", //– a geometric pair of numbers.
  LSEG: "lseg", //– a line segment.
  Ploygon: "polygon", //– a closed geometric.
  INET: "inet", //– an IP4 address.
  Mac: "macaddr", //– a MAC address.
};

export default class {
  constructor(connectionType) {
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
      validations = validations.string();
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
   * @param {Object} fields 
   */
  _createQueryMeta(fields) {
    const columns = [], values = [], valueList = [];
  
    Object.keys(fields).map((field, index) => {
      columns.push(field);
      values.push(fields[field]);
      valueList.push("$"+(index  + 1));
    });
  
    return { columns, values, valueList};
  }

  /**
   * 
   * @param {Array || String || Object} array 
   * returns Array
   */
  _checkArray(array) {
    return !Array.isArray(array) ? [array] : array;
  }

  _isObject(doc) {
    return doc.constructor === Object && Object.keys(doc).length > 0;
  }

  /**
   * 
   * @param {String} name 
   * @param {Object} schema 
   */
  async model(name, schema) {
    this.collection = name;
    const client = this.db,
      fields = Object.keys(schema);
    
    let tableSchema = "", schemaValidations = {}, schemaValidationsUpdate = {};
    
    fields.forEach((field, key) => {

      // create table schema
      const colData = schema[field];
      const type = colData.type;
      
      tableSchema += `${field} ${dataTypes[type]}`;
      if(key < fields.length - 1) {
        tableSchema += ",";
      }

      schemaValidations[field] = this._schemaValidations(colData);
      delete colData.required;
      schemaValidationsUpdate[field] = this._schemaValidations(colData);
    });

    this.schema = Joi.object().keys(schemaValidations);
    this.schemaUpdate = Joi.object().keys(schemaValidationsUpdate);
    
    const createTableText = `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      CREATE TABLE IF NOT EXISTS ${name} (
        _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        createdAt TIMESTAMPTZ DEFAULT clock_timestamp(),
        ${tableSchema}
      );
    `;
    
    try {
      await client.query(createTableText);
    } catch (e) {
      throw new Error (e);
    }
  }

  /**
   * 
   * @param {Object} data 
   */
  async add(data) {
    const {error, value} = Joi.validate(data, this.schema);
    if(!error) {
      const {columns, values, valueList} = this._createQueryMeta(value);
      
      const query = {
        text: `INSERT INTO ${this.collection}(${columns}) VALUES(${valueList})`,
        values
      };

      try {
        const {rowCount} = await this.db.query(query);
        return rowCount;
      } catch(err) {
        throw new Error (err);
      }
    } else {
      throw new Error (error);
    }
  }

  /**
   * 
   * @param {UUID} id 
   */
  async findById(id) {
    const query = {
      text: `SELECT * FROM ${this.collection} WHERE _id = $1`,
      values: [id]
    };

    try {
      const {rows} = await this.db.query(query);
      return rows[0];
    } catch(err) {
      throw new Error (err);
    }
  }

  /**
   * 
   * @param {String} where 
   * @param {Array} values 
   */
  async findOne(where, values) {
    values = this._checkArray(values);
    const query = {
      text: `SELECT * FROM ${this.collection} WHERE ${where}`,
      values
    };

    try {
      const {rows} = await this.db.query(query);
      return rows[0];
    } catch(err) {
      throw new Error (err);
    }
  }

  /**
   * 
   * @param {String} where 
   * @param {Array} values 
   */
  async find(where, values) {
    values = this._checkArray(values);
    const query = {
      text: `SELECT * FROM ${this.collection} WHERE ${where}`,
      values
    };

    try {
      const {rows} = await this.db.query(query);
      return rows;
    } catch(err) {
      throw new Error (err);
    }
  }

  /**
   * 
   * @param {UUID} id 
   * @param {Object} cols 
   */
  async updateByID (id, data) {
    const {error} = Joi.validate(data, this.schemaUpdate);
    if(error) throw new Error(error);

    // Setup static beginning of query
    let text = [`UPDATE ${this.collection}`];
    const values = [];
    text.push("SET");
  
    // Create another array storing each set command
    // and assigning a number value for parameterized query
    var set = [];
    Object.keys(data).forEach((col, key) => {
      if(this._isObject(data[col])) {
        set.push(`${col} = ${col} || '${JSON.stringify(data[col])}'`); 
      } else {
        set.push(`${col} = $${key + 1}`); 
        values.push(data[col]);
      }
    });
    text.push(set.join(", "));
  
    // Add the WHERE statement to look up by id
    text.push(`WHERE _id = '${id}'`);
  
    // Return a complete query string
    text = text.join(" ");

    const query = {
      text,
      values
    };

    try {
      const {rowCount} = await this.db.query(query);
      return rowCount;
    } catch(err) {
      throw new Error (err);
    }
  
  }
  
  /**
   * 
   * @param {String} where
   * @param {Array} values  
   * @param {Object} cols 
   */
  async update (where, compare, data) {
    const {error} = Joi.validate(data, this.schemaUpdate);
    if(error) throw new Error(error);
    
    // Setup static beginning of query
    let text = [`UPDATE ${this.collection}`];
    text.push("SET");
    const values = [];
  
    // Create another array storing each set command
    // and assigning a number value for parameterized query
    var set = [];
    Object.keys(data).forEach((col, key) => {
      if(this._isObject(data[col])) {
        set.push(`${col} = ${col} || '${JSON.stringify(data[col])}'`); 
      } else {
        set.push(`${col} = $${key + 1}`); 
        values.push(data[col]);
      }
    });
    text.push(set.join(", "));

    compare = this._checkArray(compare);
    compare.forEach((value, key) => {
      const str = `$${key + 1}`;
      where = where.replace(str, `'${value}'`);
    });
    text.push(`where ${where}`);
    text = text.join(" ");

    const query = {
      text,
      values
    };

    try {
      const {rowCount} = await this.db.query(query);
      return rowCount;
    } catch(err) {
      throw new Error (err);
    }
  }
}