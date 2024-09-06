const service = require('./importIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent } = require('../config/common');

const importDataInZipFile = async (req, res, next) => {
  try {
    // khởi tạo biến lưu file zip,path file zip, clientId, folder lưu file sau khi giải nén
    const { file: zipFile } = req;
    const { clientId, userName } = req.query;
    // kiểm tra file được tải lên chưa
    if (!zipFile) return res.status(400).json({ status: 0, message: 'Tải file lên thất bại' });

    const time = Date.now();
    const baseDir = path.join(__dirname, '..', '..');
    const firstUploadFolder = path.join(baseDir, 'files');
    const compressedFilePath = path.join(firstUploadFolder, zipFile.filename);
    const folderToSave = path.join(baseDir, 'uploads', clientId, `import_${time}`);
    const folderToSaveAttachment = path.join(folderToSave, 'attachments');

    //giải nén file zip đầu vào
    if (!(await service.unzipFile(folderToSave, compressedFilePath))) {
      return res.status(400).json({ status: 0, message: 'Giải nén không thành công' });
    }

    // lấy path của file excel và path của file zip đính kèm còn lại
    const objPath = await service.getPathOfChildFileZip(folderToSave);
    if (!objPath) return res.status(400).json({ status: 0, message: 'Không tìm được file sau khi giải nén' });

    // Kiểm tra dung lượng còn lại của client
    // if (clientId) {
    //   const checkStorage = await service.checkStorage(objPath, clientId, folderToSave);
    //   if (!checkStorage) {
    //     return res.status(400).json({ status: 0, message: 'Dung lượng ko đủ để tải file' });
    //   }
    // }

    //giải nén file đính kèm
    let extractFileAttachment = null;
    if (objPath.zipFile) {
      extractFileAttachment = await service.unzipFile(folderToSaveAttachment, objPath.zipFile);
    }

    let dataFromAttachment = [];
    if (extractFileAttachment) {
      // lấy thông tin các file con trong file zip đính kèm(zipAttachmentFile) từ path vừa tìm đc
      dataFromAttachment = await service.getDataFromAttachment(folderToSaveAttachment);
      if (!dataFromAttachment) {
        return res.status(400).json({ status: 0, message: 'Lấy dữ liệu tệp đính kèm thất bại' });
      }
    }

    // lấy dữ liệu file excel
    const dataExcel = await service.getDataFromExcelFile(objPath.excelFile);
    if (!dataExcel) {
      return res.status(400).json({ status: 0, message: 'Lấy dữ liệu từ file excel thất bại' });
    }
    // dữ liệu mẫu
    const code = 'IncommingDocument';
    //xử lý dữ liệu lưu các bản ghi vào db
    const data = await service.processData(dataExcel, dataFromAttachment, folderToSave, clientId, userName, code);

    if (data.status === 400) {
      await deleteFolderAndContent(folderToSave);
      return res.status(400).json(data);
    }
    const document = service.selectFieldsDocument(data.saveDocument);
    return res.status(200).json({ checkWarning: data.errors, data: document });
  } catch (e) {
    console.log('ERROR: ', e);
    return res.status(400).json(e);
  }
};

module.exports = { importDataInZipFile };
