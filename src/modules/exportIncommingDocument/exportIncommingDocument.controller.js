const service = require('./exportIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent } = require('../config/common');
const moment = require('moment');
const os = require('os');
const downloadsDir = path.join(os.homedir(), 'Downloads', 'multi-folders.zip');

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
      filter.receiveDateInput = {
        $gte: moment(receiveDateInput[0], 'DD/MM/YYYY').startOf('day').toDate(),
        $lte: moment(receiveDateInput[1], 'DD/MM/YYYY').endOf('day').toDate(),
      };
    }
    //lấy dữ liệu lọc được
    const documentFiles = await service.getDataDocument(filter);

    if (!documentFiles.documents) {
      return res.status(400).json({ status: 400, messages: 'Không tìm thấy tài liệu cần export' });
    }

    let attachments;
    if (!documentFiles.resultFile) {
      attachments = null;
    }

    //lấy tên và path của các file đính kèm
    attachments = await service.getPathFile(documentFiles.resultFile, documentFiles.documents);
    const outputFilePath = path.join(__dirname, '..', '..', 'files', 'attachments.zip');

    //tạo file excel và lấy path của file vừa đc tạo
    const pathExcel = await service.createExelFile(documentFiles.documents);
    if (attachments.arrPath.length < 1) {
      //tạo file zip
      await service.createZipFile([pathExcel], [], downloadsDir);
      deleteFolderAndContent(pathExcel);
      return res.status(200).json(documentFiles);
    }
    // tạo file excel và file zip tệp đính kèm
    const check = await service.createZipFile(attachments.arrPath, attachments.arrName, outputFilePath);
    if (check) {
      await service.createZipFile([pathExcel, outputFilePath], [], downloadsDir);
    }
    deleteFolderAndContent(pathExcel);
    deleteFolderAndContent(outputFilePath);
    return res.status(200).json(documentFiles);
  } catch (e) {
    return e;
  }
};

module.exports = { exportDataInZipFile };
