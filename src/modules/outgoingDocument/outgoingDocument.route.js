const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const checkDiskSpace = require('check-disk-space').default;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'files');
    console.log('Upload path:', uploadPath);

    // Kiểm tra dung lượng trống trước khi upload
    checkDiskSpace(uploadPath)
      .then((diskSpace) => {
        const requiredSpace = 1 * 1024 * 1024 * 1024; // 1GB in bytes

        if (diskSpace.free < requiredSpace) {
          return cb(new Error('Không đủ dung lượng trống để upload file'));
        }

        // Tạo thư mục nếu không tồn tại
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      })
      .catch((error) => {
        console.error('Lỗi khi kiểm tra dung lượng ổ đĩa:', error);
        cb(new Error('Không thể kiểm tra dung lượng ổ đĩa'));
      });
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
    checkDiskSpace(uploadPath)
      .then((diskSpace) => {
        const requiredSpace = 1 * 1024 * 1024 * 1024; // 1GB in bytes
        if (diskSpace.free < requiredSpace) {
          return cb(new Error('Không đủ dung lượng trống để upload file'), false);
        }
        cb(null, true);
      })
      .catch((error) => {
        console.error('Lỗi khi kiểm tra dung lượng ổ đĩa:', error);
        cb(new Error('Không thể kiểm tra dung lượng ổ đĩa'), false);
      });
  },
});

const ctl = require('./outgoingDocument.controller');

router.post(
  '/',
  upload.fields([
    { name: 'zipFile', maxCount: 1 },
  ]),
  ctl.importOutgoingDocument,
);

module.exports = router;
