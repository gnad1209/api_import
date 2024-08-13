const express = require("express");
const routes = require('./src/routes/index');
const app = express()
const port = 9000

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

routes(app)

app.listen(port, () => {
    console.log(`server is running with port: ${port}`)
})