// @flow
const EventEmitter = require('events');

const debug = require('debug')('mongo-realtime:auth');

type RefreshResponse = {};
type RegisterResponse = {};
type LoginResponse = {};
type LogoutResponse = {};

const opts = (method = 'GET', body = null) => ({
  body: body ? JSON.stringify(body) : undefined,
  cache: 'no-cache',
  credentials: 'include',
  headers: {
    'content-type': 'application/json',
  },
  method,
  mode: 'cors',
  redirect: 'error',
});

class Auth extends EventEmitter {
  db: any;
  constructor(db: any) {
    super();
    this.db = db;
    db.on('op/userstatus', ({ user }) => {
      debug('userstatus changed', user);
      this.emit('userstatus_changed', user);
    });
  }

  get domain(): string {
    return this.db.config.authDomain || this.db.config.domain;
  }
  get dbName(): string {
    return this.db.config.dbName;
  }
  get dbID(): string {
    return this.db.config.dbID;
  }

  refresh(): Promise<RefreshResponse> {
    const query = `dbID=${this.dbID}&dbName=${this.dbName}`;
    return fetch(`http://${this.domain}/auth/refresh?${query}`, opts('POST'))
      .then(res => res.json())
      .then((body) => {
        if (body.errors) {
          throw body.errors;
        }
        return body;
      });
  }

  createUserWithEmailAndPassword(email: string, password: string): Promise<RegisterResponse> {
    return fetch(`http://${this.domain}/auth/register`, opts('POST', {
      email, password, dbName: this.dbName, dbID: this.dbID,
    }))
      .then(res => res.json())
      .then((body) => {
        if (body.errors) {
          throw body.errors;
        }
        return body;
      });
  }

  loginWithEmailAndPassword(email: string, password: string): Promise<LoginResponse> {
    return fetch(`http://${this.domain}/auth/login`, opts('POST', {
      email, password, dbName: this.dbName, dbID: this.dbID,
    }))
      .then(res => res.json())
      .then((body) => {
        if (body.loginOk) {
          return {};
        }
        throw body.errors;
      });
  }

  logout(): Promise<LogoutResponse> {
    return fetch(`http://${this.domain}/auth/logout`, opts('POST'))
      .then((res) => {
        if (res.status !== 200) {
          throw new Error({ message: 'invalid logout', res });
        }
        return res.json();
      });
  }
}

module.exports = Auth;
