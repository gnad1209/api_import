const Document = require('./models/outgoingDocument.model');
const Task = require('../models/task.model');
const Employee = require('../models/employee.model');
const OrganizationUnit = require('../models/organizationUnit.model');
const IncommingDocument = require('../importIncommingDocument/importIncommingDocument.model');
const { ObjectId } = require('mongodb');

class DataProcessingService {
  /**
   * Xử lý dữ liệu từ file Excel và lưu trữ các bản ghi vào cơ sở dữ liệu.
   *
   * @param {Array} data - Mảng dữ liệu từ file Excel đã được chuyển đổi sang định dạng JSON.
   * @param {string} folderPath - Đường dẫn thư mục chứa các file gốc.
   * @param {Object} config - Các cấu hình bổ sung như clientId.
   * @param {Array} uploadedUnzipToUnZipFile - Danh sách các file đã được giải nén và lưu trữ.
   * @returns {Promise<Array>} - Trả về mảng các bản ghi sách đã được lưu trữ.
   * @throws {Error} - Nếu có lỗi xảy ra trong quá trình xử lý dữ liệu.
   */
  static async dataProcessing(data, folderPath, config = {}, uploadedUnzipToUnZipFile) {
    try {
      // console.log('duong dan chua folder cac file goc ', folderPath);

      const result = [];
      // lấy biến config hoặc môi trường
      const defaultClientId = config.clientId ? config.clientId : process.env.CLIENT_KHOLS;

      // check tồn tại thư mục xử lý
      if (!Array.isArray(data)) {
        throw new Error('Sai dữ liệu đầu vào');
      }
      // bắt đầu xử lý

      // console.log('6.1 @@ bắt đầu xử lý', data);

      for (const row of data) {
        if (row.rowIndex === 0) continue;

        // refix - khi mà không ai để ý đến việc đặt tên file trên hệ thống; sửa tên file thành dạng thao tác được ☠☠
        // let plainName = removeVietnameseTones(row.column6.replace(/\s/g, ''));
        // const filenameToSet = plainName || ''; // tên file mong muốn đặt
        // const filenameToSet = row.column6 || ''; // tên file mong muốn đặt

        // let saveFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filenameToSet}`;
        // saveFilename = saveFilename.length > 255 ? saveFilename.substring(0, 255) : saveFilename;

        // path.join(folderPath, 'initFilename');
        // path.join(__dirname, '..', '..', '..', 'uploads', defaultClientId, saveFilename);
        // path.join(folderPath, '..', saveFilename);

        const fileMapping = {};

        // So sánh với các tên file đọc từ file excel văn bản với tên file đính kèm và liên kết id bản ghi của file đấy với bản ghi văn bản
        for (const element of uploadedUnzipToUnZipFile) {
          // Tách phần tên file ra khỏi phần mở rộng
          const fileNameWithoutExtension = element.name.split('.')[0];

          if (fileNameWithoutExtension == row.column13.split('.')[0]) {
            fileMapping.attachment_file1 = element._id;
          } else if (fileNameWithoutExtension == row.column14.split('.')[0]) {
            fileMapping.attachment_file2 = element._id;
          } else if (fileNameWithoutExtension == row.column15.split('.')[0]) {
            fileMapping.attachment_file3 = element._id;
          }
        }
        // console.log('fileMapping', fileMapping);
        const column6Data = row.column6.split(',');
        const column7Data = row.column7.split(',');
        const column12Data = row.column12.split(',');
        // const column13Data = row.column13.split(',');
        // console.log(column6Data);

        // const data = await Task.find().lean();
        // const data = await Employee.find().lean();
        // const data = await OrganizationUnit.find().lean();
        // const data = await IncommingDocument.find().lean();

        //tạo bản ghi văn bản mới từ file excel đọc được
        const outgoingDocumentToSave = new Document({
          senderUnit: row.column0 || '', // đơn vị soạn thảo
          drafter: row.column1 && ObjectId.isValid(row.column1) ? new ObjectId(row.column1) : '', // người soạn thảo || objId
          urgencyLevel: row.column2 || '', // độ khẩn
          privateLevel: row.column3 || '', // độ mật
          documentType: row.column4 || '', // loại văn bản
          documentField: row.column5 || '', // lĩnh vực
          viewers: column6Data.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)) || '', // nơi nhận nội bộ || ar objId
          signer: column7Data.length > 0 && ObjectId.isValid(column7Data[0]) ? new ObjectId(column7Data[0]) : null, //người ký
          recipientsOutSystem: row.column8 || '', // nơi nhận ngoài hệ thống
          receiverUnit: row.column9 && ObjectId.isValid(row.column9) ? new ObjectId(row.column9) : '', // đơn vị nhận || objId
          abstractNote: row.column10 || '', // trích yếu
          incommingDocument: row.column11 && ObjectId.isValid(row.column11) ? new ObjectId(row.column11) : '', //phúc đáp văn bản || objId
          tasks: column12Data.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)) || '', // Hồ sơ công việc || ar objId
          // files: row.column13 || '', // file đính kèm ( file manager )  || ar objId
        });

        // Lưu bản ghi văn bản
        await outgoingDocumentToSave.save();

        // Cập nhật các bản ghi filemanager với id của bản ghi văn bản
        // await Promise.all(
        //   uploadedUnzipToUnZipFile.map(async (file) => {
        //     // Tìm bản ghi sách tương ứng dựa trên tên file và cập nhật
        //     if (
        //       file._id.equals(fileMapping.attachment_file1) ||
        //       file._id.equals(fileMapping.attachment_file2) ||
        //       file._id.equals(fileMapping.attachment_file3)
        //     ) {
        //       await FileModel.findByIdAndUpdate(file._id, { book: outgoingDocumentToSave._id });
        //     }
        //   }),
        // );

        // console.log('Duong dan tai lieu da luu: ', fileToSave.fullPath);
        // console.log('document == document ', document);
        // console.log('outgoingDocumentToSave == outgoingDocumentToSave ', outgoingDocumentToSave);
        // console.log('uploadedUnzipToUnZipFile == uploadedUnzipToUnZipFile ', uploadedUnzipToUnZipFile);

        result.push(outgoingDocumentToSave);
      }

      return result;
    } catch (error) {
      console.log('Lỗi khi xử lý dữ liệu');
      throw error.message;
    }
  }
}

function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return str;
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  return str.toLowerCase();
}

module.exports = DataProcessingService;
