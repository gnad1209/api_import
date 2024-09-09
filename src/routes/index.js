const express = require('express');
const router = express.Router();

const importIncommingDocumentRoute = require('../modules/importIncommingDocument/importIncommingDocument.route');
const exportIncommingDocumentRoute = require('../modules/exportIncommingDocument/exportIncommingDocument.route');

router.use('/importIncommingDocument', importIncommingDocumentRoute);
router.use('/exportIncommingDocument', exportIncommingDocumentRoute);

module.exports = router;
