const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/mindfull.sqlite');
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the MindFull CMS database.');
  }
});

module.exports = db;
