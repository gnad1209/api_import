const express = require('express');
const router = express.Router();

const incommingDocumentRoute = require('../modules/incommingDocument/incommingDocument.route');
const outgoingDocumentRoute = require('../modules/outgoingDocument/outgoingDocument.route');

router.use('/incommingDocument', incommingDocumentRoute);
router.use('/outgoingDocument', outgoingDocumentRoute);

module.exports = router;
