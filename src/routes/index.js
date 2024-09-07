const express = require('express');
const router = express.Router();

const incommingDocumentRoute = require('../modules/importIncommingDocument/incommingDocument.route');

router.use('/incommingDocument', incommingDocumentRoute);

module.exports = router;
