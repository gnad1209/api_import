const File = require('./incommingDocument.model');
const Client = require('../../models/client.model');
const documentModel = require('../../models/document.model');
const fileManagerModel = require('../../models/fileManager.model');
const service = require('./incommingDocument.service');

const importDataInZipFile = async (req, res, next) => {
  try {
    const zipFile = req.file;
    if (!zipFile) {
      return res.status(400).json({ status: 0, message: 'Upload file failed' });
    }
    const dataAfterUnZip = await service.unzipFile(zipFile);

    // const uploadedImportFile = await File.create({
    //   name: zipFile.originalname,
    //   filename: zipFile.filename,
    //   path: zipFile.path,
    //   size: zipFile.size,
    //   mimetype: zipFile.mimetype,
    //   field: zipFile.fieldname,
    //   user: zipFile.user,
    // });

    const dataFromExcelFile = await service.getDataFromExcelFile(dataAfterUnZip.pathExcelFile[0]);

    const data = await service.processData(dataFromExcelFile, dataAfterUnZip.folderToSave);

    return res.status(200).json({ status: 1, data: data });
  } catch (e) {
    return res.json(e);
  }
};

// const readAndMapFileFromExcelV3 = async (req, res, next) => {
//   try {
//     console.log('Xu ly import file');
//     const service = require('./incommingDocument.service');
//     let { importFile, zipFile } = req.files;
//     if (importFile.length < 1 || zipFile.length < 1) {
//       return res.status(400).json({
//         status: 0,
//         message: 'Upload files failed',
//       });
//     }
//     const importFile0 = importFile[0];
//     const zipFile0 = zipFile[0];
//     const totalSize = importFile0.size + zipFile0.size;

//     const processDataConfig = {};
//     const { planId, uploaderId, profileId, organizationUnit, clientId } = req.query;
//     // if (planId) processDataConfig.plan = planId;
//     // if (uploaderId) processDataConfig.creator = uploaderId;
//     // if (profileId) processDataConfig.profileId = profileId;
//     // if (organizationUnit) processDataConfig.organizationUnit = organizationUnit;
//     if (clientId) processDataConfig.clientId = clientId;

//     if (clientId) {
//       const client = await Client.findOne({ clientId });
//       if (client) {
//         if (client.storageCapacity) {
//           const remainingStorage = client.storageCapacity - client.usedStorage;
//           if (remainingStorage < totalSize) {
//             return res.json({
//               status: 0,
//               message: 'Dung lượng còn lại không đủ',
//             });
//           }
//         } else {
//           client.usedStorage += totalSize;
//         }
//         await client.save();
//       }
//     }

//     const [uploadedImportFile, uploadedZipFile] = await File.create([
//       {
//         name: importFile0.originalname,
//         filename: importFile0.filename,
//         path: importFile0.path,
//         size: importFile0.size,
//         mimetype: importFile0.mimetype,
//         field: importFile0.fieldname,
//         user: importFile0.user,
//       },
//       {
//         name: zipFile0.originalname,
//         filename: zipFile0.filename,
//         path: zipFile0.path,
//         size: zipFile0.size,
//         mimetype: zipFile0.mimetype,
//         field: zipFile0.fieldname,
//         user: zipFile0.user,
//       },
//     ]);

//     console.log(`Uploaded file ${uploadedImportFile.filename}: `, uploadedImportFile.path);
//     console.log(`Uploaded file ${uploadedZipFile.filename}: `, uploadedZipFile.path);

//     const folderSaveFiles = await service.createFolderAndSaveFilesV2(
//       uploadedImportFile.toObject(),
//       uploadedZipFile.toObject(),
//     );

//     // const excelData = await service.getDataFromExcelFile(uploadedImportFile.path);
//     const excelData = await service.getDataFromExcelFile(uploadedImportFile);

//     const data = await service.dataProcessing(excelData, folderSaveFiles, processDataConfig);
//     // console.log('=================== DONE ===================');

//     return res.json({ status: 1, data: data });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: 0,
//       message: error.message,
//     });
//   }
// };

module.exports = { importDataInZipFile };
