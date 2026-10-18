// INTENTIONALLY VULNERABLE - SAST test only. All secrets are fake.
const express = require('express');
const mysql = require('mysql');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(express.json());
app.use(express.static('public'));

// [Hotspot] CORS allows every origin, with credentials
app.use(cors({ origin: '*', credentials: true }));

// [Hotspot] Insecure session cookie (no secure/httpOnly/sameSite), hard-coded secret
app.use(session({ secret: 'keyboard cat', cookie: { secure: false, httpOnly: false } }));

// [Vuln] Hard-coded credentials / tokens
const DB_PASSWORD = 'admin123';
const JWT_SECRET = 'secret';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: DB_PASSWORD, database: 'app' });

// [Vuln] SQL injection
app.get('/api/user', (req, res) => {
  db.query("SELECT * FROM users WHERE name = '" + req.query.name + "'", (err, rows) => res.json(rows));
});

// [Vuln] Command injection
app.get('/api/ping', (req, res) => {
  exec('ping -c 1 ' + req.query.host, (err, out) => res.send(out));
});

// [Vuln] Code injection
app.get('/api/calc', (req, res) => res.send(String(eval(req.query.expr))));

// [Vuln] Path traversal
app.get('/api/file', (req, res) => {
  fs.readFile('/var/data/' + req.query.name, 'utf8', (e, d) => res.send(d));
});

// [Vuln] Reflected XSS
app.get('/hello', (req, res) => res.send('<h1>Hello ' + req.query.name + '</h1>'));

// [Vuln] Open redirect
app.get('/go', (req, res) => res.redirect(req.query.url));

// [Vuln] SSRF
app.get('/api/fetch', async (req, res) => {
  const r = await axios.get(req.query.url);
  res.send(r.data);
});

// [Vuln] NoSQL injection
app.post('/api/login', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    client.db('app').collection('users').findOne(
      { user: req.body.user, pass: req.body.pass },
      (e, u) => {
        if (u) {
          // [Vuln] Weak JWT secret + no expiry
          res.json({ token: jwt.sign({ id: u._id, admin: true }, JWT_SECRET) });
        } else { res.status(401).end(); }
      });
  });
});

// [Vuln] ReDoS - user-controlled regex + catastrophic pattern
app.get('/api/search', (req, res) => {
  const re = new RegExp(req.query.q);
  const evil = /^(a+)+$/;
  res.json({ match: re.test(req.query.text), evil: evil.test(req.query.text) });
});

// [Vuln] Prototype pollution
function merge(target, src) {
  for (const k in src) {
    if (typeof src[k] === 'object') { target[k] = merge(target[k] || {}, src[k]); }
    else { target[k] = src[k]; }
  }
  return target;
}
app.post('/api/settings', (req, res) => res.json(merge({}, req.body)));

// [Vuln] Weak crypto
function hashPassword(p) { return crypto.createHash('md5').update(p).digest('hex'); }
function encrypt(t) {
  const c = crypto.createCipher('des', 'hardcoded-key'); // deprecated + weak
  return c.update(t, 'utf8', 'hex') + c.final('hex');
}

// [Hotspot] Math.random for security token
function resetToken() { return Math.random().toString(36).slice(2); }

// [Vuln] TLS verification disabled
const agent = new https.Agent({ rejectUnauthorized: false });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// [Code smells]
function check(a) {
  if (a == null) { return 1; } else { return 1; }   // identical branches, loose equality
}
try { JSON.parse('{bad'); } catch (e) { }           // empty catch
var unused = 123;                                    // unused var
console.log('server starting');                      // console logging
// TODO: remove debug endpoints
// FIXME: add auth

// [Hotspot] Plain HTTP, all interfaces, x-powered-by header left on
app.listen(3000, '0.0.0.0');
