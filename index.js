const express = require('express');
const routes = require('./src/routes/index');
const { connectToDatabase } = require('./config/db');
const app = express();
const port = 9000;

connectToDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routes(app);

app.listen(port, () => {
  console.log(`server is running with port: ${port}`);
});
