const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesorbit';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host);
};
