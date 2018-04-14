// @flow
import type { OP } from './base';

const RefBase = require('./base');

class Ref extends RefBase {
  docs: any;

  constructor(db:any, collection: string, query: Object) {
    super(db, collection);
    this.query = query;
  }

  get(options: ?Object) {
    return this.db.collection(this.collection).find(this.query, options);
  }

  setAll(values: Object) {
    return this.db.collection(this.collection).updateMany(this.query, { $set: values });
  }

  update(update: Object) {
    return this.db.collection(this.collection).updateMany(this.query, update);
  }

  count() {
    return this.db.collection(this.collection).count(this.query);
  }

  handleInitial(docs: any): void {
    this.docs = {};
    docs.forEach((doc) => {
      this.docs[doc._id] = doc;
    });
    this.emit('changed', docs);
  }

  handleChange(op: OP, doc: Object) {
    switch (op) {
      case 'u':
        this.emit('child_updated', doc);
        this.docs[doc._id] = doc;
        break;
      case 'i':
        this.emit('child_added', doc);
        this.docs[doc._id] = doc;
        break;
      case 'd':
        this.emit('child_removed', doc);
        delete this.docs[doc._id];
        break;
      default:
    }
    this.emit('changed', Object.values(this.docs));
  }
}

module.exports = Ref;
