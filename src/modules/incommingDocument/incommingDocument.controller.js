const File = require('./incommingDocument.model');
const Client = require('../../models/client.model');
const documentModel = require('../../models/document.model');
const fileManagerModel = require('../../models/fileManager.model');

const readAndMapFileFromExcelV3 = async (req, res, next) => {
  try {
    console.log('Xu ly import file');
    const service = require('./incommingDocument.service');
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

    const processDataConfig = {};
    const { planId, uploaderId, profileId, organizationUnit, clientId } = req.query;
    // if (planId) processDataConfig.plan = planId;
    // if (uploaderId) processDataConfig.creator = uploaderId;
    // if (profileId) processDataConfig.profileId = profileId;
    // if (organizationUnit) processDataConfig.organizationUnit = organizationUnit;
    if (clientId) processDataConfig.clientId = clientId;

    if (clientId) {
      const client = await Client.findOne({ clientId });
      if (client) {
        if (client.storageCapacity) {
          const remainingStorage = client.storageCapacity - client.usedStorage;
          if (remainingStorage < totalSize) {
            return res.json({
              status: 0,
              message: 'Dung lượng còn lại không đủ',
            });
          }
        } else {
          client.usedStorage += totalSize;
        }
        await client.save();
      }
    }

    const [uploadedImportFile, uploadedZipFile] = await File.create([
      {
        name: importFile0.originalname,
        filename: importFile0.filename,
        path: importFile0.path,
        size: importFile0.size,
        mimetype: importFile0.mimetype,
        field: importFile0.fieldname,
        user: importFile0.user,
      },
      {
        name: zipFile0.originalname,
        filename: zipFile0.filename,
        path: zipFile0.path,
        size: zipFile0.size,
        mimetype: zipFile0.mimetype,
        field: zipFile0.fieldname,
        user: zipFile0.user,
      },
    ]);

    console.log(`Uploaded file ${uploadedImportFile.filename}: `, uploadedImportFile.path);
    console.log(`Uploaded file ${uploadedZipFile.filename}: `, uploadedZipFile.path);

    const folderSaveFiles = await service.createFolderAndSaveFilesV2(
      uploadedImportFile.toObject(),
      uploadedZipFile.toObject(),
    );

    const excelData = await service.getDataFromExcelFile(uploadedImportFile.path);

    const data = await service.dataProcessing(excelData, folderSaveFiles, processDataConfig);
    // console.log('=================== DONE ===================');

    return res.json({ status: 1, data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 0,
      message: error.message,
    });
  }
};

async function updateFile(req, res, next) {
  try {
    const { docIds, files } = req.body;
    if (docIds.length !== files.length) {
      throw new Error('Số lượng bản ghi có file đính kèm không trùng với số lượng file tải lên');
    }
    const promises = docIds.map(async (docId, index) => {
      const docFilter = { _id: docId, isImportFile: true };
      if (!Array.isArray(files[index])) {
        throw new Error('Phần tử của files phải là 1 mảng');
      }
      if (typeof docId !== 'string' || docId.trim() === '') {
        throw new Error('Phần tử của docId phải là 1 chuỗi có giá trị');
      }
      // if (typeof files[index] !== 'object' || files[index] === null || Object.keys(files[index]).length < 0) {
      //   throw new Error('Cấu hình file phải là đối tượng gồm id và name');
      // }

      return documentModel.findOneAndUpdate(docFilter, { $set: { files: files[index] } }, { new: true });
    });
    const attachments = await Promise.all(promises);
    // const saved = await documentary.save();
    return res.json({ status: 1, attachments });
  } catch (e) {
    next(e);
  }
}

module.exports = { readAndMapFileFromExcelV3, updateFile };
