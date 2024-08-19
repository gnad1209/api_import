const FileService = require('./file.service');
const ClientService = require('./client.service');
const ExcelService = require('./excel.service');
const BookService = require('./book.service');
const DataProcessingService = require('./data.processing.service');

// Multer configuration

const readMapFileFromExcelV3AnhCreatedBook = async (req, res, next) => {
  console.log('Files:', req.files);
  try {
    console.log('Xu ly import file');
    let { importFile, zipFile } = req.files;
    if (importFile.length < 1 || zipFile.length < 1) {
      return res.status(400).json({
        status: 0,
        message: 'Upload files failed',
      });
    }
    const importFile0 = importFile[0];
    const zipFile0 = zipFile[0];
    const totalSize = importFile0.size + zipFile0.size;

    const processDataConfig = FileService.getProcessDataConfig(req.query);

    // Check client storage capacity
    if (processDataConfig.clientId) {
      const storageCheckResult = await ClientService.checkStorageCapacity(processDataConfig.clientId, totalSize);
      if (!storageCheckResult.success) {
        return res.json({ status: 0, message: storageCheckResult.message });
      }
    }

    // Upload files
    const [uploadedImportFile, uploadedZipFile] = await FileService.uploadFiles(importFile0, zipFile0);

    console.log(`Uploaded file ${uploadedImportFile.filename}: `, uploadedImportFile.path);
    console.log(`Uploaded file ${uploadedZipFile.filename}: `, uploadedZipFile.path);

    // Create folder and save files
    const folderSaveFiles = await FileService.createFolderAndSaveFilesV2(
      uploadedImportFile.toObject(),
      uploadedZipFile.toObject(),
    );

    // Get data from Excel file
    const excelData = await ExcelService.getDataFromExcelFile(uploadedImportFile);

    // Process data
    const data = await DataProcessingService.dataProcessing(excelData, folderSaveFiles, processDataConfig);
    console.log('=================== DONE ===================');
    // console.log(data);

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
