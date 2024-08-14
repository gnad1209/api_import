const axios = require('axios');

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


      const testData = [
        { rowIndex: 1, column0: 211, column1: 'Sổ VB đến', column2: 'thng:Thường, khn:Khẩn, thng-khn:Thượng khẩn, ha-tc:Hỏa tốc', column3: '10/07/2022', column4: '1', column5: 'file1.pdf', column6: 'TênFile1' },
        { rowIndex: 2, column0: 241, column1: 'Sổ VB đến 2', column2: 'Số văn bản', column3: '12/09/2021', column4: '2', column5: 'file2.pdf', column6: 'TênFile2' },
      ];
      return testData;
    } catch (error) {
      console.log('Lỗi lấy dữ liệu từ file excel');
      throw error;
    }
  }
}

module.exports = ExcelService;
