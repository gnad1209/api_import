const FileService = require('./file.service');
const ClientService = require('./client.service');
const ExcelService = require('./excel.service');
const UnZipService = require('./unzip.service');
const DataProcessingService = require('./data.processing.service');

const importimportOutgoingDocument = async (req, res, next) => {
  try {
    // kiểm tra file có hợp lệ ko ?
    let { zipFile } = req.files;
    if (!zipFile || zipFile == null || File.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'Upload files failed',
      });
    }

    // tính tổng dung lượng
    const zipFile0 = zipFile[0];
    const totalSize = zipFile0.size;

    // lấy thông tin client từ query
    const processDataConfig = FileService.getProcessDataConfig(req.query);

    // kiểm tra dung lượng của client còn đủ không
    if (processDataConfig.clientId) {
      const storageCheckResult = await ClientService.checkStorageCapacity(processDataConfig.clientId, totalSize);
      if (!storageCheckResult.success) {
        return res.json({ status: 0, message: storageCheckResult.message });
      }
    }

    // giải nén
    const unzipData = await UnZipService.extractZip(zipFile0.path, processDataConfig.clientId);

    // giải nén file zip đính kèm
    let attachmentData = [];
    for (const element of unzipData) {
      if (element.mimetype === 'application/zip' && element.name === 'thu_muc_file_dinh_kem.zip') {
        const dataAttachment = await UnZipService.extractZip(element.path, processDataConfig.clientId);
        attachmentData = dataAttachment;
        break;
      }
    }
    if (attachmentData.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'giải nén thu_muc_file_dinh_kem.zip thất bại',
      });
    }

    // create bản ghi cho tất cả các file
    const [uploadedZipFile, uploadedUnZipFile, uploadedUnzipToUnZipFile] = await FileService.processAndSaveFiles(
      zipFile0,
      unzipData,
      attachmentData,
    );

    // tạo folder và lưu file
    const folderSaveFiles = await FileService.createFolderAndSaveFiles(uploadedZipFile.toObject());

    // lấy dữ liệu từ file excel
    let excelData = [];
    for (const element of uploadedUnZipFile) {
      if (
        element.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
        element.name === 'ds_van_ban.xlsx'
      ) {
        const dataExcel = await ExcelService.getDataFromExcelFile(element);
        excelData = dataExcel;
        break;
      }
    }
    if (excelData.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'đọc file excel thất bại',
      });
    }
    // console.log('excelData == ', excelData);

    // Process data
    const data = await DataProcessingService.dataProcessing(
      excelData,
      folderSaveFiles,
      processDataConfig,
      uploadedUnzipToUnZipFile,
    );

    console.log('DONE DONE DONE DONE DONE DONE DONE');

    return res.json({ status: 1, data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 0,
      message: error.message,
    });
  }
};

module.exports = {
  importimportOutgoingDocument,
};
