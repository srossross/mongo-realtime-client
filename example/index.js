import React from 'react';
import ReactDOM from 'react-dom';
import MongoWebDB from '../src';
import App from './app';

const db = new MongoWebDB({
  domain: 'localhost:4444',
  authDomain: 'localhost:3333',
});

db.on('connected', () => {
  ReactDOM.render(React.createElement(App, { db }), document.getElementById('root'));
});

