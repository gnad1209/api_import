const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const incommingDocument = require('./incommingDocument.model');
const Document = require('../../models/document.model');
const crm = require('../../models/crmSource.model');
const organizationUnit = require('../../models/organizationUnit.model');
const fileManager = require('../../models/fileManager.model');
const Client = require('../../models/client.model');
const unzipper = require('unzipper');
const mime = require('mime-types');
const xlsx = require('xlsx');
const moment = require('moment');
const crmSourceInit = require('./crmSource.init');

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
const processData = async (dataExcel, dataAttachments, folderToSave, config = {}) => {
  try {
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
    // Lặp lấy dữ liệu của file excel
    for (const row of dataExcel) {
      if (row.length === 0) continue;

      const rowData = extractRowData(row);
      // Validate dữ liệu từ file excel
      validateRequiredFields(rowData);
      validateDates(rowData.documentDate, rowData.receiveDate, rowData.toBookDate, rowData.deadLine);

      // Chuyển đổi chuỗi files sang dạng mảng
      let documentIncomming = await incommingDocument.findOne({ toBook: rowData.toBook });

      // Kiểm tra bản ghi đã tồn tại các trường duy nhất chưa
      if (!documentIncomming) {
        //chuyển chuỗi các tên file từ excel thành mảng
        const arrFiles = rowData.files
          .trim()
          .split(',')
          .map((item) => item.trim());
        const resultFile = await processAttachments(dataAttachments, arrFiles, folderToSave);
        allResultFiles.push(...resultFile); // Lưu tất cả các file mới vào mảng allResultFiles

        let tobookNumber = await Document.findOne({ name: rowData.toBookNumber });
        let senderUnit = await organizationUnit.findOne({ value: rowData.senderUnit, type: 'senderUnit' });

        if (!senderUnit) {
          senderUnit = new organizationUnit({
            title: rowData.senderUnit,
            value: rowData.senderUnit_en,
            type: 'senderUnit',
          });
          await senderUnit.save();
          rowData.senderUnit = rowData.senderUnit_en;
        }
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
          } else throw new Error(`file đính kèm ${file.name} của vản bản có id ${file.mid}`);
          await file.save();
        }
        resultDocs.push(document);
      }
    }

    const savedDocument = await incommingDocument.insertMany(resultDocs);

    // Trả về những bản ghi mới từ file excel và file đính kèm
    return { saveDocument: savedDocument, savedFiles: allResultFiles };
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
  const senderUnit = row[4] || '';
  const senderUnit_en = removeVietnameseTones(senderUnit);
  const files = row[5] || '';
  const secondBook = row[6] || '';
  const receiverUnit = 'Công an thành phố Hà Nội 1';
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
    toBook_en,
    abstractNote,
    abstractNote_en,
    toBookNumber,
    urgencyLevel,
    senderUnit,
    senderUnit_en,
    files,
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
  };
};

/**
 * Kiểm tra các trường bắt buộc có được cung cấp đúng không.
 * @param {Object} fields - Các trường dữ liệu cần kiểm tra.
 * @throws {Error} Nếu thiếu bất kỳ trường bắt buộc nào.
 */
