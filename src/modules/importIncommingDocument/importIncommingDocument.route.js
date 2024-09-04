const router = require('express').Router();
const importIncommingDocumentCtrl = require('./importIncommingDocument.controller');

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

router.post('/import', upload.single('zipFile'), importIncommingDocumentCtrl.importDataInZipFile);

module.exports = router;
