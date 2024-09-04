const xlsx = require('xlsx');
class ExcelService {
  /**
   * Lấy dữ liệu từ tập tin Excel (.xlsx) và chuyển đổi sang định dạng JSON.
   *
   * @param {Object} file - Đối tượng tập tin chứa thông tin về file Excel.
   * @returns {Promise<Object[]>} - Trả về mảng các đối tượng JSON tương ứng với các dòng trong tập tin Excel.
   * @throws {Error} - Ném lỗi nếu không tìm thấy file trong cơ sở dữ liệu hoặc lỗi khi đọc file Excel.
   */
  static async getDataFromExcelFile(file) {
    try {
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
