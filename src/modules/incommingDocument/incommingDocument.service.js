const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Document = require('./incommingDocument.model');
const Receiver = require('../../models/receiver.model');
const fileManager = require('../../models/fileManager.model');
const Client = require('../../models/client.model');
const unzipper = require('unzipper');
const mime = require('mime-types');
const xlsx = require('xlsx');
const iconv = require('iconv-lite');
const {
  removeVietnameseTones,
  existsPath,
  readExcelDataAsArray,
  checkForSingleZipAndExcel,
  deleteFolderAndContent,
  hasFileNameInArray,
} = require('../../config/common');
/**
 * Nhận thông tin file nén, giải nén file và lưu vào folder mong muốn
 * @param {Object} filePath path của file cần giải nén
 * @param {Object} foderPath Path của folder mong muốn lưu file
 */
const unzipFile = async (filePath, folderPath) => {
  try {
    //Kiểm tra Path có tồn tại không
    const [checkSaveFolder, checkZipFilePath] = await Promise.all([existsPath(folderPath), existsPath(filePath)]);
    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderPath);
    }
    if (!checkZipFilePath) {
      throw new Error('Không tìm thấy file cần giải nén!');
    }
    // Hàm giải nén file
    await fs
      .createReadStream(filePath)
      .pipe(unzipper.Extract({ path: folderPath }))
      .promise();
    //xóa file zip
    await deleteFolderAndContent(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * lấy thông tin về của 2 file sau khi giải nén
 * @param {String} foderPath path của folder vừa giải nén muốn kiểm tra và lấy dữ liệu
 * @returns trả về đối tượng gồm path của file excel và path của file zip đính kèm
 */
const getPathOfChildFileZip = async (folderPath) => {
  try {
    // Kiểm tra folderPath có tồn tại không
    const checkSaveFolder = await existsPath(folderPath);
    if (!checkSaveFolder) {
      throw new Error('Không tìm thấy folder vừa giải nén');
    }
    // kiểm tra thành phần có trong folder chứa các tệp giống định dạng đầu vào ko
    const check = await checkForSingleZipAndExcel(folderPath);
    if (!check) {
      return false;
      // throw new Error('Cấu trúc folder sau khi giải nén không đúng định dạng');
    }

    return check;
  } catch (e) {
    return e;
  }
};

/**
 * Kiểm tra dung lượng còn lại có thể sử dụng ở client
 * @param {String} objPath đối tượng chứa path file đính kèm và file excel
 * @param {String} clientId id của client để kiểm tra dung lượng
 * @param {String} folderToSave đường dẫn lưu file sau khi giải nén
 * @returns trả về đối tượng gồm path của file excel và path của file zip đính kèm
 */
const checkStorage = async (objPath, clientId, folderToSave) => {
  try {
    // Kiểm tra folderPath có tồn tại không
    if (!objPath.excelFile) {
      throw new Error('Không tìm thấy file excel');
    }
    const stats2 = fs.statSync(objPath.excelFile);
    let totalSize = stats2.size;
    if (objPath.zipFile) {
      let stats1 = fs.statSync(objPath.zipFile);
      totalSize = stats1.size + stats2.size;
    }

    // Kiểm tra dung lượng còn lại của client thông qua clientId xem đủ cho 2 file vừa đc giải nén ko
    if (clientId) {
      const client = await Client.findOne({ clientId });
      if (client) {
        if (client.storageCapacity) {
          const remainingStorage = client.storageCapacity - client.usedStorage;
          if (remainingStorage < totalSize) {
            //xóa đường dẫn lưu file giải nén
            await deleteFolderAndContent(folderToSave);
            return false;
            // throw new Error('Dung lượng còn lại ko đủ');
          } else {
            client.usedStorage += totalSize;
          }
        }
        await client.save();
      } else {
        throw new Error('ClientId không tồn tại');
      }
    }

    return true;
  } catch (e) {
    return e;
  }
};

/**
 * lấy dữ liệu của file đính kèm
 * @param {Object} pathAttachments path của file đính kèm cần lấy dữ liệu
 * @returns trả về mảng các đối tượng file đính kèm được giải nén
 */
const getDataFromAttachment = async (pathAttachmentsPath) => {
  try {
    // kiểm tra path tồn tại không
    const checkPathAttachments = await existsPath(pathAttachmentsPath);
    if (!checkPathAttachments) {
      throw new Error('Không tìm thấy file cần lấy thông tin');
    }
    // lấy dữ liệu của file đính kèm
    const files = await fsPromises.readdir(pathAttachmentsPath);
    const fileInfo = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(pathAttachmentsPath, file);
        const stats = await fsPromises.stat(filePath);
        const mimetype = stats.isDirectory() ? null : mime.lookup(filePath);
        return {
          name: file,
          filename: file,
          fullPath: filePath,
          size: stats.size,
          mimetype: mimetype,
          isDirectory: stats.isDirectory(),
        };
      }),
    );
    // trả về mảng file đính kèm được giải nén
    return fileInfo;
  } catch (e) {
    return e;
  }
};

