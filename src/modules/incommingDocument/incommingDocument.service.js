const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const incommingDocument = require('./incommingDocument.model');
const Document = require('../../models/document.model');
const crm = require('../../models/crmSource.model');
const Employee = require('../../models/employee.model');
const organizationUnit = require('../../models/organizationUnit.model');
const fileManager = require('../../models/fileManager.model');
const Client = require('../../models/client.model');
const unzipper = require('unzipper');
const mime = require('mime-types');
const xlsx = require('xlsx');
const moment = require('moment');

const fakeValue = require('./fakeValue.json');
const {
  removeVietnameseTones,
  existsPath,
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
          isFile: stats.isDirectory() ? false : true,
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

    // Lấy dữ liệu từ worksheet, bắt đầu từ dòng thứ 2
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

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
const processData = async (dataExcel, dataAttachments, folderToSave, clientId, username, createdBy, code) => {
  try {
    const employee = await Employee.findOne({ username });

    if (!employee.departmentName) {
      throw new Error('Lỗi ko tìm thấy phòng ban');
    }
    if (!Array.isArray(dataExcel)) {
      throw new Error('dataExcel không phải là một mảng');
    }
    if (!Array.isArray(dataAttachments)) {
      throw new Error('dataAttachments không phải là một mảng');
    }
    if (!folderToSave) {
      throw new Error('Không tồn tại đường dẫn chứa các file import');
    }

    const resultDocs = [];
    const allResultFiles = [];
    const allErrors = []; // Mảng chứa tất cả các lỗi
    const errorsFile = [];
    const errorDocuments = [];
    // Lặp lấy dữ liệu của file excel
    for (let i = 0; i < dataExcel.length; i++) {
      const row = dataExcel[i];
      if (row.length === 0) continue;
      const rowData = extractRowData(row);
      rowData.kanbanStatus = 'receive';
      rowData.receiverUnit = employee.departmentName;
      rowData.createdBy = createdBy;

      // Validate dữ liệu từ file excel
      const errors = await validateRequiredFields(rowData, i + 1);
      const errorsDate = validateDates(
        rowData.documentDate,
        rowData.receiveDate,
        rowData.toBookDate,
        rowData.deadLine,
        i + 1,
      );

      if (errors.length > 0 || errorsDate.length > 0) {
        allErrors.push(...errors, ...errorsDate); // Đẩy tất cả lỗi vào mảng lỗi chung
        continue; // Nếu có lỗi, bỏ qua dòng này và tiếp tục với dòng tiếp theo
      }

      // Xử lý đính kèm
      let documentIncomming = await incommingDocument.findOne({
        toBook: rowData.toBook,
        receiverUnit: employee.departmentName,
        senderUnit: rowData.senderUnit,
        documentDate: {
          $gte: moment(data.documentDate, 'YYYY-MM-DD').startOf('day').toDate(),
          $lte: moment(data.documentDate, 'YYYY-MM-DD').endOf('day').toDate(),
        },
      });
      if (documentIncomming) {
        errorDocuments = errorDocuments.push({ status: 400, message: `Đã tồn tại văn bản số ${i}` });
        allErrors.push(...errorsDocument);
        continue;
      }
      const arrFiles = rowData.files
        .trim()
        .split(',')
        .filter((item) => {
          item = item.trim(); // Trim từng item trước khi kiểm tra
          if (allResultFiles.some((file) => file.name === item)) {
            errorsFile.push({
              status: 400,
              message: `Lỗi file dòng thứ ${i + 1}: File "${item}" trùng với file trước đó`,
            });
            return false; // Bỏ qua item này
          }
          return true; // Giữ lại item nếu nó không trùng
        });
      allErrors.push(...errorsFile);
      const resultFile = await processAttachments(
        dataAttachments,
        arrFiles,
        folderToSave,
        clientId,
        username,
        createdBy,
        code,
      );
      allResultFiles.push(...resultFile);

      let tobookNumber = await Document.findOne({ name: rowData.toBookNumber });

      if (tobookNumber) {
        tobookNumber.number = Number(tobookNumber.number) + 1;
        await tobookNumber.save();
        rowData.bookDocumentId = tobookNumber._id;
        rowData.toBookNumber = tobookNumber.number;
      }

      const document = await createDocument(rowData, resultFile);

      // Cập nhật trường `mid` cho từng file với ID của tài liệu vừa lưu
      for (const file of resultFile) {
        if (!file.mid) {
          file.mid = document._id;
        } else {
          throw new Error(`file đính kèm ${file.name} của vản bản có id ${file.mid}`);
        }
        await file.save();
      }
      resultDocs.push(document);
    }
    // Lưu tất cả các bản ghi mới từ file excel
    const savedDocument = await incommingDocument.insertMany(resultDocs);
    // Trả về những bản ghi mới từ file excel và file đính kèm
    const logErrors = allErrors.length > 0 ? allErrors : null;

    return { saveDocument: savedDocument, savedFiles: allResultFiles, errors: logErrors };
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
  const abstractNote = row[1] || '';
  const toBookNumber = row[2] || '';
  const urgencyLevel = row[3] || '';
  const senderUnit = row[4] || '';
  const files = row[5] || '';
  const secondBook = row[6] || '';
  const documentType = row[7] || '';
  const documentField = row[8] || '';
  const receiveMethod = row[9] || '';
  const privateLevel = row[10] || '';
  const documentDate = row[11] || '';
  const receiveDate = row[12] || '';
  const toBookDate = row[13] || '';
  const deadLine = row[14] || '';

  return {
    toBook,
    abstractNote,
    toBookNumber,
    urgencyLevel,
    senderUnit,
    files,
    secondBook,
    documentType,
    documentField,
    receiveMethod,
    privateLevel,
    documentDate,
    receiveDate,
    toBookDate,
    deadLine,
  };
};

/**
 * Kiểm tra các trường bắt buộc có được cung cấp đúng không.
 * @param {Object} fields - Các trường dữ liệu cần kiểm tra.
 * @throws {Error} Nếu thiếu bất kỳ trường bắt buộc nào.
 */
const validateRequiredFields = async (fields, rowNumber) => {
  let resultErr = [];

  const requiredFields = {
    toBook: 'Thiếu số văn bản - cột 1',
    abstractNote: 'Thiếu trích yếu - cột 2',
    senderUnit: 'Thiếu đơn vị gửi - cột 6',
    documentDate: 'Thiếu ngày vb - cột 15',
    receiveDate: 'Thiếu ngày nhận vb - cột 16',
    toBookDate: 'Thiếu ngày vào sổ - cột 17',
  };

  const dataCrm = await crm.find();
  const validationRules = {
    receiveMethod: [], // 27
    urgencyLevel: [], // do khan
    privateLevel: [],
    documentType: [],
    documentField: [],
  };

  dataCrm.forEach((element) => {
    switch (element.code) {
      case 'S27':
        validationRules.receiveMethod = element.data.map((item) => item.value);
        break;
      case 'S20':
        validationRules.urgencyLevel = element.data.map((item) => item.value);
        break;
      case 'S21':
        validationRules.privateLevel = element.data.map((item) => item.value);
        break;
      case 'S19':
        validationRules.documentType = element.data.map((item) => item.value);
        break;
      case 'S26':
        validationRules.documentField = element.data.map((item) => item.value);
        break;
      default:
        break;
    }
  });

  // Kiểm tra các trường bắt buộc
  for (const [field, errorMessage] of Object.entries(requiredFields)) {
    if (!fields[field]) {
      resultErr.push({
        status: 400,
        errors: [`${errorMessage} - dòng thứ ${rowNumber}`],
      });
    }
  }

  // Kiểm tra các trường theo giá trị hợp lệ
  for (const [field, validValues] of Object.entries(validationRules)) {
    const value = fields[field] || '';
    if (validValues.length && !validValues.includes(value)) {
      resultErr.push({
        status: 400,
        errors: [`Giá trị ${field} phải là một trong những loại cho trước - dòng thứ ${rowNumber}`],
      });
    }
  }

  // Kiểm tra document tồn tại
  const document = await Document.findOne({ name: fields.toBookNumber });
  if (!document) {
    resultErr.push({
      status: 400,
      errors: [`Không tìm thấy văn bản đến - dòng thứ ${rowNumber}`],
    });
  }

  // Trả về mảng lỗi nếu có
  return resultErr;
};

/**
 * Validate ngày tháng.
 * @param {string} documentDate - Ngày văn bản.
 * @param {string} receiveDate - ngày nhận văn bản đến.
 * @param {string} toBookDate - ngày vào sổ.
 * @param {string} deadLine - hạn được giao.
 * @returns {number} Số cột.
 */
const validateDates = (documentDate, receiveDate, toBookDate, deadLine, rowNumber) => {
  const errors = [];

  // Đổi định dạng các ngày về YYYY/MM/DD
  const docDate = moment(documentDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
  const recDate = moment(receiveDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
  const toBkDate = moment(toBookDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
  let dlDate;
  if (deadLine) {
    dlDate = moment(deadLine, 'DD/MM/YYYY').format('YYYY/MM/DD');
  }

  const today = moment().format('YYYY/MM/DD');

  if (!moment(docDate, 'YYYY/MM/DD', true).isValid()) {
    errors.push({ status: 400, message: `Ngày tài liệu (documentDate) không hợp lệ - dòng thứ ${rowNumber}` });
  }
  if (!moment(recDate, 'YYYY/MM/DD', true).isValid()) {
    errors.push({ status: 400, message: `Ngày nhận (receiveDate) không hợp lệ - dòng thứ ${rowNumber}` });
  }
  if (!moment(toBkDate, 'YYYY/MM/DD', true).isValid()) {
    errors.push({ status: 400, message: `Ngày gửi vào sổ (toBookDate) không hợp lệ - dòng thứ ${rowNumber}` });
  }
  if (deadLine && !moment(dlDate, 'YYYY/MM/DD', true).isValid()) {
    errors.push({ status: 400, message: `Hạn chót (deadLine) không hợp lệ - dòng thứ ${rowNumber}` });
  }

  if (moment(docDate).isAfter(today)) {
    errors.push({
      status: 400,
      message: `Ngày tài liệu (documentDate) không được lớn hơn ngày hiện tại - dòng thứ ${rowNumber}`,
    });
  }

  if (moment(recDate).isBefore(docDate)) {
    errors.push({
      status: 400,
      message: `Ngày nhận (receiveDate) không được nhỏ hơn ngày tài liệu (documentDate) - dòng thứ ${rowNumber}`,
    });
  }

  if (moment(toBkDate).isBefore(docDate)) {
    errors.push({
      status: 400,
      message: `Ngày gửi vào sổ (toBookDate) không được nhỏ hơn ngày tài liệu (documentDate) - dòng thứ ${rowNumber}`,
    });
  }

  if (deadLine && moment(dlDate).isBefore(today)) {
    errors.push({
      status: 400,
      message: `Hạn chót (deadLine) không được nhỏ hơn ngày hiện tại - dòng thứ ${rowNumber}`,
    });
  }

  return errors;
};

/**
 * Xử lý các file đính kèm từ dữ liệu đầu vào.
 * @param {Array} dataAttachments - Mảng dữ liệu file đính kèm.
 * @param {Array} arrFiles - Mảng tên file cần xử lý.
 * @param {Array} folderToSave - Đường dẫn folder sau khi giải nén.
 * @param {Array} clientId - client Id.
 * @param {Array} username - tên người dùng import dữ liệu.
 * @param {Array} createdBy - id người tạo bản ghi file.
 * @param {Array} code - Đại diện cho module upload file.
 * @returns {Promise<Array>} Mảng các đối tượng file đã được xử lý và lưu trữ.
 */

const processAttachments = async (dataAttachments, arrFiles, folderToSave, clientId, username, createdBy, code) => {
  const resultFile = [];

  // kiểm tra trường files có tồn tại và phần tử nào thuộc file đính kèm ko
  if (dataAttachments.length >= 1) {
    // lấy mảng file đính kèm có tên tồn tại trong trường file ở excel
    const arrFileAttachments = await hasFileNameInArray(dataAttachments, arrFiles);
    // lặp mảng file vừa lấy được để thêm mới vào db
    for (const file of arrFileAttachments) {
      let existingFile = await fileManager.findOne({ name: file.name, fullPath: file.fullPath });

      if (!existingFile) {
        // Nếu file chưa tồn tại, tạo một bản ghi mới
        existingFile = new fileManager({
          ...file,
          parentPath: folderToSave,
          username: username,
          isFile: true,
          realName: `${folderToSave}/${file.name}`,
          clientId: clientId,
          code: code,
          nameRoot: `${folderToSave}/${file.name}`,
          createdBy: createdBy,
          smartForm: fakeValue.smartForm,
          isFileSync: fakeValue.isFileSync,
          folderChild: fakeValue.folderChild,
          isStarred: fakeValue.isStarred,
          isEncryption: fakeValue.isEncryption,
          shares: fakeValue.shares,
          isConvert: fakeValue.isConvert,
          internalTextIds: fakeValue.internalTextIds,
          canDelete: fakeValue.canDelete,
          canEdit: fakeValue.canEdit,
          status: fakeValue.status,
          isApprove: fakeValue.isApprove,
          public: fakeValue.public,
          permissions: fakeValue.permissions,
          users: fakeValue.users,
          hasChild: fakeValue.hasChild,
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
const createDocument = (rowData, resultFile) => {
  const document = new incommingDocument({
    ...rowData,
    files: resultFile.length >= 1 ? resultFile.map((item) => item._id) : null,
  });

  return document;
};

/**
 * chọn các trường từ bản ghi vừa được tạo
 * @param {Object} data - Dữ liệu bản ghi
 * @returns {Object} Đối tượng document mới.
 */
const selectFieldsDocument = (data) => {
  const document = data.map(
    ({
      toBook,
      abstractNote,
      toBookNumber,
      urgencyLevel,
      senderUnit,
      files,
      bookDocumentId,
      secondBook,
      receiverUnit,
      documentType,
      documentField,
      receiveMethod,
      privateLevel,
      documentDate,
      receiveDate,
      toBookDate,
      deadLine,
      kanbanStatus,
      createdBy,
    }) => ({
      toBook,
      abstractNote,
      toBookNumber,
      urgencyLevel,
      senderUnit,
      files,
      bookDocumentId,
      secondBook,
      receiverUnit,
      documentType,
      documentField,
      receiveMethod,
      privateLevel,
      documentDate,
      receiveDate,
      toBookDate,
      deadLine,
      kanbanStatus,
      createdBy,
    }),
  );
  return document;
};

// /**
//  * chọn các trường từ bản ghi vừa được tạo
//  * @param {Object} data - Dữ liệu file
//  * @returns {Object} Đối tượng document mới.
//  */
// const selectFieldsFile = (data) => {
//   const file = data.map(({ fullPath, name, parentPath, username, realName, mid }) => ({
//     fullPath,
//     name,
//     parentPath,
//     username,
//     realName,
//     mid,
//   }));
//   return file;
// };

module.exports = {
  unzipFile,
  getPathOfChildFileZip,
  getDataFromAttachment,
  getDataFromExcelFile,
  processData,
  checkStorage,
  selectFieldsDocument,
  // selectFieldsFile,
};
