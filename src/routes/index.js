const express = require('express');
const router = express.Router();

const importIncommingDocumentRoute = require('../modules/importIncommingDocument/importIncommingDocument.route');

router.use('/importIncommingDocument', importIncommingDocumentRoute);

module.exports = router;
