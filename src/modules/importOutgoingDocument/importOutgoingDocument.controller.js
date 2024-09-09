const FileService = require('./file.service');
const ExcelService = require('./excel.service');
const UnZipService = require('./unzip.service');
const DataProcessingService = require('./data.processing.service');
const path = require('path');

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

    // console.log('@@', zipFile0);

    // console.log('23 @@ giải này', unzipData);

    // giải nén file zip thu_muc_file_dinh_kem
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
    // console.log('zipFile0', zipFile0);
    // console.log('unzipData', unzipData);
    // console.log('attachmentData', attachmentData);

    // đọc dữ liệu và validate từ file excel
    let excelData = [];
    for (const element of unzipData) {
      if (
        element.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
        element.name === 'ds_van_ban.xlsx'
      ) {
        const dataExcel = await ExcelService.getDataFromExcelFileAndValidate(element, attachmentData);
        if (dataExcel.status == 0) {
          console.log(' validate thất bại', dataExcel.data);
          return res.status(400).json({
            status: 0,
            message: dataExcel.data,
          });
        } else {
          excelData = dataExcel.data;
        }
        break;
      }
    }
    if (excelData.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'đọc file excel thất bại',
      });
    }
    console.log('4 @@ đọc file excel và validate thành công', excelData);

    // for (const element of excelData) {
    //   console.log('===============');
    //   console.log('excelData == ', element.column13);
    //   console.log('excelData == ', element.column14);
    //   console.log('excelData == ', element.column15);
    // }

    // giải nén file zip đính kèm và tạo đường dẫn liên kết folder
    //OutGoing/VanBanBaoCao
    //OutGoing/VanBanDinhKem
    //OutGoing/VanBanDuThao
    let attachmentDataV2 = [];
    for (const element of unzipData) {
      if (element.mimetype === 'application/zip' && element.name === 'thu_muc_file_dinh_kem.zip') {
        const dataAttachment = await UnZipService.extractZipAndSaveToCorrectPath(
          element.path,
          processDataConfig.clientId,
          excelData,
        );
        attachmentDataV2 = dataAttachment;
        break;
      }
    }
    if (attachmentDataV2.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'giải nén thu_muc_file_dinh_kem.zip đường dẫn liên kết folder',
      });
    }
    // console.log('attachmentDataV2', attachmentDataV2);

    // create bản ghi cho tất cả các file
    const [uploadedZipFile, uploadedUnZipFile, uploadedUnzipToUnZipFile] = await FileService.processAndSaveFiles(
      zipFile0,
      unzipData,
      attachmentDataV2,
    );

    // console.log('uploadedZipFile', uploadedZipFile);
    // console.log('uploadedUnZipFile', uploadedUnZipFile);
    // console.log('uploadedUnzipToUnZipFile', uploadedUnzipToUnZipFile);
    console.log('4.1 @@ create bản ghi cho tất cả các file thành công');

    // console.log(' element.path == ', unzipData);

    // tạo folder và lưu file
    const folderSaveFiles = await FileService.createFolderAndSaveFiles(uploadedZipFile.toObject());

    console.log('5 @@ lưu folder xong');

    // return res.json({ status: 1, data: excelData });

    // Process data
    const data = await DataProcessingService.dataProcessing(
      excelData,
      folderSaveFiles,
      processDataConfig,
      uploadedUnzipToUnZipFile,
    );
    console.log('6 @@ Lưu vào database thành công');
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
