const router = require('express').Router();
const incommingDocumentCtrl = require('./incommingDocument.controller')
router.get('/',incommingDocumentCtrl.a);

module.exports = router;