const axios = require('axios');
const xlsx = require('xlsx');
class ExcelService {
  static async getDataFromExcelFile(file, check = false) {
    try {
      const fileUrl = `https://administrator.lifetek.vn:233/api/files/66bc544d181ca41279b2adf9`; // dùng tạm
      // const fileUrl = 'https://administrator.lifetek.vn:253/api/files/65e142cbd459504c5edb6974'; // dùng tạm
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
      // Mảng để chứa dữ liệu đã chuyển đổi
      const Data = [];
      // Duyệt từng dòng, bắt đầu từ dòng thứ 2
      jsonData.forEach((row, rowIndex) => {
        // Kiểm tra nếu dòng có bất kỳ cột nào có dữ liệu
        const hasData = row.some((column) => column !== undefined && column !== null && column !== '');

        if (hasData) {
          const rowData = { rowIndex: rowIndex + 2 }; // +2 để khớp với dòng trong Excel

          // Duyệt từng cột trong dòng
          row.forEach((value, columnIndex) => {
            if (value !== undefined && value !== null && value !== '') {
              rowData[`column${columnIndex}`] = value;
            }
          });

          // Thêm dòng đã xử lý vào mảng Data
          Data.push(rowData);
        }
      });
      console.log('======dataa', Data);

      // const fileUrl = process.env.BASE_URL + file._id;
      // const readFileExcelUrl = process.env.READ_EXCEL_URL;
      // const request = await axios.post(readFileExcelUrl, null, {
      //   params: {
      //     pageIndex: 0,
      //     typeData: 'raw',
      //     docUrl: fileUrl,
      //   },
      // });

      // if (request && request.data && Array.isArray(request.data)) {
      //   return request.data;
      // }

      return Data;
    } catch (error) {
      console.log('Lỗi lấy dữ liệu từ file excel');
      throw error;
    }
  }
}

module.exports = ExcelService;
