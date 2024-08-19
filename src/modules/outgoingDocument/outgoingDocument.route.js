const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'files');
    console.log('Upload path:', uploadPath);

    // Tạo thư mục nếu không tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}___${file.originalname}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 1 * 1024 * 1024 * 1024 } });

const ctl = require('./outgoingDocument.controller');

router.post(
  '/',
  upload.fields([
    { name: 'importFile', maxCount: 1 },
    { name: 'zipFile', maxCount: 1 },
  ]),
  ctl.readMapFileFromExcelV3AnhCreatedBook,
);

module.exports = router;
