const path = require('path');
const fs   = require('fs');

// ── SQL normaliser: MySQL dialect → SQLite ──────────────────────────────────
function toSQLite(sql) {
  return sql
    // DATE_FORMAT(col, '%Y-%m-%d') → strftime('%Y-%m-%d', col)
    .replace(/DATE_FORMAT\(([^,]+),\s*'([^']+)'\)/gi, "strftime('$2', $1)")
    // NOW() → CURRENT_TIMESTAMP
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    // ON DUPLICATE KEY UPDATE (kpis — conflict key is user_id,quarter,year)
    .replace(
      /ON DUPLICATE KEY UPDATE\s+([\s\S]+)/gi,
      (_, sets) => {
        const setClauses = sets.trim().split(',').map(s => {
          const col = s.trim().split(/\s*=\s*/)[0].trim();
          return `${col} = excluded.${col}`;
        }).join(', ');
        return `ON CONFLICT(user_id, quarter, year) DO UPDATE SET ${setClauses}`;
      }
    );
}

// ── Serialise a single param to a SQLite-safe scalar ────────────────────────
function serialize(p) {
  if (p === undefined) return null;
  if (p instanceof Date) return p.toISOString().slice(0, 19).replace('T', ' ');
  return p;
}

// ── Expand IN (?) when the bound parameter is an array ──────────────────────
function expandParams(sql, params) {
  if (!params || !params.length) return { sql, params: [] };
  const flat = [];
  const expanded = sql.replace(/\?/g, () => {
    const p = params[flat.length];
    if (Array.isArray(p)) {
      flat.push(...p.map(serialize));
      return p.length ? p.map(() => '?').join(',') : 'NULL';
    }
    flat.push(serialize(p));
    return '?';
  });
  return { sql: expanded, params: flat };
}

// ── SQLite adapter: same API surface as mysql2/promise pool ─────────────────
function makeSQLitePool(dbPath) {
  const SQLite = require('better-sqlite3');
  const db = new SQLite(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Auto-create tables on first boot
  const schemaPath = path.join(__dirname, '../../../database/schema.sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    fs.readFileSync(schemaPath, 'utf8')
      .split(';').map(s => s.trim()).filter(Boolean)
      .forEach(stmt => { try { db.prepare(stmt).run(); } catch {} });
  }

  // Deactivate test accounts (email pattern @test.com or _test_ in email)
  try {
    db.prepare("UPDATE users SET is_active = 0 WHERE email LIKE '%@test.com' OR email LIKE '%_test_%' OR email LIKE 'fixtest%' OR email LIKE 'prod_%@test%' OR email LIKE 'eth%@test%'").run();
  } catch {}

  // Migrations — add new columns to existing databases
  const oppCols = db.prepare("PRAGMA table_info(opportunities)").all().map(c => c.name);
  if (!oppCols.includes('client_id')) {
    db.prepare("ALTER TABLE opportunities ADD COLUMN client_id TEXT NOT NULL DEFAULT ''").run();
  }
  if (!oppCols.includes('kyc_agent')) {
    db.prepare("ALTER TABLE opportunities ADD COLUMN kyc_agent TEXT NOT NULL DEFAULT ''").run();
  }

  console.log(`SQLite  →  ${dbPath}`);
  return {
    isSQLite: true,
    query(rawSql, rawParams) {
      return new Promise((resolve, reject) => {
        try {
          const { sql, params } = expandParams(toSQLite(rawSql), rawParams ? [...rawParams] : []);
          const stmt  = db.prepare(sql);
          const upper = sql.trimStart().toUpperCase();
          if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('SHOW')) {
            resolve([stmt.all(...params)]);
          } else {
            const info = stmt.run(...params);
            resolve([{ affectedRows: info.changes, insertId: info.lastInsertRowid }]);
          }
        } catch (err) { reject(err); }
      });
    },
    end() { try { db.close(); } catch {} return Promise.resolve(); },
  };
}

// ── MySQL pool ───────────────────────────────────────────────────────────────
function makeMySQLPool() {
  const mysql = require('mysql2/promise');
  const pool  = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           'Z',
    dateStrings:        false,
  });
  pool.getConnection()
    .then(c => { console.log(`MySQL   →  ${process.env.DB_HOST}/${process.env.DB_NAME}`); c.release(); })
    .catch(e  => console.error('MySQL connection error:', e.message));
  return pool;
}

// ── Choose engine ────────────────────────────────────────────────────────────
const engine = (process.env.DB_ENGINE || 'sqlite').toLowerCase();

if (engine === 'mysql') {
  module.exports = makeMySQLPool();
} else {
  const dataDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  module.exports = makeSQLitePool(path.join(dataDir, 'salesorbit.db'));
}
