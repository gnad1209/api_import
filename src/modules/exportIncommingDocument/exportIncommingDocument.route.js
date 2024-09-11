const router = require('express').Router();
const exportIncommingDocumentCtrl = require('./exportIncommingDocument.controller');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${global.appRoot}/files/`);
    // cb(null, `src/files`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now() * 1}___${file.originalname}`);
  },
});

router.get('/export', exportIncommingDocumentCtrl.exportDataInZipFile);

module.exports = router;