const validateRequiredFields = async (fields) => {
  const requiredFields = {
    toBook: 'Thiếu số văn bản - cột 1',
    abstractNote: 'Thiếu trích yếu - cột 2',
    senderUnit: 'Thiếu đơn vị gửi - cột 6',
    documentDate: 'Thiếu ngày vb - cột 15',
    receiveDate: 'Thiếu ngày nhận vb - cột 16',
    toBookDate: 'Thiếu ngày vào sổ - cột 17',
  };
  console.error('===============================');

  if (Array.isArray(crmSourceInit.crmSource)) {
    for (const element of crmSourceInit.crmSource) {
      console.log(element.code);
    }
  }

  const dataCrm = await crm.find();
  // console.log('dataCrm', dataCrm);
  const validationRules = {
    receiveMethod: [], //27
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
  // const validationRules = {
  //   receiveMethod: ['cong van giay', 'cong van dien tu'], //27
  //   urgencyLevel: ['thuong', 'khan', 'thuong khan', 'hoa toc'], // do khan
  //   privateLevel: ['mat', 'thuong', 'tuyet mat', 'toi mat'],
  //   documentType: ['cong van', 'don thu', 'tuong trinh', 'quyet dinh'],
  //   documentField: ['van ban quy pham phap luat', 'van ban hanh chinh', 'van ban chuyen nganh'],
  // };

  // Kiểm tra các trường bắt buộc
  for (const [field, errorMessage] of Object.entries(requiredFields)) {
    if (!fields[field]) {
      throw new Error(errorMessage);
    }
  }

  // Kiểm tra các trường theo giá trị hợp lệ
  for (const [field, validValues] of Object.entries(validationRules)) {
    const value = fields[`${field}`] || '';
    if (!validValues.includes(value)) {
      throw new Error(`giá trị ${field} phải là 1 trong những loại cho trước - cột ${getColumnNumber(field)}`);
    }
  }

  // Kiểm tra document tồn tại
  const document = await Document.findOne({ name: fields.toBookNumber });
  if (!document) {
    throw new Error('Không tìm thấy văn bản đến - cột 3');
  }
};

/**
 * Trả về số cột tương ứng với tên trường.
 * @param {string} field - Tên trường.
 * @returns {number} Số cột.
 */
const getColumnNumber = (field) => {
  const columnMap = {
    receiveMethod: 11,
    urgencyLevel: 4,
    privateLevel: 12,
    documentType: 9,
    documentField: 10,
  };

  return columnMap[field];
};

/**
 * Validate ngày tháng.
 * @param {string} documentDate - Ngày văn bản.
 * @param {string} receiveDate - ngày nhận văn bản đến.
 * @param {string} toBookDate - ngày vào sổ.
 * @param {string} deadLine - hạn được giao.
 * @returns {number} Số cột.
 */
const validateDates = (documentDate, receiveDate, toBookDate, deadLine) => {
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
    throw new Error('Ngày tài liệu (documentDate) không hợp lệ');
  }
  if (!moment(recDate, 'YYYY/MM/DD', true).isValid()) {
    throw new Error('Ngày nhận (receiveDate) không hợp lệ');
  }
  if (!moment(toBkDate, 'YYYY/MM/DD', true).isValid()) {
    throw new Error('Ngày gửi vào sổ (toBookDate) không hợp lệ');
  }
  if (!moment(dlDate, 'YYYY/MM/DD', true).isValid()) {
    throw new Error('Hạn chót (deadLine) không hợp lệ');
  }

  if (moment(docDate).isAfter(today)) {
    throw new Error('Ngày tài liệu (documentDate) không được lớn hơn ngày hiện tại');
  }

  if (moment(recDate).isBefore(docDate)) {
    throw new Error('Ngày nhận (receiveDate) không được nhỏ hơn ngày tài liệu (documentDate)');
  }

  if (moment(toBkDate).isBefore(docDate)) {
    throw new Error('Ngày gửi vào sổ (toBookDate) không được nhỏ hơn ngày tài liệu (documentDate)');
  }

  if (moment(dlDate).isBefore(today)) {
    throw new Error('Hạn chót (deadLine) không được nhỏ hơn ngày hiện tại');
  }
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
    // receiverUnit: receiver._id ? receiver._id : rowData.receiverUnit,
    // processorUnits: processor._id ? processor._id : rowData.processorUnits,
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
    }),
  );
  return document;
};

/**
 * chọn các trường từ bản ghi vừa được tạo
 * @param {Object} data - Dữ liệu file
 * @returns {Object} Đối tượng document mới.
 */
const selectFieldsFile = (data) => {
  const file = data.map(({ fullPath, name, parentPath, username, realName, mid }) => ({
    fullPath,
    name,
    parentPath,
    username,
    realName,
    mid,
  }));
  return file;
};

module.exports = {
  unzipFile,
  getPathOfChildFileZip,
  getDataFromAttachment,
  getDataFromExcelFile,
  processData,
  checkStorage,
  selectFieldsDocument,
  selectFieldsFile,
};
