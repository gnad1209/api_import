require('dotenv').config();

const mongoose = require('mongoose');

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.DB_APP_DHVB);
        console.log('CONNECT MONGODB SUCCESSFULLY');
    } catch (err) {
        console.log('ERROR CONNECT MONGODB ATLAS');
        console.log(err);
    }
};

module.exports = { connectToDatabase };
