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

  static async uploadFiles(zipFile, unzipData, attachmentData) {
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
    const createdFiles = await File.create(filesToCreate);

    // Trả về mảng với từng phần tử tương ứng
    return [
      createdFiles[0], // File zip
      createdFiles.slice(1, 3), // File đầu tiên từ unzipData, trả về dưới dạng mảng
      createdFiles.slice(3), // Các file còn lại từ unzipData và tất cả từ attachmentData
    ];
  }

  static async createFolderAndSaveFilesV2(compressedFile, config = {}) {
    try {
      const time = new Date() * 1;
      const defaultClientId = config.clientId ? config.clientId : process.env.CLIENT_KHOLS;

      // const importFileName = importFile.filename;
      const compressedFileName = compressedFile.filename;
      // Đường dẫn tới thư mục lưu trữ
      const folderToSave = path.join(__dirname, '..', 'uploads', `${defaultClientId}`, `import_${time}`);
      const firstUploadFolder = path.join(__dirname, '..', 'files');

      // const importFilePath = path.join(firstUploadFolder, importFileName);
      // const newImportFilePath = path.join(folderToSave, importFile.name);

      const compressedFilePath = path.join(firstUploadFolder, compressedFileName);
      const newCompressedFilePath = path.join(folderToSave, compressedFile.name);

      // const checkSaveFolder = await existsPath(folderToSave);
      // const checkImportFile = await existsPath(importFilePath);
      // const checkZipFile = await existsPath(compressedFilePath);

      // if (!checkSaveFolder) {
      //   await fsPromise.mkdir(folderToSave); // tạo đường dẫn thư mục nếu không tồn tại
      // }
      // if (!checkImportFile || !checkZipFile) {
      //   throw new Error('Không tồn tại file đã upload');
      // }

      await fsPromise.mkdir(folderToSave, { recursive: true });
      // Kiểm tra xem file nguồn có tồn tại không
      // if (
      //   !(await fsPromise
      //     .access(importFilePath)
      //     .then(() => true)
      //     .catch(() => false))
      // ) {
      //   throw new Error(`File không tồn tại: ${importFilePath}`);
      // }
      if (
        !(await fsPromise
          .access(compressedFilePath)
          .then(() => true)
          .catch(() => false))
      ) {
        throw new Error(`File không tồn tại: ${compressedFilePath}`);
      }

      // await fsPromise.copyFile(importFilePath, newImportFilePath);
      await fsPromise.copyFile(compressedFilePath, newCompressedFilePath);

      // const os = process.platform;
      // if (os == 'win32') {
      //   await unzipFileWindow(compressedFilePath, folderToSave);
      // } else {
      // await unzipFile(compressedFilePath, folderToSave);
      // }
      // await unzipFile(compressedFilePath, folderToSave); // tạm thời comment
      console.log('Thư mục lưu: ', folderToSave);
      return folderToSave;
    } catch (error) {
      console.log('Lỗi khi thực hiện hàm tạo folder');
      throw error;
    }
  }
}

module.exports = FileService;
