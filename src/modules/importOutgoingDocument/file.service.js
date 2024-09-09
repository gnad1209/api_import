const FileManager = require('../models/fileManager.model');
const fs = require('fs');
const path = require('path');
const fsPromise = require('fs').promises;

class FileService {
  static getProcessDataConfig(query) {
    const { clientId } = query;
    const config = {};
    if (clientId) config.clientId = clientId;
    return config;
  }

  /**
   * Xử lý và lưu trữ các tệp tin (bao gồm tệp ZIP, dữ liệu đã giải nén và dữ liệu đính kèm) vào cơ sở dữ liệu.
   *
   * @param {Object} zipFile - Đối tượng tệp tin ZIP gốc mà người dùng tải lên.
   * @param {Array<Object>} unzipData - Mảng chứa thông tin các tệp tin đã được giải nén từ tệp ZIP.
   * @param {Array<Object>} attachmentData - Mảng chứa thông tin các tệp tin đính kèm bổ sung.
   */
  static async processAndSaveFiles(zipFile, unzipData, attachmentData) {
    const createFileObject = (file, isZip = false) => ({
      name: file.filename || '',
      fullPath: file.path || '',
      mimetype: file.mimetype || '',

      // file cứng
      smartForm: '',
      isFileSync: false,
      folderChild: false,
      isStarred: false,
      isEncryption: false,
      shares: [],
      isConvert: false,
      internalTextIds: [],
      canDelete: true,
      canEdit: true,
      status: 1,
      isApprove: false,
      public: 0,
      permissions: [],
      users: [],
      hasChild: false,
    });

    const filesToCreate = [
      createFileObject(zipFile, true),
      ...unzipData.map(createFileObject),
      ...attachmentData.map(createFileObject),
    ];

    try {
      const createdFiles = await FileManager.create(filesToCreate);
      return [createdFiles[0], createdFiles.slice(1, 3), createdFiles.slice(3)];
    } catch (error) {
      console.error('Lỗi khi thực hiện tạo bản ghi file:', error);
      throw error;
    }
  }

  /**
   * Tạo thư mục và lưu trữ tập tin nén.
   *
   * @param {Object} compressedFile - Tập tin nén cần lưu.
   * @param {Object} [config={}] - Cấu hình tùy chọn, chứa thuộc tính `clientId`.
   * @returns {Promise<string>} - Trả về đường dẫn thư mục nơi lưu trữ tập tin nén.
   * @throws {Error} - Ném lỗi nếu tập tin không tồn tại hoặc xảy ra lỗi khi tạo thư mục.
   */
  static async createFolderAndSaveFiles(compressedFile) {
    // console.log('compressedFile', compressedFile);

    try {
      const time = new Date() * 1;

      const compressedFileName = compressedFile.name;
      // const folderToSave = path.join(__dirname, '..', 'importOutgoingDocument', 'uploads', `OutGoing`, `import_zip`);
      const firstUploadFolder = path.join(__dirname, '..', 'importOutgoingDocument', 'uploads', 'files');

      const compressedFilePath = path.join(firstUploadFolder, compressedFileName);
      // const newCompressedFilePath = path.join(folderToSave, compressedFile.name);

      // Kiểm tra và tạo thư mục firstUploadFolder nếu chưa tồn tại
      await fsPromise.mkdir(firstUploadFolder, { recursive: true });

      // Kiểm tra và tạo thư mục folderToSave nếu chưa tồn tại
      // await fsPromise.mkdir(folderToSave, { recursive: true });

      // Kiểm tra file có tồn tại hay không
      const fileExists = await fsPromise
        .access(compressedFilePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        throw new Error(`FileManager không tồn tại: ${compressedFilePath}`);
      }

      // Sao chép file đến thư mục mới
      // await fsPromise.copyFile(compressedFilePath, newCompressedFilePath);

      // console.log('Thư mục lưu: ', folderToSave);
      return firstUploadFolder;
    } catch (error) {
      console.log('Lỗi khi thực hiện hàm tạo folder:', error);
      throw error;
    }
  }
}

module.exports = FileService;
