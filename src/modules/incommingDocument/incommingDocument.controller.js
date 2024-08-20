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
    //lấy data từ file zip ban đầu
    const dataAfterUnZip = await service.unzipFile(zipFile);

    //lấy data từ file excel có trong file zip
    const dataFromExcelFile = await service.getDataFromExcelFile(dataAfterUnZip.pathExcelFile[0]);

    //xử lý data khi đã giải nén
    const data = await service.processData(dataFromExcelFile, dataAfterUnZip.folderToSave);

    return res.status(200).json({ status: 1, data: data });
  } catch (e) {
    return res.json(e);
  }
};

module.exports = { importDataInZipFile };
