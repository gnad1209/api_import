const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'files');
    console.log('Upload path:', uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}___${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'files');
  },
});

const ctl = require('./importOutgoingDocument.controller');

router.post('/', upload.fields([{ name: 'zipFile', maxCount: 1 }]), ctl.importimportOutgoingDocument);

module.exports = router;
