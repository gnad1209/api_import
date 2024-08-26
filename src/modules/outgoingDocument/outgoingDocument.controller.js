const FileService = require('./file.service');
const ClientService = require('./client.service');
const ExcelService = require('./excel.service');
const UnZipService = require('./unzip.service');
const DataProcessingService = require('./data.processing.service');

// Multer configuration

const readMapFileFromExcelV3AnhCreatedBook = async (req, res, next) => {
  // console.log('Files:', req.files);
  try {
    // kiểm tra file có hợp lệ ko ?
    let { zipFile } = req.files;
    if (!zipFile || zipFile == null || File.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'Upload files failed',
      });
    }

    // lấy thông tin client từ query
    const processDataConfig = FileService.getProcessDataConfig(req.query);

    // tính tổng dung lượng
    const zipFile0 = zipFile[0];
    const totalSize = zipFile0.size;

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

    // Upload tất cả các file
    const [uploadedZipFile, uploadedUnZipFile, uploadedUnzipToUnZipFile] = await FileService.uploadFiles(
      zipFile0,
      unzipData,
      attachmentData,
    );

    // console.log(`Uploaded file 11 ${uploadedZipFile.filename}: `, uploadedZipFile.path);
    // uploadedUnZipFile.forEach((element) => {
    //   console.log(`Uploaded file unzip 22  ${element.filename}: `, element);
    // });
    // uploadedUnzipToUnZipFile.forEach((element) => {
    //   console.log(`Uploaded fileUnZip to unzip 33 ${element.filename}: `, element);
    // });

    // tạo folder và lưu file
    const folderSaveFiles = await FileService.createFolderAndSaveFilesV2(uploadedZipFile.toObject());

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
    console.log('excelData == ', excelData);

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
  readMapFileFromExcelV3AnhCreatedBook,
};
