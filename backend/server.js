require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/config/db'); // initialises pool (SQLite auto-creates tables; MySQL connects)
const app = require('./src/app');

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`SalesOrbit API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown — required for PM2 / Docker / systemd
function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000); // force exit after 10 s
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
