require('dotenv').config();

const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://vnnnsao1:kYpJEAO91IJpWw3q@t6ngl4m.8galv0j.mongodb.net/api_import?retryWrites=true&w=majority&appName=mOx652024',
    );
    console.log('CONNECT MONGODB SUCCESSFULLY');
  } catch (err) {
    console.log('ERROR CONNECT MONGODB ATLAS');
    console.log(err);
  }
};

module.exports = { connectToDatabase };
