const FileService = require('./file.service');
const ClientService = require('./client.service');
const ExcelService = require('./excel.service');
const UnZipService = require('./unzip.service');
const DataProcessingService = require('./data.processing.service');

const importimportOutgoingDocument = async (req, res, next) => {
  try {
    // kiểm tra có file ko ?
    let { zipFile } = req.files;
    if (!zipFile) {
      return res.status(400).json({
        status: 0,
        message: 'không có zipFile',
      });
    }

    // lấy thông tin client
    const processDataConfig = FileService.getProcessDataConfig(req.query);

    console.log('1 @@ lấy thông tin tu client thanh cong', processDataConfig);

    // kiểm tra dung lượng của client còn đủ không
    // if (processDataConfig.clientId) {
    //   const storageCheckResult = await ClientService.checkStorageCapacity(processDataConfig.clientId, totalSize);
    //   if (!storageCheckResult.success) {
    //     return res.json({ status: 0, message: storageCheckResult.message });
    //   }
    // }
    // console.log('2 @@ dung lượng đủ');

    // giải nén
    const zipFile0 = zipFile[0];
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

    console.log('3 @@ giải nén thành công');

    // create bản ghi cho tất cả các file
    const [uploadedZipFile, uploadedUnZipFile, uploadedUnzipToUnZipFile] = await FileService.processAndSaveFiles(
      zipFile0,
      unzipData,
      attachmentData,
    );

    // tạo folder và lưu file
    const folderSaveFiles = await FileService.createFolderAndSaveFiles(uploadedZipFile.toObject(), processDataConfig);

    console.log('4 @@ lưu folder xong');

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

    console.log('5 @@ đọc file excel thành công');
    // console.log('excelData == ', excelData);/

    console.log('6 @@ validate thành công');

    // Process data
    const data = await DataProcessingService.dataProcessing(
      excelData,
      folderSaveFiles,
      processDataConfig,
      uploadedUnzipToUnZipFile,
    );
    console.log('7 @@ Lưu vào database thành công');
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
