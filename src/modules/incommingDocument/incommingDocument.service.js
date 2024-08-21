const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const fsExtra = require('fs-extra');
const Document = require('../../models/document.model');
const Receiver = require('../../models/receiver.model');
const fileManager = require('../../models/fileManager.model');
const Client = require('../../models/client.model');
const XLSX = require('xlsx');
const unzipper = require('unzipper');
const mime = require('mime-types');

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
    await deleteFolderAndContent(filePath);
    return true;
  } catch (error) {
    return error;
  }
};

/**
 * lấy thông tin về của 2 file sau khi giải nén
 * @param {String} foderPath path của folder muốn kiểm tra và lấy dữ liệu
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
      throw new Error('Cấu trúc folder sau khi giải nén không đúng định dạng');
    }

    return check;
  } catch (e) {}
};

/**
 * Kiểm tra dung lượng còn lại có thể sử dụng ở client
 * @param {String} clientId id của client để kiểm tra dung lượng
 * @returns trả về đối tượng gồm path của file excel và path của file zip đính kèm
 */
const checkStorage = async (objPath, clientId) => {
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
            await Promise.all([deleteFolderAndContent(objPath.zipFile), deleteFolderAndContent(objPath.excelFile)]);
            throw new Error('Dung lượng còn lại ko đủ');
          } else {
            client.usedStorage += totalSize;
          }
        }
        await client.save();
      }
    }

    return true;
  } catch (e) {}
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
  } catch (e) {}
};

/**
 * lấy dữ liệu từ file excel
 * @param {Path} filePath đường dẫn tới file excel vừa được giải nén
 * @returns trả về dữ liệu của file excel dưới dạng mảng
 */
const getDataFromExcelFile = async (filePath, check = false) => {
  try {
    //kiểm tra sự tồn tại path của file excel
    const checkPathExcelFile = await existsPath(filePath);
    if (!checkPathExcelFile) {
      throw new Error('Không tìm thấy file cần lấy thông tin');
    }
    //đọc dữ liệu của file excel
    const fileBuffer = fs.readFileSync(filePath);

    // Đọc dữ liệu từ file Excel
    const dataArray = readExcelDataAsArray(fileBuffer);

    if (!dataArray) {
      return [];
    }
    //trả về dữ liệu của file excel dưới dạng mảng
    return dataArray;
  } catch (error) {}
};

/**
 * Xử lý dữ liệu tạo các bản ghi mới trong bảng document và file
 * @param {Array} dataExcel Mảng dữ liệu đọc từ excel
 * @param {Array} dataAttachments Mảng dữ liệu đọc từ file zip đính kèm
 * @param {*} config Cấu hình tùy chọn
 * @returns trả về những bản ghi mới từ file excel
 */
const processData = async (dataExcel, dataAttachments, config = {}) => {
  try {
    let result = [];
    if (!Array.isArray(dataExcel)) {
      throw new Error('dataExcel ko phải là 1 mảng');
    }
    if (!Array.isArray(dataAttachments)) {
      throw new Error('dataAttachments phải là 1 mảng');
    }
    //lặp lấy dữ liệu của file excel
    let resultFile;
    for (row of dataExcel) {
      if (row.rowIndex === 0) continue;
      resultFile = [];
      // const toBook = row[0] || 0;
      const toBook = `abc${row.rowIndex}`;
      const toBook_en = removeVietnameseTones(toBook);
      const abstractNote = row[1] || 'a';
      const abstractNote_en = removeVietnameseTones(abstractNote);
      const bookDocumentIdName = row[2] || ''; //////////////////
      const urgencyLevel = row[3] || '';
      const urgencyLevel_en = removeVietnameseTones(urgencyLevel);
      const toBookCode = row[4] || '';
      const toBookCode_en = removeVietnameseTones(toBookCode);
      const senderUnit = row[5] || 'v';
      const senderUnit_en = removeVietnameseTones(senderUnit);
      // const files = row[6] || '';
      const files = 'beeimgtmp-20230524-094039.png, beeimgtmp-20230524-094213.png';
      const bookDocumentId = row[7] || '';
      const secondBook = row[8] || '';
      const receiverUnit = row[9] || 'b';
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
      //chuyển đổi chuỗi files sang dạng mảng
      const arrFiles = files
        .trim()
        .split(',')
        .map((item) => item.trim());
      // kiểm tra các trường bắt buộc có null ko
      if (!toBook) {
        throw new Error('thiếu số văn bản');
      }
      if (!abstractNote) {
        throw new Error('thiếu trích yếu');
      }
      if (!senderUnit) {
        throw new Error('thiếu đơn vị gửi');
      }
      if (!receiverUnit) {
        throw new Error('thiếu đơn vị nhận');
      }
      // kiểm tra trường files có tồn tại và phần tử nào thuộc file đính kèm ko
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

      let receiver = await Receiver.findOne({ name: receiverUnit });

      if (!receiver) {
        receiver = new Receiver({ name: receiverUnit });
      }

      let document = await Document.findOne({ toBook });
      // kiểm tra bản ghi đã tồn tại các trường duy nhất chưa
      if (!document) {
        document = new Document({
          toBook,
          toBook_en,
          abstractNote,
          abstractNote_en,
          bookDocumentIdName,
          urgencyLevel,
          urgencyLevel_en,
          toBookCode,
          toBookCode_en,
          senderUnit,
          senderUnit_en,
          files: resultFile,
          bookDocumentId,
          secondBook,
          receiverUnit: receiver._id,
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
        });
      }
      // lưu dữ liệu từ file excel thành bản ghi mới
      let [saveDocument] = await Promise.all([await document.save(), receiver.save()]);
      result.push(saveDocument);
    }
    // trả về những bản ghi mới từ file excel
    return { result, resultFile };
  } catch (error) {
    return error;
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
