const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctl = require('./importOutgoingDocument.controller');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'src/modules/importOutgoingDocument/uploads/files';

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}___${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 * 1024 },
});

router.post('/', upload.fields([{ name: 'zipFile', maxCount: 1 }]), ctl.importimportOutgoingDocument);

module.exports = router;
