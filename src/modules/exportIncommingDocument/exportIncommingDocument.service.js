const path = require('path');
const fs = require('fs');
const incommingDocument = require('../models/incommingDocument.model');
const fileManager = require('../models/fileManager.model');
const crm = require('../models/crmSource.model');
// const fileManager = require('../../server/api/fileManager/fileManager.model');
const moment = require('moment');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const { deleteFolderAndContent } = require('../config/common');

/**
 * Lọc điều kiện tìm kiếm hn
 * @param {Object} filter Mảng dữ liệu đọc từ excel
 * @returns trả về những bản ghi mới từ file excel
 */
const getDataDocument = async (filter) => {
  try {
    const documents = await incommingDocument
      .find(
        filter,
        'toBook abstractNote urgencyLevel senderUnit files secondBook documentType documentField receiveMethod privateLevel documentDate receiveDate toBookDate deadline signer',
      )
      .lean();
    if (documents.length < 1) {
      throw new Error('Không tìm thấy bản ghi cần export');
    }
    let resultFile = [];
    for (const document of documents) {
      if (!document.files) {
        document.files = null;
      } else {
        document.files.map((file) => {
          resultFile.push(file.id);
        });
        document.files = document.files.map((file) => file.name).join(', ');
      }
      const signers = await crm.findOne({ code: 'nguoiki' }, 'data').lean();
      if (document.signer.title) {
        signers.data.map((signer, index) => {
          if (signer.title.toString() && signer.title.trim() === document.signer.title.trim()) {
            document.signer = signer.value;
          }
        });
      }
      document.documentDate = moment(document.documentDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.receiveDate = moment(document.receiveDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.toBookDate = moment(document.toBookDate, 'YYYY/MM/DD').format('DD/MM/YYYY');
      document.deadline = document.deadline ? moment(document.deadline, 'YYYY/MM/DD').format('DD/MM/YYYY') : null;
    }
    return { documents, resultFile };
  } catch (e) {
    return e;
  }
};

/**
 * Lấy đường dẫn các file đính kèm
 * @param {Array} ids Mảng id của các file đính kèm của các bản ghi
 * @param {Array} documents Mảng các bản ghi vừa được lọc
 * @returns trả về những bản ghi mới từ file excel
 */
const getPathFile = async (ids) => {
  try {
    const files = await fileManager.find({ _id: { $in: ids } }, 'mid name parentPath realName fullPath');
    let arrPath = [];
    files.map((file) => {
      arrPath.push(file.fullPath);
    });
    return arrPath;
  } catch (e) {
    throw e;
  }
};

/**
 * tạo file excel từ các bản ghi vừa được lọc
 * @param {Array} documents Mảng dữ liệu bản ghi được lọc
 * @param {*} config Cấu hình tùy chọn
 * @returns trả về những bản ghi mới từ file excel
 */
const createExelFile = async (documents) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.columns = [
      { header: 'Số văn bản(*)', key: 'toBook', width: 10 },
      { header: 'Trích yếu(*)', key: 'abstractNote', width: 30 },
      { header: 'Độ khẩn', key: 'urgencyLevel', width: 10 },
      { header: 'Đơn vị gửi(*)', key: 'senderUnit', width: 15 },
      { header: 'files', key: 'files', width: 10 },
      { header: 'Sổ phụ', key: 'secondBook', width: 10 },
      { header: 'Loại văn bản', key: 'documentType', width: 10 },
      { header: 'Lĩnh vực', key: 'documentField', width: 10 },
      { header: 'Phương thức nhận', key: 'receiveMethod', width: 10 },
      { header: 'Độ mật', key: 'privateLevel', width: 10 },
      { header: 'Ngày văn bản(*)', key: 'documentDate', width: 15 },
      { header: 'Ngày nhận văn bản(*)', key: 'receiveDate', width: 15 },
      { header: 'Ngày vào sổ(*)', key: 'toBookDate', width: 15 },
      { header: 'Hạn được giao', key: 'deadline', width: 15 },
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
        deadline: document.deadline,
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

/**
 * tạo file zip nén các file được chỉ định
 * @param {Array} arrPath Mảng đường dẫn các file định nén
 * @param {Array} arrName Mảng tên file đính kèm
 * @param {String} outputFilePath Đường dẫn lưu file sau khi nén
 * @param {*} config Cấu hình tùy chọn
 * @returns trả về những bản ghi mới từ file excel
 */
const createZipFile = async (arrPath, outputFilePath, arrName) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // set compression level to the highest
    });

    // Lắng nghe sự kiện khi tạo tệp ZIP hoàn thành
    output.on('close', () => {
      console.log(`Tạo file zip thành công: ${archive.pointer()} tổng số byte`);
      resolve({ status: 200 });
    });
    // Lắng nghe sự kiện lỗi
    archive.on('error', (err) => {
      reject(err);
    });

    // Bắt đầu nén file
    archive.pipe(output);

    // Thêm từng file vào archive
    arrPath.forEach((filePath, index) => {
      if (fs.existsSync(filePath)) {
        if (arrName.length < 1) {
          console.log(filePath);
          const fileName = `${index}_${path.basename(filePath)}`;
          archive.file(filePath, { name: fileName });
        }
        const fileName = arrName[index];
        archive.file(filePath, { name: fileName });
      } else {
        console.log(`path ${filePath} k ton tai`);
      }
    });

    // Kết thúc quá trình nén
    archive.finalize();
  });
};

module.exports = {
  getDataDocument,
  getPathFile,
  createExelFile,
  createZipFile,
};
