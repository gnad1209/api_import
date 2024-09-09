const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const incommingDocument = require('../models/incommingDocument.model');
// const Document = require('../models/document.model');
const fileManager = require('../models/fileManager.model');
// const fileManager = require('../../server/api/fileManager/fileManager.model');
const moment = require('moment');
const ExcelJS = require('exceljs');
const archiver = require('archiver');

const { deleteFolderAndContent } = require('../config/common');

const getDataDocument = async (filter) => {
  try {
    const documents = await incommingDocument
      .find(
        filter,
        'toBook abstractNote urgencyLevel senderUnit files secondBook documentType documentField receiveMethod privateLevel documentDate receiveDate toBookDate deadLine signer',
      )
      .lean();
    if (documents?.length < 1) {
      return { status: 400, message: 'Không tìm thấy dữ liệu' };
    }
    let resultFile = [];
    documents.map((document) => {
      if (document.files) {
        document.files.map((file) => {
          resultFile.push(file.id);
        });
      }
      document.files = document.files.map((file) => file.name).join(', ');
      document.documentDate = moment(document.documentDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.receiveDate = moment(document.receiveDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.toBookDate = moment(document.toBookDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.deadLine = moment(document.deadLine, 'YYYY/MM/DD').format('DD/MM/YYYY');
    });
    return { documents, resultFile };
  } catch (e) {
    return e;
  }
};

const getPathFile = async (ids, documents) => {
  try {
    const files = await fileManager.find({ _id: { $in: ids } }, 'mid name fullPath');
    let arrPath = [];
    let arrName = [];
    files.map((file) => {
      arrPath.push(file.fullPath);
      documents.map((document) => {
        if (file.mid.toString() === document._id.toString()) {
          const name = document.toBook + ' ' + file.name;
          arrName.push(name);
        }
      });
    });
    return { arrPath, arrName };
  } catch (e) {
    return e;
  }
};

const createExelFile = async (documents) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.columns = [
      { header: 'Số văn bản(*)', key: 'toBook', width: 10 },
      { header: 'Trích yếu', key: 'abstractNote', width: 30 },
      { header: 'Độ khẩn', key: 'urgencyLevel', width: 10 },
      { header: 'Đơn vị gửi', key: 'senderUnit', width: 10 },
      { header: 'files', key: 'files', width: 10 },
      { header: 'Sổ phụ', key: 'secondBook', width: 10 },
      { header: 'Loại văn bản', key: 'documentType', width: 10 },
      { header: 'Lĩnh vực', key: 'documentField', width: 10 },
      { header: 'Phương thức nhận', key: 'receiveMethod', width: 10 },
      { header: 'Độ mật', key: 'privateLevel', width: 10 },
      { header: 'Ngày văn bản', key: 'documentDate', width: 10 },
      { header: 'Ngày nhận văn bản', key: 'receiveDate', width: 10 },
      { header: 'Ngày vào sổ', key: 'toBookDate', width: 10 },
      { header: 'Hạn được giao', key: 'deadLine', width: 10 },
      { header: 'Người ký', key: 'signer', width: 10 },
    ];
    documents.map((document) => {
      worksheet.addRow({
        toBook: document.toBook,
        abstractNote: document.abstractNote,
        urgencyLevel: document.urgencyLevel,
        senderUnit: document.senderUnit,
        files: document.files,
        secondBook: document.secondBook,
        documentType: document.documentType,
        documentField: document.documentField,
        receiveMethod: document.receiveMethod,
        privateLevel: document.privateLevel,
        documentDate: document.documentDate,
        receiveDate: document.receiveDate,
        toBookDate: document.toBookDate,
        deadLine: document.deadLine,
        signer: document.signer,
      });
    });
    const excelFilePath = path.join(__dirname, '..', '..', 'files', 'file.xlsx');
    await workbook.xlsx.writeFile(excelFilePath);
    return excelFilePath;
  } catch (e) {
    return e;
  }
};

const createZipFile = async (arrPath, arrName, outputFilePath) => {
  try {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // set compression level to the highest
      });

      // Lắng nghe sự kiện khi tạo tệp ZIP hoàn thành
      output.on('close', () => {
        console.log(`Tạo file zip thành công: ${archive.pointer()} tổng số byte`);
        resolve();
      });

      // Lắng nghe sự kiện lỗi
      archive.on('error', (err) => {
        reject(err);
      });

      // Bắt đầu nén file
      archive.pipe(output);

      // Thêm từng file vào archive
      arrPath.forEach((filePath) => {
        console.log(path);
        let i = 0;
        const fileName = path.basename(filePath); // Lấy tên tệp từ đường dẫn
        archive.file(filePath, { name: fileName });
        i++;
      });

      // Kết thúc quá trình nén
      archive.finalize();
    });
  } catch (e) {
    return e;
  }
};

module.exports = {
  getDataDocument,
  getPathFile,
  createExelFile,
  createZipFile,
};
