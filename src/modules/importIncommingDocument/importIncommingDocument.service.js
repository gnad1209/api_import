const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const incommingDocument = require('../models/incommingDocument.model');
const crm = require('../models/crmSource.model');
const Employee = require('../models/employee.model');

const fileManager = require('../models/fileManager.model'); // model test local
const SenderUnit = require('../models/senderUnit.model');
// const fileManager = require('../../server/api/fileManager/fileManager.model');
const Client = require('../models/client.model');
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
} = require('../config/common');
/**
 * Nhận thông tin file nén, giải nén file và lưu vào folder mong muốn
 * @param {Object} filePath path của file cần giải nén
 * @param {Object} foderPath Path của folder mong muốn lưu file
 */
const unzipFile = async (folderPath, filePath) => {
  try {
    //Kiểm tra Path có tồn tại không
    const [checkSaveFolder, checkZipFilePath] = await Promise.all([existsPath(folderPath), existsPath(filePath)]);

    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderPath);
    }
    if (!checkZipFilePath) {
      return { status: 400, message: 'Không tìm thấy file cần giải nén!' };
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
      return { status: 400, message: 'Không tìm thấy folder vừa giải nén' };
    }
    // kiểm tra thành phần có trong folder chứa các tệp giống định dạng đầu vào ko
    const check = await checkForSingleZipAndExcel(folderPath);
    if (!check) {
      return false;
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
      return { status: 400, message: 'Không tìm thấy file excel' };
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
          } else {
            client.usedStorage += totalSize;
          }
        }
        await client.save();
      } else {
        return { status: 400, message: 'ClientId không tồn tại' };
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
    if (!pathAttachmentsPath) {
      throw new Error('Không nhận đc path file đính kèm');
    }
    const checkPathAttachments = await existsPath(pathAttachmentsPath);
    if (!checkPathAttachments) {
      return { status: 400, message: 'Không tìm thấy file cần lấy thông tin' };
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
const processData = async (dataExcel, dataAttachments, folderToSave, clientId, username, code) => {
  try {
    const employee = await Employee.findOne({ username }).lean();
    if (!employee) {
      return { status: 400, message: 'Người dùng không tồn tại' };
    }
    if (!employee.organizationUnit) {
      return { status: 400, message: 'Lỗi không tìm thấy phòng ban' };
    }
    if (!Array.isArray(dataExcel)) {
      return { status: 400, message: 'dataExcel không phải là một mảng' };
    }
    if (!Array.isArray(dataAttachments)) {
      return { status: 400, message: 'dataAttachments không phải là một mảng' };
    }
    if (!folderToSave) {
      return { status: 400, message: 'Không tồn tại đường dẫn chứa các file import' };
    }

    const resultDocs = [];
    const allErrors = []; // Mảng chứa tất cả các lỗi
    const errorDocuments = [];
    // Lặp lấy dữ liệu của file excel
    for (let i = 0; i < dataExcel.length; i++) {
      const row = dataExcel[i];
      if (row.length === 0) continue;
      const rowData = extractRowData(row);
      const date = convertData(rowData);
      rowData.documentDate = date.documentDate;
      rowData.receiveDate = date.receiveDate;
      rowData.toBookDate = date.toBookDate;
      rowData.deadline = date.deadline;
      rowData.kanbanStatus = 'receive';
      rowData.receiverUnit = employee.organizationUnit.organizationUnitId;
      rowData.receiverUnit = '66dbcff337232cbd8902a399';
      rowData.createdBy = employee._id;

      // Validate dữ liệu từ file excel
      const errors = await validateRequiredFields(rowData, i + 1);
      const errorsDate = validateDates(
        rowData.documentDate,
        rowData.receiveDate,
        rowData.toBookDate,
        rowData.deadline,
        i + 1,
      );
      if (errors.length > 0 || errorsDate.length > 0) {
        allErrors.push(...errors, ...errorsDate); // Đẩy tất cả lỗi vào mảng lỗi chung
        continue; // Nếu có lỗi, bỏ qua dòng này và tiếp tục với dòng tiếp theo
      }

      //check trùng trong file excel
      const duplicateInMemory = resultDocs.some((doc) => {
        return (
          doc.toBook === rowData.toBook &&
          doc.receiverUnit === employee.organizationUnit.organizationUnitId &&
          doc.senderUnit === rowData.senderUnit &&
          moment(doc.documentDate).isSame(moment(rowData.documentDate, 'DD/MM/YYYY'), 'day')
        );
      });

      if (duplicateInMemory) {
        const errorMessage = `Đã tồn tại văn bản số ${i + 1} trong các tài liệu đang nhập`;
        if (!allErrors.some((error) => error.message === errorMessage)) {
          errorDocuments.push({ status: 400, message: errorMessage });
        }
        continue;
      }

      // check trùng trong db
      const documentIncomming = await incommingDocument
        .findOne(
          {
            status: 1,
            toBook: rowData.toBook,
            receiverUnit: '66dbcff337232cbd8902a399',
            senderUnit: rowData.senderUnit,
            documentDate: {
              $gte: moment(rowData.documentDate, 'YYYY/MM/DD').startOf('day').toDate(),
              $lte: moment(rowData.documentDate, 'YYYY/MM/DD').endOf('day').toDate(),
            },
          },
          '_id',
        )
        .lean();
      console.log(documentIncomming);

      if (documentIncomming) {
        const errorMessage = `Đã tồn tại văn bản số ${i + 1}`;
        if (!allErrors.some((error) => error.message === errorMessage)) {
          errorDocuments.push({ status: 400, message: errorMessage });
        }
        continue;
      }

      const senderUnit = await SenderUnit.findOne({ value: rowData.senderUnit, status: 1 }, '_id').lean();

      const signer = await crm.findOne({ code: 'nguoiki', status: 1 }, '_id data');
      signer.data.map((item) => {
        if (item.value === rowData.signer) {
          rowData.signer = { title: item.title, value: item._id };
        }
      });
      if (!senderUnit) {
        const errorMessage = `Không tìm thấy đơn vị gửi ở bản ghi số ${i + 1}`;
        if (!allErrors.some((error) => error.message === errorMessage)) {
          errorDocuments.push({ status: 400, message: errorMessage });
        }
        continue;
      }

      // Trim từng item trước khi kiểm tra
      const arrFiles = rowData.files ? rowData.files.split(',').map((item) => item.trim()) : [];

      const resultFile = await processAttachments(
        dataAttachments,
        arrFiles,
        folderToSave,
        clientId,
        username,
        employee._id,
        code,
      );

      const document = await createDocument(rowData, resultFile);

      // Cập nhật trường `mid` cho từng file với ID của tài liệu vừa lưu
      for (const file of resultFile) {
        if (!file.mid) {
          file.mid = document._id;
          await file.save();
        } else if (document.files) {
          document.files = document.files.filter((item) => item.name !== file.name);
          errorDocuments.push({ status: 100, message: `file đính kèm ${file.name} này đã tồn tại ở bản ghi khác` });
          continue;
        }
      }
      resultDocs.push(document);
    }
    allErrors.push(...errorDocuments);
    // Lưu tất cả các bản ghi mới từ file excel
    const documents = await incommingDocument.insertMany(resultDocs);
    if (!documents) {
      documents = [];
    }
    // Trả về những bản ghi mới từ file excel và file đính kèm
    const logErrors = allErrors.length > 0 ? allErrors : null;

    return { errors: logErrors, documents: documents };
  } catch (error) {
    console.log('ERRO222R: ', error);
    return error;
  }
};

/**
 * Trích xuất dữ liệu từ một dòng của file Excel và chuyển đổi tiếng Việt không dấu.
 * @param {Array} row - Một dòng dữ liệu từ file Excel.
 * @returns {Object} Dữ liệu đã được trích xuất và chuyển đổi.
 */
const extractRowData = (row) => {
  try {
    const toBook = row[0];
    const abstractNote = row[1];
    const urgencyLevel = row[2];
    const senderUnit = row[3];
    const files = row[4];
    const secondBook = row[5];
    const documentType = row[6];
    const documentField = row[7];
    const receiveMethod = row[8];
    const privateLevel = row[9];
    const documentDate = row[10];
    const receiveDate = row[11];
    const toBookDate = row[12];
    const deadline = row[13];
    const signer = row[14];

    return {
      toBook,
      abstractNote,
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
      deadline,
      signer,
    };
  } catch (e) {
    return e;
  }
};

/**
 * Kiểm tra các trường bắt buộc có được cung cấp đúng không.
 * @param {Object} fields - Các trường dữ liệu cần kiểm tra.
 * @throws {Error} Nếu thiếu bất kỳ trường bắt buộc nào.
 */
const validateRequiredFields = async (fields, rowNumber) => {
  try {
    let resultErr = [];
    const requiredFields = {
      toBook: 'Thiếu số văn bản - cột 1',
      abstractNote: 'Thiếu trích yếu - cột 2',
      senderUnit: 'Thiếu đơn vị gửi - cột 5',
      documentDate: 'Thiếu ngày vb - cột 10',
      receiveDate: 'Thiếu ngày nhận vb - cột 11',
      toBookDate: 'Thiếu ngày vào sổ - cột 12',
    };

    // Kiểm tra các trường bắt buộc
    for (const [field, errorMessage] of Object.entries(requiredFields)) {
      if (!fields[field]) {
        resultErr.push({
          status: 400,
          errors: `${errorMessage} - dòng thứ ${rowNumber}`,
        });
      }
    }

    const dataCrm = await crm
      .find(
        {
          code: {
            $in: ['S27', 'S20', 'S21', 'S19', 'S26', 'nguoiki'],
          },
          status: 1,
        },
        'code data title',
      )
      .lean();

    const validationRules = {
      receiveMethod: [], // 27
      urgencyLevel: [], // do khan
      privateLevel: [],
      documentType: [],
      documentField: [],
      signer: [],
    };
    const fieldTitles = {};
    dataCrm.forEach((element) => {
      switch (element.code) {
        case 'S27':
          validationRules.receiveMethod = element.data.map((item) => item.value);
          fieldTitles.receiveMethod = element.title;
          break;
        case 'S20':
          validationRules.urgencyLevel = element.data.map((item) => item.value);
          fieldTitles.urgencyLevel = element.title;
          break;
        case 'S21':
          validationRules.privateLevel = element.data.map((item) => item.value);
          fieldTitles.privateLevel = element.title;
          break;
        case 'S19':
          validationRules.documentType = element.data.map((item) => item.value);
          fieldTitles.documentType = element.title;
          break;
        case 'S26':
          validationRules.documentField = element.data.map((item) => item.value);
          fieldTitles.documentField = element.title;
          break;
        case 'nguoiki':
          validationRules.signer = element.data.map((item) => item.value);
          fieldTitles.signer = element.title ? element.title : 'Người ký';
          break;
        default:
          break;
      }
    });
    // Kiểm tra các trường theo giá trị hợp lệ
    for (const [field, validValues] of Object.entries(validationRules)) {
      const value = fields[field] || '';
      if (validValues.length && !validValues.includes(value)) {
        // gán tên title
        const fieldError = fieldTitles[field];
        resultErr.push({
          status: 400,
          errors: `Giá trị ${fieldError} phải là một trong những mã cho trước - dòng thứ ${rowNumber}`,
        });
      }
    }

    // Trả về mảng lỗi nếu có
    return resultErr;
  } catch (e) {
    return e;
  }
};

/**
 * Validate ngày tháng.
 * @param {string} documentDate - Ngày văn bản.
 * @param {string} receiveDate - ngày nhận văn bản đến.
 * @param {string} toBookDate - ngày vào sổ.
 * @param {string} deadline - hạn được giao.
 * @returns {number} Số cột.
 */
const validateDates = (documentDate, receiveDate, toBookDate, deadline, rowNumber) => {
  try {
    const errors = [];
    const today = moment().format('YYYY/MM/DD');

    if (!moment(documentDate, 'YYYY/MM/DD', true).isValid()) {
      errors.push({ status: 400, message: `Ngày tài liệu không hợp lệ - dòng thứ ${rowNumber}` });
    }
    if (!moment(receiveDate, 'YYYY/MM/DD', true).isValid()) {
      errors.push({ status: 400, message: `Ngày nhận không hợp lệ - dòng thứ ${rowNumber}` });
    }
    if (!moment(toBookDate, 'YYYY/MM/DD', true).isValid()) {
      errors.push({ status: 400, message: `Ngày gửi vào sổ không hợp lệ - dòng thứ ${rowNumber}` });
    }

    if (deadline && !moment(deadline, 'YYYY/MM/DD', true).isValid()) {
      errors.push({ status: 400, message: `Hạn chót không hợp lệ - dòng thứ ${rowNumber}` });
    }

    if (moment(documentDate).isAfter(today)) {
      errors.push({
        status: 400,
        message: `Ngày tài liệu không được lớn hơn ngày hiện tại - dòng thứ ${rowNumber}`,
      });
    }

    if (moment(receiveDate).isBefore(documentDate)) {
      errors.push({
        status: 400,
        message: `Ngày nhận không được nhỏ hơn ngày tài liệu - dòng thứ ${rowNumber}`,
      });
    }

    if (moment(toBookDate).isBefore(documentDate)) {
      errors.push({
        status: 400,
        message: `Ngày gửi vào sổ không được nhỏ hơn ngày tài liệu - dòng thứ ${rowNumber}`,
      });
    }

    if (deadline && moment(deadline).isBefore(today)) {
      errors.push({
        status: 400,
        message: `deadline  không được nhỏ hơn ngày hiện tại - dòng thứ ${rowNumber}`,
      });
    }

    return errors;
  } catch (e) {
    console.log('ERROR11111: ', e);
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
  try {
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
            realName: `${file.name}`,
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
  } catch (e) {
    return e;
  }
};

/**
 * Tạo đối tượng document mới từ dữ liệu đã xử lý.
 * @param {Object} rowData - Dữ liệu từ một dòng của file Excel.
 * @param {Object} receiver - Đối tượng receiver lấy từ cơ sở dữ liệu.
 * @param {Array} resultFile - Mảng các file đã xử lý.
 * @returns {Object} Đối tượng document mới.
 */
const createDocument = (rowData, resultFile) => {
  try {
    const document = new incommingDocument({
      ...rowData,
      stage: 'receive',
      files: resultFile.length >= 1 ? resultFile.map((item) => ({ id: item._id, name: item.name })) : null,
    });
    return document;
  } catch (e) {
    return e;
  }
};

const convertData = (rowData) => {
  try {
    if (!rowData) {
      return;
    }
    const documentDate = moment(rowData.documentDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
    const receiveDate = moment(rowData.receiveDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
    const toBookDate = moment(rowData.toBookDate, 'DD/MM/YYYY').format('YYYY/MM/DD');
    let deadline;
    if (rowData.deadline) {
      deadline = moment(rowData.deadline, 'DD/MM/YYYY').format('YYYY/MM/DD');
    }
    return { documentDate, receiveDate, toBookDate, deadline };
  } catch (e) {
    return e;
  }
};

module.exports = {
  unzipFile,
  getPathOfChildFileZip,
  getDataFromAttachment,
  getDataFromExcelFile,
  processData,
  checkStorage,
};
