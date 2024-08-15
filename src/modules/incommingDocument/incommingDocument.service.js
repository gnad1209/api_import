const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const CLIENT_KHOLS = 'DHVB';
const File = require('./incommingDocument.model');
const Document = require('../../models/document.model');
const Receiver = require('../../models/receiver.model');
const {
  removeVietnameseTones,
  countPagePdf,
  existsPath,
  createSortIndex,
  deleteFolderAndContent,
  decompressFile,
  readExcelDataAsArray,
} = require('./common');
// const { createWriteStream, createReadStream } = require('fs');
// const { createUnzip } = require('zlib');
/**
 * Nhận thông tin file nén và file import, lưu file, giải nén
 * @param {Object} importFile Thông tin file import, từ model File
 * @param {Object} compressedFile Thông tin file nén,== từ model File
 * @param {Object} config Sau này dùng
 * @returns Đường dẫn tới thư mục lưu file import, file zip và các file đã được giải nén
 */
const createFolderAndSaveFilesV2 = async (importFile, config = {}) => {
  try {
    const time = new Date() * 1;

    const importFileName = importFile.filename;
    const folderToSave = path.join(__dirname, '..', '..', 'uploads', `${CLIENT_KHOLS}`, `import_${time}`);
    const firstUploadFolder = path.join(__dirname, '..', '..', 'files');

    const importFilePath = path.join(firstUploadFolder, importFileName);
    const newImportFilePath = path.join(folderToSave, importFileName);

    const [checkSaveFolder, checkImportFile] = await Promise.all([
      existsPath(folderToSave),
      existsPath(importFilePath),
    ]);

    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderToSave); // tạo đường dẫn thư mục nếu không tồn tại
    }
    if (!checkImportFile) {
      throw new Error('Không tồn tại file đã upload');
    }

    await Promise.all([fsPromises.copyFile(importFilePath, newImportFilePath)]);

    console.log('Thư mục lưu: ', folderToSave);
    return folderToSave;
  } catch (error) {
    console.log('Lỗi khi thực hiện hàm tạo folder');
    throw error;
  }
};

/**
 * Nếu không có sẵn fileUrl, tải file theo đường dẫn đầu vào. Lấy đường dẫn đó gọi đến JAVdocument. CHỈ SỬ DỤNG VỚI FILE IMPORT HOẶC CÁC FILE UPLOAD VỚI MODEL FILE
 * @param {Path} file
 * @param {URL} [fileUrl]
 * @returns Dữ liệu từ file data
 */
const getDataFromExcelFile = async (filePath, check = false) => {
  try {
    if (check) {
      const fileCheck = await File.findById({ path: filePath });
      if (!fileCheck) {
        throw new Error('Không tìm thấy file');
      }
    }

    // Đọc file từ đường dẫn và chuyển đổi nó thành Buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Đọc dữ liệu từ file Excel
    const dataArray = readExcelDataAsArray(fileBuffer);

    if (!dataArray) {
      return [];
    }
    return dataArray;
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error.message);
    return null;
  }
};

/**
 * Xử lý dữ liệu
 * @param {Array} data Mảng dữ liệu đọc từ excel
 * @param {*} folderPath đường dẫn tới folder chứa các file văn bản và file import
 * @param {*} config Cấu hình tùy chọn
 * @returns dữ liệu đã xử lý
 */
const dataProcessing = async (data, folderPath, config = {}) => {
  try {
    const result = [];
    // lấy biến config hoặc môi trường
    const defaultPlan = config.plan ? config.plan : process.env.KHOLS_UPLOAD_PLAN;
    const defaultUploadAccount = config.account ? config.account : process.env.KHOLS_UPLOAD_ACCOUNT;
    const defaultCreator = config.creator ? config.creator : process.env.KHOLS_UPLOAD_ACCOUNT_ID;
    const defaultUploadOrg = config.organizationUnit ? config.organizationUnit : process.env.KHOLS_UPLOAD_ACCOUNT_ORG;
    const defaultClientId = config.clientId ? config.clientId : process.env.CLIENT_KHOLS;

    // check tồn tại thư mục xử lý
    if (!Array.isArray(data)) {
      throw new Error('Sai dữ liệu đầu vào');
    }
    const checkFolder = await existsPath(folderPath);
    if (!checkFolder) {
      throw new Error('Thư mục xử lý không tồn tại');
    }

    // bắt đầu xử lý
    const files = fs.readdirSync(folderPath);
    const fileList = files.filter((file) => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });

    for (row of data) {
      if (row.rowIndex === 0) continue;

      // const toBook = row[0] || 0;
      const toBook = `abc${row.rowIndex}`;
      const toBook_en = removeVietnameseTones(toBook);
      const abstractNote = row[1] || 'a';
      const abstractNote_en = removeVietnameseTones(abstractNote);
      const số_văn_bản_Đến = row[2] || ''; //////////////////
      const urgencyLevel = row[3] || '';
      const urgencyLevel_en = removeVietnameseTones(urgencyLevel);
      const số_đến = row[4] || '';
      const số_đến_en = removeVietnameseTones(số_đến);
      const senderUnit = row[5] || 'v';
      const senderUnit_en = removeVietnameseTones(senderUnit);
      const sổ_vb = row[7] || '';
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
      const nd_xử_lý = row[15] || '';
      const vai_trò = row[16] || '';
      const vai_trò_tiếp_theo = row[17] || '';
      const phân_loại_đơn = row[18] || '';
      const người_đc_ủy_quyền_xử_lý = row[19] || '';
      const sổ_vb_đvi_gửi = row[20] || '';

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
      let receiver = await Receiver.findOne({ name: receiverUnit });
      if (!receiver) {
        receiver = new Receiver({ name: receiverUnit });
      }
      let document = await Document.findOne({ toBook });
      // if (document) {
      //   throw new Error('đã tồn tại số văn bản');
      // }
      document = new Document({
        toBook,
        toBook_en,
        abstractNote,
        abstractNote_en,
        số_văn_bản_Đến,
        urgencyLevel,
        urgencyLevel_en,
        số_đến,
        số_đến_en,
        senderUnit,
        senderUnit_en,
        sổ_vb,
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
        nd_xử_lý,
        vai_trò,
        vai_trò_tiếp_theo,
        phân_loại_đơn,
        người_đc_ủy_quyền_xử_lý,
        sổ_vb_đvi_gửi,
      });
      console.log(document);
      // let filenameToCopyPath = '';
      // fileList.map((file) => {
      //   filenameToCopyPath = path.join(folderPath, file);
      // });
      // const saveModelFilePath = path.join(__dirname, '..', '..', 'uploads', defaultClientId, saveFilename);

      // await fsPromises.copyFile(filenameToCopyPath, saveModelFilePath);
      // console.log('Duong dan tai lieu da luu: ', fileToSave.fullPath);

      saveResult = await Promise.all([await document.save(), receiver.save()]);
      result.push(saveResult);
      // xóa folder tiết kiệm bộ nhớ sau khi sử dụng. File zip và file excel còn tồn tại bên file, file sử udnjg đã có trong upload và sử dụng được
    }
    await deleteFolderAndContent(folderPath);
    console.log('Xóa đường dẫn: ', folderPath);
    return result;
  } catch (error) {
    console.log('Lỗi khi xử lý dữ liệu');
    throw error;
  }
};

module.exports = { createFolderAndSaveFilesV2, getDataFromExcelFile, dataProcessing };
