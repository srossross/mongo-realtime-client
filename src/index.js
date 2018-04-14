// @flow

import type { Cmd } from './collection';

const BSON = require('bson');
const engine = require('engine.io-client');
const EventEmitter = require('events');
// $FlowFixMe
const { Buffer } = require('buffer');
const MongoWebCollection = require('./collection');
const Auth = require('./auth');

const bson = new BSON();
const debug = require('debug')('mongo-realtime:client');

const { error } = console;

type Config = {
  domain: string,
};

/**
 * The MongoWebDB instance
 *
 * @event MongoWebDB#message/*
 * @event MongoWebDB#handle/*
 * @event MongoWebDB#op/*
 */
class MongoWebDB extends EventEmitter {
  config: Config;
  authObj: Auth;
  socket: any;
  requestID: number;
  CONNECTION_STATE: ('initialize' | 'open');

  constructor(config: Config) {
    super();
    this.config = config;
    this.requestID = 1;
    debug(`creating connection ${this.config.domain}`);

    this.auth().refresh()
      .then(() => {
        this.connect();
      })
      .catch((err) => {
        error(err);
      });
  }

  connect() {
    this.socket = engine(`ws://${this.config.domain}`);

    const { socket } = this;

    socket.on('error', (err) => {
      debug('socket error', err);
    });

    this.CONNECTION_STATE = 'initialize';

    socket.once('open', () => {
      this.CONNECTION_STATE = 'open';
      this.emit('connected', this);
    });
    socket.on('message', data => this.handleMessage(data));
    socket.on('disconnect', () => debug('socket disconnect'));
    socket.on('close', () => debug('socket close'));
  }

  close() {
    this.socket.close();
  }

  collection(name: string): MongoWebCollection {
    return new MongoWebCollection(this, name);
  }

  handleMessage(message: Buffer) {
    const data = bson.deserialize(Buffer.from(message));

    if (data.requestID) {
      debug(`Recieved message ${data.requestID}`, data);
      this.emit(`message/${data.requestID}`, data);
    } else if (data.handle) {
      debug('Recieved watch update', data.handle, data.op, data.doc);
      this.emit(`handle/${data.handle}`, data);
    } else {
      debug('Recieved op', data);
      this.emit(`op/${data.op}`, data);
    }
  }

  executeCommand(cmd: Cmd, callback: any): Promise<any> {
    cmd.requestID = this.requestID; // eslint-disable-line no-param-reassign
    this.requestID += 1;

    debug(`Execute command (id:${cmd.requestID})`, cmd);

    this.socket.send(bson.serialize(cmd));

    const promise = new Promise((resolve, reject) => {
      this.once(`message/${cmd.requestID || 0}`, (data) => {
        debug(`Command result (id:${data.requestID})`);
        if (callback) {
          callback(data.error, data.result, cmd.requestID);
        }
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      });
    });
    // $FlowFixMe
    promise.requestID = cmd.requestID;
    return promise;
  }

  auth(): Auth {
    if (!this.authObj) {
      this.authObj = new Auth(this);
    }
    return this.authObj;
  }
}

module.exports = MongoWebDB;
