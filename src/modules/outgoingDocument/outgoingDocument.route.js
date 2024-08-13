const router = require('express').Router();
const outgoingDocumentCtrl = require('./outgoingDocument.controller')
router.get('/',outgoingDocumentCtrl.a);

module.exports = router;