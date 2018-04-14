/* @flow */
import MongoWebDB from '../index';

const EventEmitter = require('events');
const debug = require('debug')('mongo-realtime:ref');

export type OP = ('d' | 'i' | 'u');

class RefBase extends EventEmitter {
  db: MongoWebDB;
  collection: string;

  +query: Object;
  watching: Promise<any>;
  handle: string;
  +get: (options: ?Object)=>Promise<any>;
  +handleInitial: (any)=> void;
  +handleChange: (OP, any) => void;

  constructor(db: any, collection: string) {
    super();
    this.db = db;
    this.collection = collection;
  }


  subscribe() {
    const promise = this.db.executeCommand({
      collection: this.collection,
      op: 'watchQuery',
      query: this.query,
    });

    this.get().then(docs => this.handleInitial(docs));

    debug('subscribe', this.query);
    this.watching = promise.then(({ handle }) => {
      this.handle = handle;
      debug(`Ref is subscribed ${handle}`);
      this.db.on(`handle/${handle}`, ({ op, doc }) => this.handleChange(op, doc));
      return { handle };
    });
  }

  unSubscribe() : Promise<void> {
    return this.watching.then(({ handle }) => {
      this.db.executeCommand({
        collection: this.collection,
        op: 'unwatch',
        handle,
      }).then(() => debug(`ref is unsubscribed ${handle}`));
    });
  }
}

module.exports = RefBase;
