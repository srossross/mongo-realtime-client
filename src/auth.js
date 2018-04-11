const EventEmitter = require('events');

const debug = require('debug')('mongo-realtime:auth');

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
  constructor(db) {
    super();
    this.db = db;
    db.on('op/userstatus', ({ user }) => {
      debug('userstatus changed', user);
      this.emit('userstatus_changed', user);
    });
  }

  get domain() {
    return this.db.config.authDomain || this.db.config.domain;
  }
  get dbName() {
    return this.db.config.dbName;
  }
  get dbID() {
    return this.db.config.dbID;
  }

  refresh() {
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

  createUserWithEmailAndPassword(email, password) {
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

  loginWithEmailAndPassword(email, password) {
    return fetch(`http://${this.domain}/auth/login`, opts('POST', {
      email, password, dbName: this.dbName, dbID: this.dbID,
    }))
      .then(res => res.json())
      .then((body) => {
        if (body.loginOk) {
          return;
        }
        throw body.errors;
      });
  }

  logout() {
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
