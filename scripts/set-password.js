#!/usr/bin/env node
const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/set-password.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(`\nADMIN_PASSWORD_HASH=${hash}\n`);
console.log('Add this to your .env file.');
