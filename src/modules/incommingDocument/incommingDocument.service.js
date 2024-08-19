const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const CLIENT_KHOLS = 'DHVB';
const File = require('./incommingDocument.model');
const Profile = require('../../models/profile.model');
const Document = require('../../models/document.model');
const fileManager = require('../../models/fileManager.model');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');

const {
  removeVietnameseTones,
  countPagePdf,
  existsPath,
  createSortIndex,
  deleteFolderAndContent,
  extractZipFile,
  readExcelDataAsArray,
} = require('../../config/common');
/**
 * Nhận thông tin file nén và file import, lưu file, giải nén
 * @param {Object} zipFile Thông tin file zip chứa file import và file zip đính kèm, từ model File
 * @returns Đường dẫn tới thư mục lưu file import, file zip và các file đã được giải nén
 */
const unzipFile = async (zipFile) => {
  try {
    const time = new Date() * 1;

    const compressedFileName = zipFile.filename;
    const folderToSave = path.join(__dirname, '..', '..', 'uploads', `${CLIENT_KHOLS}`, `import_${time}`);
    const folderToSaveaAtachment = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      `${CLIENT_KHOLS}`,
      `import_${time}`,
      `attachment`,
    );
    const firstUploadFolder = path.join(__dirname, '..', '..', 'files');

    const compressedFilePath = path.join(firstUploadFolder, compressedFileName);

    const [checkSaveFolder, checkZipFile] = await Promise.all([
      existsPath(folderToSave),
      existsPath(compressedFilePath),
    ]);

    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderToSave); // tạo đường dẫn thư mục nếu không tồn tại
    }
    if (!checkZipFile) {
      throw new Error('Không tồn tại file đã upload');
    }
    // Giải nén file input
    await extractZipFile(compressedFilePath, folderToSave, folderToSaveaAtachment);

    console.log('Thư mục lưu: ', folderToSave);
    return folderToSave;
  } catch (error) {
    console.log('Lỗi khi thực hiện hàm tạo folder');
    throw error;
  }
};

const getDataFromExcelFile = async () => {};

const processData = () => {};
module.exports = { unzipFile };
