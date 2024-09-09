const service = require('./exportIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent } = require('../config/common');
const moment = require('moment');
const os = require('os');
const fs = require('fs');
const downloadsDir = path.join(os.homedir(), 'Downloads', 'multi-folders.zip');

const exportDataInZipFile = async (req, res, next) => {
  try {
    const { receiverUnitInput, regexFilterInput, receiveDateInput, clientId } = req.query;

    let filter = {
      stage: 'receive',
      receiverUnit: { $in: [receiverUnitInput] },
      // parentDoc: { $exists: false },
      $or: [
        { abstractNote_en: { $regex: regexFilterInput || '', $options: 'i' } },
        { toBookCode_en: { $regex: regexFilterInput || '', $options: 'i' } },
        { abstractNote: { $regex: regexFilterInput || '', $options: 'i' } },
        { toBookCode: { $regex: regexFilterInput || '', $options: 'i' } },
      ],
    };
    if (receiveDateInput) {
      filter.receiveDateInput = {
        $gte: moment(receiveDateInput[0], 'DD/MM/YYYY').startOf('day').toDate(),
        $lte: moment(receiveDateInput[1], 'DD/MM/YYYY').endOf('day').toDate(),
      };
    }

    const documentFiles = await service.getDataDocument(filter);
    if (!documentFiles.documents) {
      return res.status(400).json('Không tìm thấy tài liệu cần export');
    }

    //chuyển trường thông tin sang file excel
    let attachments;
    if (!documentFiles.resultFile) {
      attachments = null;
    }
    //lấy file tên và path của các file đính kèm
    attachments = await service.getPathFile(documentFiles.resultFile, documentFiles.documents);

    const outputFilePath = path.join(__dirname, '..', '..', 'files', 'attachments.zip');
    //tạo file excel
    const pathExcel = await service.createExelFile(documentFiles.documents);

    service.createZipFile(attachments.arrPath, attachments.arrName, outputFilePath);
    // res.download(downloadsDir, 'multi-folders.zip', (err) => {
    //   if (err) {
    //     console.error('Error downloading file:', err);
    //     res.status(500).send('An error occurred');
    //   } else {
    //     // Bước 4: Xóa file Excel và file ZIP sau khi tải về
    //     deleteFiles(excelFilePath);
    //   }
    // });
    console.log(123123123);
    return res.status(200).json(documentFiles);
  } catch (e) {
    return e;
  }
};

module.exports = { exportDataInZipFile };
