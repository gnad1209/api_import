const express = require('express');
const router = express.Router();
const ctl = require('./outgoingDocument.controller');

router.get('/r', ctl.test);

module.exports = router;
