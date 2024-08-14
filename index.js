const express = require('express');
const routes = require('./src/routes/index');
const { connectToDatabase } = require('./src/config/db');
const morgan = require('morgan');

connectToDatabase();
const app = express();
const port = process.env.PORT || 9000;

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`server is running with port: ${port}`);
});
