const xlsx = require('xlsx');
class ExcelService {
  /**
   * Lấy dữ liệu từ tập tin Excel (.xlsx) và chuyển đổi sang định dạng JSON.
   *
   * @param {Object} file - Đối tượng tập tin chứa thông tin về file Excel.
   * @returns {Promise<Object[]>} - Trả về mảng các đối tượng JSON tương ứng với các dòng trong tập tin Excel.
   * @throws {Error} - Ném lỗi nếu không tìm thấy file trong cơ sở dữ liệu hoặc lỗi khi đọc file Excel.
   */
  static async getDataFromExcelFileAndValidate(file, uploadedUnzipToUnZipFile) {
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

      // Mảng để chứa dữ liệu đã chuyển đổi và dữ liệu lỗi
      const Data = [];
      const Errors = [];

      // Duyệt từng dòng, bắt đầu từ dòng thứ 2
      jsonData.forEach((row, rowIndex) => {
        // Kiểm tra nếu tất cả các cột trong dòng đều trống thì bỏ qua dòng này
        const isEmptyRow = row.every((cell) => cell === undefined || cell === null || cell === '');

        if (!isEmptyRow) {
          const rowData = { rowIndex: rowIndex + 1 }; // +1 để khớp với dòng trong Excel
          const rowErrors = [];

          // Duyệt qua số lượng cột tối đa và đảm bảo rằng mỗi cột có giá trị hoặc là ''
          for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
            const cellValue = row[columnIndex] !== undefined && row[columnIndex] !== null ? row[columnIndex] : '';
            rowData[`column${columnIndex}`] = cellValue;

            // Validate dữ liệu
            if (columnIndex === 0 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} đơn vị soạn thảo không được để trống`);
            }
            if (columnIndex === 1 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} người soạn thảo không được để trống`);
            }
            if (columnIndex === 2 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} độ khẩn không hợp lệ`);
            }
            if (columnIndex === 3 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} độ mật không hợp lệ`);
            }
            if (columnIndex === 4 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} loại văn bản không hợp lệ`);
            }
            if (columnIndex === 5 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} lĩnh vực không hợp lệ`);
            }
            if (columnIndex === 6 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} nơi nhận nội bộ không đúng`);
            }
            if (columnIndex === 7 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} người ký không đúng`);
            }
            if (columnIndex === 9 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} đơn vị nhận không đúng`);
            }
            if (columnIndex === 11 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} phúc đáp văn bản không đúng`);
            }
            if (columnIndex === 12 && cellValue.trim() === '') {
              rowErrors.push(`Cột ${columnIndex + 1}, dòng ${rowIndex + 2} hồ sơ công việc không đúng`);
            }
            if (columnIndex === 13 && isExcelFileInUnzippedFiles(columnIndex, cellValue, uploadedUnzipToUnZipFile)) {
              rowErrors.push(
                `Cột ${columnIndex + 1}, dòng ${rowIndex + 2} văn bản báo cáo không có trong tệp đính kèm`,
              );
            }
            if (columnIndex === 14 && isExcelFileInUnzippedFiles(columnIndex, cellValue, uploadedUnzipToUnZipFile)) {
              rowErrors.push(
                `Cột ${columnIndex + 1}, dòng ${rowIndex + 2} văn bản dự thảo không được để trống hoặc không có trong tệp đính kèm`,
              );
            }
            if (columnIndex === 15 && isExcelFileInUnzippedFiles(columnIndex, cellValue, uploadedUnzipToUnZipFile)) {
              rowErrors.push(
                `Cột ${columnIndex + 1}, dòng ${rowIndex + 2} văn bản đính kèm không có trong tệp đính kèm`,
              );
            }
          }

          if (rowErrors.length > 0) {
            Errors.push({ rowIndex: rowIndex + 1, errors: rowErrors });
          } else {
            Data.push(rowData);
          }
        }
      });

      if (Errors.length > 0) {
        return { status: 0, data: Errors };
      }
      return { status: 1, data: Data };
    } catch (error) {
      console.log('Lỗi lấy dữ liệu từ file excel:', error);
      throw error;
    }

    function isExcelFileInUnzippedFiles(columnIndex, excelNameFile, unZipNameFile) {
      // Nếu cột là 14 và excelNameFile trống, trả về false
      if (columnIndex === 14 && excelNameFile.trim() === '') {
        return true;
      }

      // Nếu tên file khớp với một file đã giải nén hoặc tên file trống, trả về false
      for (const element of unZipNameFile) {
        if (excelNameFile === element.name || excelNameFile.trim() === '') {
          return false;
        }
      }

      // Nếu không thuộc các điều kiện trên, trả về true
      return true;
    }
  }
}

module.exports = ExcelService;
