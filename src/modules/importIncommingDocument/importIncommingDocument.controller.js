const service = require('./importIncommingDocument.service');
const path = require('path');
const { deleteFolderAndContent, existsPath } = require('../config/common');
const fsPromises = require('fs').promises;

const importDataInZipFile = async (req, res, next) => {
  try {
    // khởi tạo biến lưu file zip,path file zip, clientId, folder lưu file sau khi giải nén
    const { file: zipFile } = req;
    const { clientId, username } = req.query;
    // kiểm tra file được tải lên chưa
    if (!zipFile) return res.status(400).json({ status: 0, message: 'Tải file lên thất bại' });

    const time = Date.now();
    const baseDir = path.join(__dirname, '..', '..');
    const firstUploadFolder = path.join(baseDir, 'files');
    const compressedFilePath = path.join(firstUploadFolder, zipFile.filename);
    const folderToSave = path.join(baseDir, 'uploads', clientId, `import_${time}`);
    const folderToSaveAttachment = path.join(folderToSave, 'attachments');
    const [checkUploadFolder, checkClientFolder] = await Promise.all([
      existsPath(path.join(baseDir, 'uploads')),
      existsPath(path.join(baseDir, 'uploads', clientId)),
    ]);

    if (!checkUploadFolder) {
      await fsPromises.mkdir(path.join(baseDir, 'uploads'));
    }
    if (!checkClientFolder) {
      await fsPromises.mkdir(path.join(baseDir, 'uploads', clientId));
    }

    //giải nén file zip đầu vào
    if (!(await service.unzipFile(folderToSave, compressedFilePath))) {
      return res.status(400).json({ status: 0, message: 'Giải nén không thành công' });
    }

    // lấy path của file excel và path của file zip đính kèm còn lại
    const objPath = await service.getPathOfChildFileZip(folderToSave);
    if (!objPath) return res.status(400).json({ status: 0, message: 'Không tìm được file sau khi giải nén' });

    // Kiểm tra dung lượng còn lại của client
    if (clientId) {
      const checkStorage = await service.checkStorage(objPath, clientId, folderToSave);
      if (!checkStorage) {
        return res.status(400).json({ status: 0, message: 'Dung lượng ko đủ để tải file' });
      }
    }

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
    const code = 'importIncommingDocument';
    //xử lý dữ liệu lưu các bản ghi vào db
    const data = await service.processData(dataExcel, dataFromAttachment, folderToSave, clientId, username, code);

    if (data.status === 400) {
      await deleteFolderAndContent(folderToSave);
      return res.status(400).json(data);
    }

    return res.status(200).json({ status: 1, errors: data.errors, documents: data.documents });
  } catch (e) {
    console.log('ERROR: ', e);
    return res.status(400).json(e);
  }
};

module.exports = { importDataInZipFile };
