// const fetch = require('node-fetch');
const BSON = require('bson');
const engine = require('engine.io-client');
const EventEmitter = require('events');
const { Buffer } = require('buffer');
const MongoWebCollection = require('./collection');
const Auth = require('./auth');

const bson = new BSON();
const debug = require('debug')('mongo-realtime:client');

/**
 * The MongoWebDB instance
 *
 * @event MongoWebDB#message/*
 * @event MongoWebDB#handle/*
 * @event MongoWebDB#op/*
 */
class MongoWebDB extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.socket = engine(url);
    const { socket } = this;

    this.requestID = 0;
    socket.on('error', (err) => {
      throw err;
    });

    this.CONNECTION_STATE = 'initialize';

    socket.once('open', () => { this.CONNECTION_STATE = 'open'; });
    socket.on('message', data => this.handleMessage(data));
    socket.on('disconnect', () => debug('socket disconnect'));
    socket.on('error', () => debug('socket error'));
    socket.on('close', () => debug('socket close'));
  }

  close() {
    this.socket.close();
  }

  collection(name) {
    return new MongoWebCollection(this, name);
  }

  handleMessage(message) {
    const data = bson.deserialize(Buffer.from(message));
    if (data.handle) {
      debug(`Recieved watch update ${data.handle}`);
      this.emit(`handle/${data.handle}`, data);
    } else if (data.requestID) {
      debug(`Recieved message ${data.requestID}`);
      this.emit(`message/${data.requestID}`, data);
    } else {
      this.emit(`op/${data.op}`, data);
    }
  }

  executeCommand(cmd, callback) {
    const req = Object.assign({
      requestID: this.requestID += 1,
    }, cmd);
    debug(`Execute command (id:${req.requestID})`, cmd);

    this.socket.send(bson.serialize(req));

    const promise = new Promise((resolve, reject) => {
      this.once(`message/${req.requestID}`, (data) => {
        debug(`Command result (id:${data.requestID})`);
        if (callback) {
          callback(data.error, data.result, req.requestID);
        }
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      });
    });

    promise.requestID = req.requestID;
    return promise;
  }

  auth() {
    if (!this.authObj) {
      this.authObj = new Auth(this);
    }
    return this.authObj;
  }
}

module.exports = MongoWebDB;
