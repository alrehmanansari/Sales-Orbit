require('dotenv').config();
require('./src/config/db'); // initialises pool (SQLite auto-creates tables; MySQL connects)
const app = require('./src/app');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`SalesOrbit API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
