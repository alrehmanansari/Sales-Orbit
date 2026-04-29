const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          'Z',       // store/return all datetimes as UTC
  dateStrings:       false,     // keep as JS Date objects
});

pool.getConnection()
  .then(conn => { console.log('MySQL connected:', process.env.DB_HOST); conn.release(); })
  .catch(err  => { console.error('MySQL connection failed:', err.message); process.exit(1); });

module.exports = pool;
