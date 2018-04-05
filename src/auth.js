const EventEmitter = require('events');

const debug = require('debug')('mongo-realtime:auth');

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

  refresh() {
    const opts = {
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      // referrer: 'no-referrer', // *client, no-referrer
    };
    return fetch(`http://${this.domain}/auth/refresh?dbName=${this.dbName}`, opts)
      .then(res => res.json())
      .then((body) => {
        if (body.errors) {
          throw body.errors;
        }
        return body;
      });
  }

  createUserWithEmailAndPassword(email, password) {
    const opts = {
      body: JSON.stringify({ email, password, dbName: this.dbName }),
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      // referrer: 'no-referrer', // *client, no-referrer
    };
    return fetch(`http://${this.domain}/auth/register`, opts)
      .then(res => res.json())
      .then((body) => {
        if (body.errors) {
          throw body.errors;
        }
        return body;
      });
  }

  loginWithEmailAndPassword(email, password) {
    const opts = {
      body: JSON.stringify({ email, password, dbName: this.dbName }),
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      // referrer: 'no-referrer', // *client, no-referrer
    };
    return fetch(`http://${this.domain}/auth/login`, opts)
      .then(res => res.json())
      .then((body) => {
        if (body.loginOk) {
          return;
        }
        throw body.errors;
      });
  }

  logout() {
    return fetch(`http://${this.domain}/auth/logout`, {
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      cache: 'no-cache',
      credentials: 'include',
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error({ message: 'invalid logout', res });
        }
        return res.json();
      });
  }
}

module.exports = Auth;
