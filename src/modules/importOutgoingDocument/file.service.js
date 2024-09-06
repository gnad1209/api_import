const File = require('./models/file.model');
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
    // Khởi tạo mảng các đối tượng file cần tạo
    const filesToCreate = [
      {
        name: zipFile.originalname,
        filename: zipFile.filename,
        path: zipFile.path,
        size: zipFile.size,
        mimetype: zipFile.mimetype,
        field: zipFile.fieldname,
        user: zipFile.user,
      },
    ];

    unzipData.forEach((file) => {
      filesToCreate.push({
        name: file.name || '',
        filename: file.filename || '',
        path: file.path || '',
        size: file.size || 0,
        mimetype: file.mimetype || '',
        field: '',
      });
    });
    attachmentData.forEach((file) => {
      filesToCreate.push({
        name: file.name || '',
        filename: file.filename || '',
        path: file.path || '',
        size: file.size || 0,
        mimetype: file.mimetype || '',
        field: '',
      });
    });

    // Tạo các file trong cơ sở dữ liệu
    try {
      const createdFiles = await File.create(filesToCreate);

      // Trả về mảng với từng phần tử tương ứng
      return [
        createdFiles[0], // File zip
        createdFiles.slice(1, 3), // File đầu tiên từ unzipData, trả về dưới dạng mảng
        createdFiles.slice(3), // Các file còn lại từ unzipData và tất cả từ attachmentData
      ];
    } catch (error) {
      console.log('Lỗi khi thực hiện tạo bản ghi file');
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
  static async createFolderAndSaveFiles(compressedFile, config = {}) {
    try {
      const time = new Date() * 1;
      const defaultClientId = config.clientId ? config.clientId : process.env.CLIENT_KHOLS;

      const compressedFileName = compressedFile.filename;
      const folderToSave = path.join(
        __dirname,
        '..',
        'importOutgoingDocument',
        'uploads',
        `${defaultClientId}`,
        `import_${time}`,
      );
      const firstUploadFolder = path.join(__dirname, '..', 'importOutgoingDocument', 'files');

      const compressedFilePath = path.join(firstUploadFolder, compressedFileName);
      const newCompressedFilePath = path.join(folderToSave, compressedFile.name);

      // Kiểm tra và tạo thư mục firstUploadFolder nếu chưa tồn tại
      await fsPromise.mkdir(firstUploadFolder, { recursive: true });

      // Kiểm tra và tạo thư mục folderToSave nếu chưa tồn tại
      await fsPromise.mkdir(folderToSave, { recursive: true });

      // Kiểm tra file có tồn tại hay không
      const fileExists = await fsPromise
        .access(compressedFilePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        throw new Error(`File không tồn tại: ${compressedFilePath}`);
      }

      // Sao chép file đến thư mục mới
      await fsPromise.copyFile(compressedFilePath, newCompressedFilePath);

      console.log('Thư mục lưu: ', folderToSave);
      return folderToSave;
    } catch (error) {
      console.log('Lỗi khi thực hiện hàm tạo folder:', error);
      throw error;
    }
  }
}

module.exports = FileService;
