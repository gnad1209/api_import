const axios = require('axios');
const xlsx = require('xlsx');
class ExcelService {
  static async getDataFromExcelFile(file, check = false) {
    try {
      if (check) {
        const FileModel = mongoose.models.File;
        const fileCheck = await FileModel.findById(file._id);
        if (!fileCheck) {
          throw new Error('Không tìm thấy file');
        }
      }
      // Đọc file .xlsx
      const workbook = xlsx.readFile(file.path);

      // Lấy tên sheet đầu tiên
      const sheetName = workbook.SheetNames[0];

      // Lấy dữ liệu từ sheet và bỏ qua dòng đầu tiên
      const worksheet = workbook.Sheets[sheetName];

      // Chuyển đổi dữ liệu sheet sang JSON, bắt đầu từ dòng thứ 2
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

      // Xác định số lượng cột tối đa trong sheet
      const maxColumns = Math.max(...jsonData.map((row) => row.length));

      // Mảng để chứa dữ liệu đã chuyển đổi
      const Data = [];

      // Duyệt từng dòng, bắt đầu từ dòng thứ 2
      jsonData.forEach((row, rowIndex) => {
        const rowData = { rowIndex: rowIndex + 2 }; // +2 để khớp với dòng trong Excel

        // Duyệt qua số lượng cột tối đa và đảm bảo rằng mỗi cột có giá trị hoặc là ''
        for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
          rowData[`column${columnIndex}`] =
            row[columnIndex] !== undefined && row[columnIndex] !== null ? row[columnIndex] : '';
        }

        // Thêm dòng đã xử lý vào mảng Data
        Data.push(rowData);
      });

      return Data;
    } catch (error) {
      console.log('Lỗi lấy dữ liệu từ file excel');
      throw error;
    }
  }
}

module.exports = ExcelService;
