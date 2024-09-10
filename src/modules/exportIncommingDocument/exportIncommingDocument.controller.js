const service = require('./exportIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent, existsPath } = require('../config/common');
const moment = require('moment');
const fs = require('fs');

const exportDataInZipFile = async (req, res, next) => {
  try {
    const { receiverUnitInput, regexFilterInput, receiveDateInput } = req.query;

    // Lọc tìm kiếm
    let filter = {
      stage: 'receive',
    };

    // Kiểm tra receiverUnitInput
    if (receiverUnitInput) {
      filter.receiverUnit = receiverUnitInput;
    }

    // Kiểm tra regexFilterInput
    if (regexFilterInput && regexFilterInput.trim()) {
      filter.$or = [
        { abstractNote_en: { $regex: regexFilterInput, $options: 'i' } },
        { toBookCode_en: { $regex: regexFilterInput, $options: 'i' } },
        { abstractNote: { $regex: regexFilterInput, $options: 'i' } },
        { toBookCode: { $regex: regexFilterInput, $options: 'i' } },
      ];
    }

    // Kiểm tra receiveDateInput
    if (Array.isArray(receiveDateInput) && receiveDateInput.length === 2) {
      filter.receiveDate = {
        $gte: moment(receiveDateInput[0], 'DD/MM/YYYY').startOf('day').toDate(),
        $lte: moment(receiveDateInput[1], 'DD/MM/YYYY').endOf('day').toDate(),
      };
    }

    //lấy dữ liệu các bản ghi và tệp đính kèm lọc được
    const documentFiles = await service.getDataDocument(filter);

    if (!documentFiles.documents) {
      return res.status(400).json({ status: 400, messages: 'Không tìm thấy tài liệu cần export' });
    }
    //tạo file excel và lấy path của file vừa đc tạo
    const pathExcelCreated = await service.createExelFile(documentFiles.documents);

    let attachments;
    if (!documentFiles.resultFile) {
      attachments = null;
    }

    //lấy path của các file đính kèm
    attachments = await service.getPathFile(documentFiles.resultFile);

    const outputFilePath = path.join(__dirname, '..', '..', 'files', `attachments_${Date.now() * 1}.zip`);
    const finalZipFile = path.join(__dirname, '..', '..', 'files', `data_export.zip`);
    if (attachments) {
      const checkAttachmentFile = await service.createZipFile(attachments, outputFilePath);
      if (checkAttachmentFile.status === 200) {
        // tạo file excel và file zip tệp đính kèm
        await service.createZipFile([pathExcelCreated, outputFilePath], finalZipFile);
      }
    }

    await Promise.all([deleteFolderAndContent(pathExcelCreated), deleteFolderAndContent(outputFilePath)]);
    res.download(finalZipFile, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Lỗi tải file'); // Đảm bảo chỉ gửi một lần
      }
      // Nếu cần, xóa file zip sau khi tải xong
      await deleteFolderAndContent(finalZipFile);
    });
  } catch (e) {
    return res.status(400).json(e);
  }
};

module.exports = { exportDataInZipFile };