async function getDataFromExcelFile(filePath, check = false) {
  try {
    // Đọc file Excel
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Lấy dữ liệu từ worksheet
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    return data;
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error.message);
    return null;
  }
}

/**
 * Xử lý dữ liệu tạo các bản ghi mới trong bảng document và file
 * @param {Array} dataExcel Mảng dữ liệu đọc từ excel
 * @param {Array} dataAttachments Mảng dữ liệu đọc từ file zip đính kèm
 * @param {*} config Cấu hình tùy chọn
 * @returns trả về những bản ghi mới từ file excel
 */
const processData = async (dataExcel, dataAttachments, config = {}) => {
  try {
    if (!Array.isArray(dataExcel)) {
      throw new Error('dataExcel không phải là một mảng');
    }
    if (!Array.isArray(dataAttachments)) {
      throw new Error('dataAttachments không phải là một mảng');
    }

    const resultDocs = [];
    const allResultFiles = [];
    // Lặp lấy dữ liệu của file excel
    for (const row of dataExcel) {
      if (row.length === 0) continue;

      const rowData = extractRowData(row);
      // Validate dữ liệu từ file excel
      validateRequiredFields(rowData);
      // Chuyển đổi chuỗi files sang dạng mảng
      let documentIncomming = await Document.findOne({ toBook: rowData.toBook });
      // Kiểm tra bản ghi đã tồn tại các trường duy nhất chưa
      if (!documentIncomming) {
        const arrFiles = rowData.files
          .trim()
          .split(',')
          .map((item) => item.trim());

        const resultFile = await processAttachments(dataAttachments, arrFiles);
        allResultFiles.push(...resultFile); // Lưu tất cả các file mới vào mảng allResultFiles

        let receiver = await Receiver.findOne({ name: rowData.receiverUnit });
        if (!receiver) {
          receiver = new Receiver({ name: rowData.receiverUnit });
          await receiver.save();
        }

        const document = createDocument(rowData, receiver, resultFile);
        const savedDocument = await Document.create(document); // Lưu tài liệu vào DB và lấy ID

        // Cập nhật trường `mid` cho từng file với ID của tài liệu vừa lưu
        for (const file of resultFile) {
          file.mid = savedDocument._id;
          await file.save();
        }

        resultDocs.push(savedDocument);
      }
    }
    // Trả về những bản ghi mới từ file excel và file đính kèm
    return { saveDocument: resultDocs, savedFiles: allResultFiles };
  } catch (error) {
    return error;
  }
};

/**
 * Trích xuất dữ liệu từ một dòng của file Excel và chuyển đổi tiếng Việt không dấu.
 * @param {Array} row - Một dòng dữ liệu từ file Excel.
 * @returns {Object} Dữ liệu đã được trích xuất và chuyển đổi.
 */
