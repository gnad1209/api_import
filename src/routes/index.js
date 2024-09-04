const express = require('express');
const router = express.Router();

const importIncommingDocumentRoute = require('../modules/importIncommingDocument/importIncommingDocument.route');
const importOutgoingDocumentRoute = require('../modules/importOutgoingDocument/importOutgoingDocument.route');

router.use('/importIncommingDocument', importIncommingDocumentRoute);
router.use('/importOutgoingDocument', importOutgoingDocumentRoute);

module.exports = router;
