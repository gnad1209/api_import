const service = require('./incommingDocument.service');
const path = require('path');

const importDataInZipFile = async (req, res, next) => {
  try {
    // khởi tạo biến lưu file zip,path file zip, clientId, folder lưu file sau khi giải nén
    const zipFile = req.file;
    const clientId = req.query.clientId;

    const time = new Date() * 1;

    const firstUploadFolder = path.join(__dirname, '..', '..', 'files');
    const compressedFilePath = path.join(firstUploadFolder, zipFile.filename);
    const folderToSave = path.join(__dirname, '..', '..', 'uploads', `${clientId}`, `import_${time}`);
    const folderToSaveaAtachment = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      `${clientId}`,
      `import_${time}`,
      `attachments`,
    );

    // kiểm tra file được tải lên chưa
    if (!zipFile) {
      return res.status(400).json({ status: 0, message: 'Tải file lên thất bại' });
    }

    //giải nén file zip đầu vào
    const extractFileZip = await service.unzipFile(compressedFilePath, folderToSave);
    if (!extractFileZip) {
      return res.status(400).json({ status: 0, message: 'Giải nén không thành công' });
    }

    // lấy path của file excel và path của file zip đính kèm còn lại
    const objPath = await service.getPathOfChildFileZip(folderToSave);

    if (!objPath) {
      return res.status(400).json({ status: 0, message: 'Không tìm được file sau khi giải nén' });
    }

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
      extractFileAttachment = await service.unzipFile(objPath.zipFile, folderToSaveaAtachment);
    }

    let dataFromAttachment = [];
    if (extractFileAttachment) {
      // lấy thông tin các file con trong file zip đính kèm(zipAttachmentFile) từ path vừa tìm đc
      dataFromAttachment = await service.getDataFromAttachment(folderToSaveaAtachment);
      if (!dataFromAttachment) {
        return res.status(400).json({ status: 0, message: 'Lấy dữ liệu tệp đính kèm thất bại' });
      }
    }

    // lấy dữ liệu file excel
    const dataExcel = await service.getDataFromExcelFile(objPath.excelFile);
    if (!dataExcel) {
      return res.status(400).json({ status: 0, message: 'Lấy dữ liệu từ file excel thất bại' });
    }

    //xử lý dữ liệu lưu các bản ghi vào db
    const data = await service.processData(dataExcel, dataFromAttachment, folderToSave);
    if (!data) {
      return res.status(400).json({ status: 0, message: 'Import bản ghi thất bại' });
    }
    return res.status(200).json({ status: 1, data });
  } catch (e) {
    return res.status(400).json(e);
  }
};

module.exports = { importDataInZipFile };
