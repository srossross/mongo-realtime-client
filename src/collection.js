/* @flow */
import MongoWebDB from './index';

const { Ref, RefOne } = require('./ref');
/**
 * Mongo web collection
 * @param {MongoWebDB} db - the parent db
 * @param {string} collection - the collection to operate on
 */

export type OPS = (
  'insertOne' | 'updateOne' | 'updateMany' | 'findOne' | 'find' |
  'remove' | 'count' |
  'unwatch' | 'watchQuery'
);
export type Cmd = {
  requestID?: number,
  collection: string,
  op: OPS,
  doc?: Object,
  query?: Object,
  update?: Object,
  options?: ?Object,
};

class MongoWebCollection {
  db: MongoWebDB;
  collection: string;

  constructor(db: MongoWebDB, collection: string) {
    this.db = db;
    this.collection = collection;
  }

  /**
   * insert one document.
   *
   * @param {object} doc - document to insert
   * @example
   * db.collection('eggs').insertOne({ shell: true })
   * console.log(result);
   */
  insertOne(doc: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'insertOne',
      doc,
      options,
    });
  }

  updateOne(query: Object, update: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateOne',
      query,
      update,
      options,
    });
  }
  updateMany(query: Object, update: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateMany',
      query,
      update,
      options,
    });
  }

  findOne(query: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'findOne',
      query,
      options,
    });
  }

  find(query: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'find',
      query,
      options,
    });
  }

  remove(query: Object, options: ?Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'remove',
      query,
      options,
    });
  }

  count(query: Object) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'count',
      options: {},
      query,
    });
  }

  ref(IdOrQuery: any) {
    if (typeof IdOrQuery === 'object') {
      return new Ref(this.db, this.collection, IdOrQuery);
    }
    return new RefOne(this.db, this.collection, IdOrQuery);
  }

  unwatch(requestID: number) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'unwatch',
      requestID,
    });
  }
}

module.exports = MongoWebCollection;
