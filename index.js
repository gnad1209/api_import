const express = require('express');
const routes = require('./src/routes/index');
const app = express();
const port = process.env.PORT || 9000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

routes(app);

app.listen(port, () => {
  console.log(`server is running with port: ${port}`);
});
