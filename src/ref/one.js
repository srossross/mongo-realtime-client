/* @flow */
/* eslint-disable no-param-reassign */

import type { OP } from './base';

const RefBase = require('./base');

class RefOne extends RefBase {
  id: any;
  doc: ?Object;

  constructor(db: any, collection: any, id: any) {
    super(db, collection);
    this.id = id;
  }

  get query(): Object {
    return { _id: this.id };
  }

  get(options: ?Object) {
    return this.db.collection(this.collection).findOne(this.query, options);
  }

  set(values: Object, options: Object = {}) {
    if (options.upsert === undefined) {
      options.upsert = true;
    }
    return this.db.collection(this.collection).updateOne(this.query, { $set: values }, options);
  }

  create(values: Object, options: ?Object) {
    if (!options) {
      options = {};
    }
    options.upsert = true;
    return this.db.collection(this.collection).updateOne(this.query, { $set: values }, options);
  }

  update(update: Object, options: ?Object) {
    return this.db.collection(this.collection).updateOne(this.query, update, options);
  }

  remove(options: ?Object) {
    return this.db.collection(this.collection).remove(this.query, options);
  }

  count() {
    return this.db.collection(this.collection).count(this.query);
  }

  handleInitial(doc: Object) {
    this.doc = doc;
    this.emit('changed', doc);
  }

  handleChange(op: OP, doc: Object) {
    console.log('handleChange', op);
    switch (op) {
      case 'u':
        this.doc = doc;
        this.emit('changed', doc);
        break;
      case 'i':
        this.doc = doc;
        this.emit('changed', doc);
        break;
      case 'd':
        this.doc = null;
        this.emit('removed');
        break;
      default:
    }
  }
}

module.exports = RefOne;
