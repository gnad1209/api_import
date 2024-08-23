const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const mime = require('mime-types');

class UnzipService {
  static async extractZip(zipFilePath, defaultClientId) {
    try {
      // console.log('Đường dẫn tới file chuẩn bị giải nén:', zipFilePath);

      // Tạo đối tượng zip từ đường dẫn file ZIP
      const zip = new AdmZip(zipFilePath);

      // Tạo đường dẫn thư mục để lưu file giải nén
      const time = new Date() * 1;
      const folderToSave = path.join(__dirname, '..', 'uploads', 'unZip', `${defaultClientId}_${time}`);

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
          name: entry.entryName, // Tên file
          filename: path.basename(entry.entryName),
          size: entry.header.size, // Kích thước file
          date: entry.header.time, // Ngày sửa đổi file
          mimetype: mimeType,
          path: fullPath, // Đường dẫn đầy đủ đến file đã giải nén
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
}

module.exports = UnzipService;