const extractRowData = (row) => {
  const toBook = row[0];
  const toBook_en = removeVietnameseTones(toBook);
  const abstractNote = row[1] || '';
  const abstractNote_en = removeVietnameseTones(abstractNote);
  const toBookNumber = row[2] || '';
  const urgencyLevel = row[3] || '';
  const urgencyLevel_en = removeVietnameseTones(urgencyLevel);
  const toBookCode = row[4] || '';
  const toBookCode_en = removeVietnameseTones(toBookCode);
  const senderUnit = row[5] || '';
  const senderUnit_en = removeVietnameseTones(senderUnit);
  const files = row[6] || '';
  const bookDocumentId = row[7] || '';
  const secondBook = row[8] || '';
  const receiverUnit = row[9] || '';
  const processorUnits = row[10] || '';
  const documentType = row[11] || '';
  const documentType_en = removeVietnameseTones(documentType);
  const documentField = row[12] || '';
  const documentField_en = removeVietnameseTones(documentField);
  const receiveMethod = row[13] || '';
  const receiveMethod_en = removeVietnameseTones(receiveMethod);
  const privateLevel = row[14] || '';
  const privateLevel_en = removeVietnameseTones(privateLevel);
  const currentNote = row[15] || '';
  const currentRole = row[16] || '';
  const nextRole = row[17] || '';
  const letterType = row[18] || '';
  const processAuthorString = row[19] || '';
  const toBookCodeDepartment = row[20] || '';

  return {
    toBook,
    toBook_en,
    abstractNote,
    abstractNote_en,
    toBookNumber,
    urgencyLevel,
    urgencyLevel_en,
    toBookCode,
    toBookCode_en,
    senderUnit,
    senderUnit_en,
    files,
    bookDocumentId,
    secondBook,
    receiverUnit,
    processorUnits,
    documentType,
    documentType_en,
    documentField,
    documentField_en,
    receiveMethod,
    receiveMethod_en,
    privateLevel,
    privateLevel_en,
    currentNote,
    currentRole,
    nextRole,
    letterType,
    processAuthorString,
    toBookCodeDepartment,
  };
};

/**
 * Kiểm tra các trường bắt buộc có được cung cấp không.
 * @param {Object} fields - Các trường dữ liệu cần kiểm tra.
 * @throws {Error} Nếu thiếu bất kỳ trường bắt buộc nào.
 */
const validateRequiredFields = ({ toBook, abstractNote, senderUnit, receiverUnit }) => {
  if (!toBook) {
    throw new Error('Thiếu số văn bản - cột 1');
  }
  if (!abstractNote) {
    throw new Error('Thiếu trích yếu - cột 2');
  }
  if (!senderUnit) {
    throw new Error('Thiếu đơn vị gửi - cột 6');
  }
  if (!receiverUnit) {
    throw new Error('Thiếu đơn vị nhận - cột 10');
  }
};

/**
 * Xử lý các file đính kèm từ dữ liệu đầu vào.
 * @param {Array} dataAttachments - Mảng dữ liệu file đính kèm.
 * @param {Array} arrFiles - Mảng tên file cần xử lý.
 * @returns {Promise<Array>} Mảng các đối tượng file đã được xử lý và lưu trữ.
 */
const processAttachments = async (dataAttachments, arrFiles) => {
  const resultFile = [];

  // kiểm tra trường files có tồn tại và phần tử nào thuộc file đính kèm ko
  if (dataAttachments.length >= 1) {
    const arrFileAttachments = await hasFileNameInArray(dataAttachments, arrFiles);
    // lặp mảng file vừa lấy được để thêm mới vào db
    for (const file of arrFileAttachments) {
      let existingFile = await fileManager.findOne({ name: file.name, fullPath: file.fullPath });

      if (!existingFile) {
        // Nếu file chưa tồn tại, tạo một bản ghi mới
        existingFile = new fileManager({
          ...file,
        });
      } else {
        // Nếu file đã tồn tại, cập nhật thông tin của nó
        Object.assign(existingFile, file);
      }
      // Lưu file (bản ghi mới hoặc cập nhật)
      await existingFile.save();
      resultFile.push(existingFile);
    }
  }

  return resultFile;
};

/**
 * Tạo đối tượng document mới từ dữ liệu đã xử lý.
 * @param {Object} rowData - Dữ liệu từ một dòng của file Excel.
 * @param {Object} receiver - Đối tượng receiver lấy từ cơ sở dữ liệu.
 * @param {Array} resultFile - Mảng các file đã xử lý.
 * @returns {Object} Đối tượng document mới.
 */
const createDocument = (rowData, receiver, resultFile) => {
  return {
    ...rowData,
    files: resultFile.length >= 1 ? resultFile.map((item) => item._id) : null,
    receiverUnit: receiver._id ? receiver._id : rowData.receiverUnit,
  };
};

module.exports = {
  unzipFile,
  getPathOfChildFileZip,
  getDataFromAttachment,
  getDataFromExcelFile,
  processData,
  checkStorage,
};
