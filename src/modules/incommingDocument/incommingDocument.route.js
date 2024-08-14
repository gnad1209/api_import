const router = require('express').Router();
const incommingDocumentCtrl = require('./incommingDocument.controller');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null, `${global.appRoot}/files/`);
    cb(null, `src/files/`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now() * 1}___${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 * 1024 },
});

router.post(
  '/import',
  upload.fields([
    { name: 'importFile', maxCount: 1 },
    { name: 'zipFile', maxCount: 1 },
  ]),
  incommingDocumentCtrl.readAndMapFileFromExcelV3,
);

module.exports = router;
