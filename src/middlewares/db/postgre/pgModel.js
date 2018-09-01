import Joi from "joi";
import { getPool, getClient } from "./pgConnect";

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
  // Arrays 
  "Date[]": "DATE[]", // the date values only.
  "Time[]": "Time[]", // the time of day values.
  "interval[]": "INTERVAL[]", // periods of time.
  "Number[]": "INT[]", // a 4-byte integer that has a range from -2,147,483,648 to -2,147,483,647.
  "BNumber[]": "BIGINT[]",
  "SNumber[]": "SMALLINT[]", // 2-byte signed integer that has a range from -32,768 to 32,767.
  "Serial[]": "SERIAL[]", // similar to AUTO_INCREMENT column in MySQL
  "Double[]": "FLOAT[]", // a floating-point number whose precision, at least, n, up to a maximum of 8 bytes
  "Real[]": "REAL[]", // a double-precision (8-byte) floating-point number.
  "Numeric[]": "NUMERIC[]", // a real number with p digits with s number
  "Char[]": "CHAR[]", // fixed-length character with space padded
  "String[]": "VARCHAR[]", // variable-length character string
  "Text[]": "TEXT[]", // a character string with unlimited length.
  "Object[]": "JSON[]", // plain JSON data that requires reparsing for each processing,
  "SmartObject[]": "JSONB[]", //  JSON data in a binary format which is faster to process but slower to
};

export default class {
  constructor(connectionType) {
    this.db = connectionType === "pool" ? getPool() : getClient();
    this.collection = null;
    this.schema = null;
    this.schemaUpdate = null;
    this.modelDefaults = {};
    this.query = null;
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

  _checkDefaults(fields) {
    const modelDefaults = Object.keys(this.modelDefaults);
    const queryFields = Object.keys(fields);
    modelDefaults.map(col => {
      if(queryFields.indexOf(col) === -1) {
        fields[col] = this.modelDefaults[col];
      }
    });

    return fields;
  }

  /**
   * 
   * @param {Object} fields 
   */
  _createQueryMeta(fields) {
    fields = this._checkDefaults(fields);
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

  /**
   * 
   * @param {Object} doc 
   */
  _isObject(doc) {
    return doc.constructor === Object && Object.keys(doc).length > 0;
  }

  /**
   * 
   * @param {Object, String} where 
   * @param {Array, String} values 
   */
  _whereClause(where, values) {
    let whereStr = "";
    if(where && where.constructor === Object && Object.keys(where).length >= 0)  {
      Object.keys(where).map(key => {
        whereStr += ` ${key} = '${where[key]}'`;
      });
    } else {
      values = this._checkArray(values);
      values.forEach((value, key) => {
        const str = `$${key + 1}`;
        where = where.replace(str, `'${value}'`);
      });
      whereStr = where;
    }
    return whereStr;
  }

  /**
   * 
   * @param {String} name 
   * @param {Object} schema 
   */
  async model(name, schema) {
    this.collection = name;
    Object.keys(schema).map(col => {
      if(schema[col].defaultValue) {
        this.modelDefaults[col] = schema[col].defaultValue;
      }
    });
    const fields = Object.keys(schema);
    
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
    
    this.query = `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      CREATE TABLE IF NOT EXISTS ${name} (
        _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        createdAt TIMESTAMPTZ DEFAULT clock_timestamp(),
        ${tableSchema}
      );
    `;
    
    await this.exec();
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
        text: `INSERT INTO ${this.collection}(${columns}) VALUES(${valueList}) RETURNING *`,
        values
      };

      this.query = query;
      return await this.exec();
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

    this.query = query;
    const {rows} = await this.exec();
    return rows[0];
  }

  /**
   * 
   * @param {String} where 
   * @param {Array} values 
   */
  async findOne(where, values) {
    values = this._checkArray(values);
    const whereStr = this._whereClause(where, values);
    const query = {
      text: `SELECT * FROM ${this.collection} WHERE ${whereStr}`
    };
    this.query = query;
    const {rows} = await this.exec();
    return rows[0];
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

    this.query = query;
    const {rows} = await this.exec();
    return rows;
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

    text += " RETURNING *";
    const query = {
      text,
      values
    };

    this.query = query;
    return await this.exec();
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


    const whereStr = this._whereClause(where, compare);
    text.push(`where ${whereStr}`);
    text = text.join(" ");

    text += " RETURNING *";
    const query = {
      text,
      values
    };

    this.query = query;
    return await this.exec();
  }
  
  /**
   * @param {UUID} id 
   */
  async removeById (id){
    this.query = `DELETE FROM ${this.collection} WHERE _id = '${id}'`;
    return await this.exec();
  }


  /**
   * @param {String || Object} where
   * @param {Array} compare  
   */
  async remove (where, compare){
    let text = [`DELETE from ${this.collection}`];
    const whereStr = this._whereClause(where, compare);
    text.push(`where ${whereStr}`);
    text = text.join(" ");
    this.query = text;
    return await this.exec();
  }

  /**
   * 
   * @param {String} cols 
   */
  select(cols = "*") {
    this.query = [`SELECT ${cols} FROM ${this.collection}`];
    return this;
  }

  where(where, compare) {
    const whereStr = this._whereClause(where, compare);
    this.query.push(`WHERE ${whereStr}`);
    return this;
  }

  offset(skipRecords) {
    this.query.push(`OFFSET ${skipRecords}`);
    return this;
  }

  limit(noOfResults) {
    this.query.push(`LIMIT ${noOfResults}`);
    return this;
  }

  order(orderBy) {
    this.query.push(`ORDER BY ${orderBy}`);
    return this;
  }

  join() {
    return this;
  }
  
  async exec() {
    if(Array.isArray(this.query)) this.query = this.query.join(" ");
    try {
      const res = await this.db.query(this.query);
      this.query = null;
      return res;
    } catch(err) {
      throw new Error (err);
    }
  }
}