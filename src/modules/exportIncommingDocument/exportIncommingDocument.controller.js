const service = require('./exportIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent, existsPath } = require('../config/common');
const moment = require('moment');
const os = require('os');
const fs = require('fs');
let downloadsDir = path.join(os.homedir(), 'Downloads', 'data_export.zip');

const exportDataInZipFile = async (req, res, next) => {
  try {
    const { receiverUnitInput, regexFilterInput, receiveDateInput } = req.query;
    //lọc tìm kiếm
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
      filter.receiveDate = {
        $gte: moment(receiveDateInput[0], 'DD/MM/YYYY').startOf('day').toDate(),
        $lte: moment(receiveDateInput[1], 'DD/MM/YYYY').endOf('day').toDate(),
      };
    }
    //lấy dữ liệu lọc được
    const documentFiles = await service.getDataDocument(filter);

    if (!documentFiles.documents) {
      return res.status(400).json({ status: 400, messages: 'Không tìm thấy tài liệu cần export' });
    }
    //tạo file excel và lấy path của file vừa đc tạo
    const pathExcel = await service.createExelFile(documentFiles.documents);

    let attachments;
    if (!documentFiles.resultFile) {
      attachments = null;
    }

    //lấy tên và path của các file đính kèm
    attachments = await service.getPathFile(documentFiles.resultFile, documentFiles.documents);
    const outputFilePath = path.join(__dirname, '..', '..', 'files', 'attachments.zip');
    const finalZipFile = path.join(__dirname, '..', '..', 'files', 'data_export.zip');
    // const checkAttachmentFile = await service.createZipFile(attachments.arrPath, attachments.arrName, outputFilePath);
    // if (checkAttachmentFile.status === 200) {
    //   await service.createZipFile([pathExcel, outputFilePath], [], finalZipFile);
    // }

    if (attachments.arrPath.length < 1) {
      //tạo file zip
      await service.createZipFile([pathExcel], [], downloadsDir);
      deleteFolderAndContent(pathExcel);
      return res.status(200).json({ status: 200, message: 'Tải xuống thành công' });
    }

    let checkFinalPath = existsPath(downloadsDir);
    let i = 0;
    while (checkFinalPath) {
      i++;
      downloadsDir = path.join(os.homedir(), 'Downloads', `data_export(${i}).zip`);
      checkFinalPath = existsPath(downloadsDir);
    }

    // tạo file excel và file zip tệp đính kèm
    const checkAttachmentFile = await service.createZipFile(attachments.arrPath, attachments.arrName, outputFilePath);
    if (checkAttachmentFile.status === 200) {
      await service.createZipFile([pathExcel, outputFilePath], [], downloadsDir);
    }

    // xóa file tạm
    deleteFolderAndContent(pathExcel);
    deleteFolderAndContent(outputFilePath);
    return res.status(200).json({ status: 200, message: 'Tải xuống thành công' });
  } catch (e) {
    return e;
  }
};

module.exports = { exportDataInZipFile };
