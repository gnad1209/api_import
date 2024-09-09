const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const mime = require('mime-types');

class UnzipService {
  /**
   * Giải nén file ZIP và lưu trữ các tệp đã giải nén vào một thư mục.
   * @param {string} zipFilePath - Đường dẫn đến file ZIP cần giải nén.
   * @param {string} defaultClientId - Mã client được sử dụng để đặt tên thư mục chứa file đã giải nén.
   */
  static async extractZip(zipFilePath, defaultClientId) {
    try {
      // console.log('Đường dẫn tới file chuẩn bị giải nén:', zipFilePath);

      // Tạo đối tượng zip từ đường dẫn file ZIP
      const zip = new AdmZip(zipFilePath);

      // Tạo đường dẫn thư mục để lưu file giải nén
      const time = new Date() * 1;
      const folderToSave = path.join(
        __dirname,
        '..',
        'importOutgoingDocument',
        'uploads',
        'unZip',
        `${defaultClientId}_${time}`,
      );

      // Kiểm tra và tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(folderToSave)) {
        fs.mkdirSync(folderToSave, { recursive: true });
      }

      // Giải nén toàn bộ nội dung file ZIP vào thư mục đích
      zip.extractAllTo(folderToSave, true);

      const extractedFiles = zip.getEntries().map((entry) => {
        const fullPath = path.join(folderToSave, entry.entryName);
        const mimeType = mime.lookup(entry.entryName) || '';

        // console.log('===');
        // console.log('=entry=', JSON.stringify(entry, null, 2));

        return {
          name: entry.entryName,
          filename: path.basename(entry.entryName),
          size: entry.header.size,
          date: entry.header.time,
          mimetype: mimeType,
          path: fullPath,
        };
      });

      if (extractedFiles.length > 0) {
        console.log('Giải nén thành công!');
        extractedFiles.forEach((file) => {
          console.log(`Đã giải nén: ${file.name}`);
        });
        return extractedFiles;
      } else {
        console.log('Không có file nào được giải nén!');
        return [];
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi giải nén:', error);
      return [];
    }
  }
  static async extractZipAndSaveToCorrectPath(zipFilePath, defaultClientId, excelData) {
    if (!excelData || excelData.length < 1) {
      return [];
    }

    try {
      const zip = new AdmZip(zipFilePath);
      const time = new Date() * 1;
      const extractedFiles = [];

      // Tạo các thư mục chính nếu chưa tồn tại
      const baseFolder = path.join(__dirname, '..', 'importOutgoingDocument', 'uploads', 'OutGoing');
      const folders = {
        VanBanBaoCao: path.join(baseFolder, 'VanBanBaoCao', `${defaultClientId}_${time}`),
        VanBanDuThao: path.join(baseFolder, 'VanBanDuThao', `${defaultClientId}_${time}`),
        VanBanDinhKem: path.join(baseFolder, 'VanBanDinhKem', `${defaultClientId}_${time}`),
      };

      Object.values(folders).forEach((folder) => {
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
      });

      // Lặp qua tất cả các entry trong file ZIP
      zip.getEntries().forEach((entry) => {
        const fileName = entry.entryName;

        // Tìm tất cả các phần tử trong excelData có tên file trùng khớp
        const matchingElements = excelData.filter(
          (element) => element.column13 === fileName || element.column14 === fileName || element.column15 === fileName,
        );

        matchingElements.forEach((matchingElement) => {
          if (matchingElement.column13 === fileName) {
            extractToFolder(folders.VanBanBaoCao, entry, fileName, 'VanBanBaoCao');
          }
          if (matchingElement.column14 === fileName) {
            extractToFolder(folders.VanBanDuThao, entry, fileName, 'VanBanDuThao');
          }
          if (matchingElement.column15 === fileName) {
            extractToFolder(folders.VanBanDinhKem, entry, fileName, 'VanBanDinhKem');
          }
        });
      });

      function extractToFolder(folderToSave, entry, fileName, folderType) {
        const fullPath = path.join(folderToSave, fileName);
        zip.extractEntryTo(entry, folderToSave, false, true);

        const mimeType = mime.lookup(fileName) || '';
        extractedFiles.push({
          name: fileName,
          filename: path.basename(fullPath),
          size: entry.header.size,
          date: entry.header.time,
          mimetype: mimeType,
          path: fullPath,
          folderType: folderType,
        });

        // console.log(`Đã giải nén: ${fileName} vào ${folderToSave}`);
      }

      if (extractedFiles.length > 0) {
        console.log('Giải nén và validate thành công!');
        return extractedFiles;
      } else {
        console.log('Không có file nào được giải nén!');
        return [];
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi giải nén:', error);
      return [];
    }
  }
}

module.exports = UnzipService;
