const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const CLIENT_KHOLS = 'DHVB';
const File = require('./incommingDocument.model');
const Profile = require('../../models/profile.model');
const Document = require('../../models/document.model');
const Receiver = require('../../models/receiver.model');
const fileManager = require('../../models/fileManager.model');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');

const {
  removeVietnameseTones,
  countPagePdf,
  existsPath,
  createSortIndex,
  deleteFolderAndContent,
  extractFile,
  readExcelDataAsArray,
  extractAttachmentFile,
  getPathFile,
} = require('../../config/common');
/**
 * Nhận thông tin file nén và file import, lưu file, giải nén
 * @param {Object} zipFile Thông tin file zip chứa file import và file zip đính kèm, từ model File
 * @returns Đường dẫn tới thư mục lưu file import, file zip và các file đã được giải nén
 */
const unzipFile = async (zipFile) => {
  try {
    const time = new Date() * 1;

    const compressedFileName = zipFile.filename;
    const folderToSave = path.join(__dirname, '..', '..', 'uploads', `${CLIENT_KHOLS}`, `import_${time}`);
    const folderToSaveaAtachment = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      `${CLIENT_KHOLS}`,
      `import_${time}`,
      `attachments`,
    );
    const firstUploadFolder = path.join(__dirname, '..', '..', 'files');

    const compressedFilePath = path.join(firstUploadFolder, compressedFileName);

    const [checkSaveFolder, checkZipFile] = await Promise.all([
      existsPath(folderToSave),
      existsPath(compressedFilePath),
    ]);

    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderToSave); // tạo đường dẫn thư mục nếu không tồn tại
    }
    if (!checkZipFile) {
      throw new Error('Không tồn tại file đã upload');
    }
    // Giải nén file input
    await extractFile(compressedFilePath, folderToSave);
    await extractAttachmentFile(folderToSave, folderToSaveaAtachment);

    const pathExcelFile = await getPathFile(folderToSave);

    // const os = process.platform;
    // if (os == 'win32') {
    //   await unzipFileWindow(compressedFilePath, folderToSave);
    // } else {
    // await decompressFile(compressedFilePath, folderToSave);
    // }
    // await unzipFile(compressedFilePath, folderToSave); // tạm thời comment
    console.log('Thư mục lưu: ', folderToSave);
    return { folderToSave, pathExcelFile };
  } catch (error) {
    console.log('Lỗi khi thực hiện hàm tạo folder');
    throw error;
  }
};

/**
 * Nếu không có sẵn fileUrl, tải file theo đường dẫn đầu vào. Lấy đường dẫn đó gọi đến JAVdocument. CHỈ SỬ DỤNG VỚI FILE IMPORT HOẶC CÁC FILE UPLOAD VỚI MODEL FILE
 * @param {Path} file
 * @param {URL} [fileUrl]
 * @returns Dữ liệu từ file data
 */
// const getDataFromExcelFile = async (filePath, check = false) => {
//   try {
//     if (check) {
//       const fileCheck = await File.findById({ path: filePath });
//       if (!fileCheck) {
//         throw new Error('Không tìm thấy file');
//       }
//     }
//     // Đọc file từ đường dẫn và chuyển đổi nó thành Buffer
//     const fileBuffer = fs.readFileSync(filePath);

//     // Đọc dữ liệu từ file Excel
//     const dataArray = readExcelDataAsArray(fileBuffer);

//     if (!dataArray) {
//       return [];
//     }
//     return dataArray;
//   } catch (error) {
//     console.error('Lỗi khi đọc file Excel:', error.message);
//     return null;
//   }
// };
async function getDataFromExcelFile(file, check = false) {
  try {
    const fileUrl = 'https://administrator.lifetek.vn:233/api/files/66bc544d181ca41279b2adf9'; // dùng tạm
    if (check) {
      const FileModel = mongoose.models.File;
      const fileCheck = await FileModel.findById(file._id);
      if (!fileCheck) {
        throw new Error('Không tìm thấy file');
      }
    }
    // Đọc file từ đường dẫn và chuyển đổi nó thành Buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Đọc dữ liệu từ file Excel
    const dataArray = readExcelDataAsArray(fileBuffer);

    if (!dataArray) {
      return [];
    }
    return [];
  } catch (error) {
    console.log('Lỗi lấy dữ liệu từ file excel');
    throw error;
  }
}

const listFileAttachments = async (filesArrInput, folderPath) => {
  try {
    const files = await fs.promises.readdir(`${folderPath}/attachments`);
    const arrAttachment = files.map((file) => path.join(`${folderPath}/attachments`, file));
    const set1 = new Set(filesArrInput);
    const set2 = new Set(files);
    if (!Array.isArray(filesArrInput)) {
      if (files.includes(filesArrInput.trim())) {
        const fileSelected = Array.of(filesArrInput);
        return fileSelected;
      }
    } else {
      const fileSelected = Array.from(set1.filter((item) => set2.has(item)));
      return fileSelected;
    }
  } catch (e) {
    return e;
  }
};

const processData = async (data, folderPath, config = {}) => {
  try {
    const result = [];
    // lấy biến config hoặc môi trường
    const defaultPlan = config.plan ? config.plan : process.env.KHOLS_UPLOAD_PLAN;
    const defaultUploadAccount = config.account ? config.account : process.env.KHOLS_UPLOAD_ACCOUNT;
    const defaultCreator = config.creator ? config.creator : process.env.KHOLS_UPLOAD_ACCOUNT_ID;
    const defaultUploadOrg = config.organizationUnit ? config.organizationUnit : process.env.KHOLS_UPLOAD_ACCOUNT_ORG;
    const defaultClientId = config.clientId ? config.clientId : process.env.CLIENT_KHOLS;

    // check tồn tại thư mục xử lý
    if (!Array.isArray(data)) {
      throw new Error('Sai dữ liệu đầu vào');
    }
    const checkFolder = await existsPath(folderPath);
    if (!checkFolder) {
      throw new Error('Thư mục xử lý không tồn tại');
    }
    const folderAttachmentPath = folderPath + '\\attachments';

    // bắt đầu xử lý
    const files = await fs.promises.readdir(`${folderAttachmentPath}`);
    const fileList = files.filter((file) => {
      const filePath = path.join(`${folderAttachmentPath}`, file);
      return fs.statSync(filePath).isFile();
    });
    console.log('fileList', fileList);

    // for (row of data) {
    //   if (row.rowIndex === 0) continue;
    //   const initFilename = row.column5 || '';
    //   // refix - khi mà không ai để ý đến việc đặt tên file trên hệ thống; sửa tên file thành dạng thao tác được ☠☠
    //   let plainName = removeVietnameseTones(row[1]);
    //   const filenameToSet = plainName || ''; // tên file mong muốn đặt
    //   // const filenameToSet = row.column6 || ''; // tên file mong muốn đặt

    //   let saveFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filenameToSet}`;
    //   saveFilename = saveFilename.length > 255 ? saveFilename.substring(0, 255) : saveFilename;
    //   let document = new Document({
    //     toBook: 'tobook',
    //   });
    //   const filenameToCopyPath = path.join(folderPath, initFilename);
    //   const saveModelFilePath = path.join(__dirname, '..', '..', '..', 'uploads', defaultClientId, saveFilename);
    //   const documentFullPath = path.join(folderPath, '..', saveFilename);
    //   // const toBook = row[0] || 0;
    //   const fileToSave = new fileManager({
    //     fullPath: documentFullPath, // đường dẫn dầy đủ tới file
    //     mid: '1', // id của bản ghi chiều 03 -> khols
    //     name: `${filenameToSet}`, // tên file đặt tên theo ý muốn (từ dữ liệu excel)
    //     parentPath: `${folderPath}`, // pwd thư mục lưu file
    //     username: defaultUploadAccount, // fix cứng id của user thực hiện upload
    //     isFile: true, // fix cứng giá trị true
    //     type: '.pdf', // gần như là pdf
    //     realName: saveFilename, // tên file thực tế lưu trên 03, là tên được gen với chuỗi random
    //     clientId: defaultClientId, // fix cứng, k quan tâm
    //     code: 'company', //
    //     mimetype: 'application/pdf', //
    //     nameRoot: saveFilename, // như trên
    //     createdBy: defaultCreator, // fix cứng
    //     smartForm: '',
    //     isFileSync: false,
    //     folderChild: false,
    //     isStarred: false,
    //     isEncryption: false,
    //     shares: [],
    //     isConvert: false,
    //     internalTextIds: [],
    //     canDelete: true,
    //     canEdit: true,
    //     status: 1,
    //     isApprove: false,
    //     public: 0,
    //     permissions: [],
    //     users: [],
    //     hasChild: false,
    //   });
    //   // document.files = { id: fileToSave._id, name: fileToSave.name };

    //   saveResult = await Promise.all([await fileToSave.save()]);
    //   result.push(saveResult);
    // }
    for (row of data) {
      if (row.rowIndex === 0) continue;

      // const toBook = row[0] || 0;
      const toBook = `abc${row.rowIndex}`;
      const toBook_en = removeVietnameseTones(toBook);
      const abstractNote = row[1] || 'a';
      const abstractNote_en = removeVietnameseTones(abstractNote);
      const bookDocumentIdName = row[2] || ''; //////////////////
      const urgencyLevel = row[3] || '';
      const urgencyLevel_en = removeVietnameseTones(urgencyLevel);
      const toBookCode = row[4] || '';
      const toBookCode_en = removeVietnameseTones(toBookCode);
      const senderUnit = row[5] || 'v';
      const senderUnit_en = removeVietnameseTones(senderUnit);
      const files = row[6] || '';
      const bookDocumentId = row[7] || '';
      const secondBook = row[8] || '';
      const receiverUnit = row[9] || 'b';
      const processorUnits = row[10] || '';
      const documentType = row[11] || '';
      const documentType_en = removeVietnameseTones(documentType);
      const documentField = row[12] || '';
      const documentField_en = removeVietnameseTones(documentField);
      const receiveMethod = row[13] || '';
      const receiveMethod_en = removeVietnameseTones(receiveMethod);
      const privateLevel = row[14] || '';
      const privateLevel_en = removeVietnameseTones(privateLevel);
      const currentNote = row[15] || '';
      const currentRole = row[16] || '';
      const nextRole = row[17] || '';
      const letterType = row[18] || '';
      const processAuthorString = row[19] || '';
      const toBookCodeDepartment = row[20] || '';

      if (!toBook) {
        throw new Error('thiếu số văn bản');
      }
      if (!abstractNote) {
        throw new Error('thiếu trích yếu');
      }
      if (!senderUnit) {
        throw new Error('thiếu đơn vị gửi');
      }
      if (!receiverUnit) {
        throw new Error('thiếu đơn vị nhận');
      }
      let receiver = await Receiver.findOne({ name: receiverUnit });
      if (!receiver) {
        receiver = new Receiver({ name: receiverUnit });
      }
      let document = await Document.findOne({ toBook });
      if (document) {
        throw new Error('đã tồn tại số văn bản');
      }
      document = new Document({
        toBook,
        toBook_en,
        abstractNote,
        abstractNote_en,
        bookDocumentIdName,
        urgencyLevel,
        urgencyLevel_en,
        toBookCode,
        toBookCode_en,
        senderUnit,
        senderUnit_en,
        files,
        bookDocumentId,
        secondBook,
        receiverUnit: receiver._id,
        processorUnits,
        documentType,
        documentType_en,
        documentField,
        documentField_en,
        receiveMethod,
        receiveMethod_en,
        privateLevel,
        privateLevel_en,
        currentNote,
        currentRole,
        nextRole,
        letterType,
        processAuthorString,
        toBookCodeDepartment,
      });

      // const arrFiles = files
      //   .trim()
      //   .split(',')
      //   .map((item) => item.trim());
      // const arrFileAttachment = await listFileAttachments(arrFiles, folderPath);
      // if (!arrFileAttachment) {
      //   return;
      // }
      // arrFileAttachment.map((item) => {
      //   const fileToSave = new fileManager({
      //     fullPath: documentFullPath, // đường dẫn dầy đủ tới file
      //     mid: document._id, // id của bản ghi chiều 03 -> khols
      //     name: `${filenameToSet}`, // tên file đặt tên theo ý muốn (từ dữ liệu excel)
      //     parentPath: `${folderPath}`, // pwd thư mục lưu file
      //     username: defaultUploadAccount, // fix cứng id của user thực hiện upload
      //     isFile: true, // fix cứng giá trị true
      //     type: '.pdf', // gần như là pdf
      //     realName: saveFilename, // tên file thực tế lưu trên 03, là tên được gen với chuỗi random
      //     clientId: defaultClientId, // fix cứng, k quan tâm
      //     code: 'company', //
      //     mimetype: 'application/pdf', //
      //     nameRoot: saveFilename, // như trên
      //     createdBy: defaultCreator, // fix cứng
      //     smartForm: '',
      //     isFileSync: false,
      //     folderChild: false,
      //     isStarred: false,
      //     isEncryption: false,
      //     shares: [],
      //     isConvert: false,
      //     internalTextIds: [],
      //     canDelete: true,
      //     canEdit: true,
      //     status: 1,
      //     isApprove: false,
      //     public: 0,
      //     permissions: [],
      //     users: [],
      //     hasChild: false,
      //   });
      //   document.fileId = fileToSave._id;
      //   document.originalFileId = fileToSave._id;
      // });

      let profile = await Profile.findOne(profileFilter);
      if (!profile) {
        profile = new Profile({
          status: 1,
          kanbanStatus: 1,
          profileTitle,
          title: profileTitle,
          profileYear,
          binderCode,
          organizationUnitId: defaultUploadOrg,
          createdBy: defaultCreator,
          planId: defaultPlan,
          sortIndex: createSortIndex(profileYear, profileIndex),
          // sortIndex: createSortIndex(),
        });
        console.log('Tao moi ho so: ', profile._id);
      } else {
        console.log('Cap nhap ho so: ', profile._id);
      }

      const documentFullPath = path.join(folderPath, '..', saveFilename);

      let document = await Document.findOne({
        status: 1,
        profileId: profile._id,
        profileIndex,
        abstract: documentAbstract,
      });
      if (!document) {
        // const pageNumber = await countPagePdf(filenameToCopyPath);
        const pageNumber = 10;
        document = new Document({
          status: 1,
          profileId: profile._id,
          profileIndex: profileIndex,
          organizationUnitId: defaultUploadOrg,
          createdBy: defaultCreator,
          abstract: documentAbstract,
          page_count: pageNumber,
        });
        console.log('Tao moi van ban: ', document._id);
        profile.pageQuantity = (+profile.pageQuantity || 0) + pageNumber;
        console.log('Doc page count: ', pageNumber);
        const sheetCount = Math.round(pageNumber / 2) || 0;
        profile.sheetQuantity += sheetCount;
        profile.documentQuantity += 1;
      } else {
        console.log('Cap nhap van ban: ', document._id);
      }
      if (profile.code) document.code = profile.code;
      if (profile.codeOrg) document.codeOrg = profile.codeOrg;
      if (profile.historyOrg) document.historyOrg = profile.historyOrg;
      if (profile.room) document.room = profile.room;

      const fileToSave = new fileManager({
        fullPath: documentFullPath, // đường dẫn dầy đủ tới file
        mid: document._id, // id của bản ghi chiều 03 -> khols
        name: `${filenameToSet}`, // tên file đặt tên theo ý muốn (từ dữ liệu excel)
        parentPath: `${folderPath}`, // pwd thư mục lưu file
        username: defaultUploadAccount, // fix cứng id của user thực hiện upload
        isFile: true, // fix cứng giá trị true
        type: '.pdf', // gần như là pdf
        realName: saveFilename, // tên file thực tế lưu trên 03, là tên được gen với chuỗi random
        clientId: defaultClientId, // fix cứng, k quan tâm
        code: 'company', //
        mimetype: 'application/pdf', //
        nameRoot: saveFilename, // như trên
        createdBy: defaultCreator, // fix cứng
        smartForm: '',
        isFileSync: false,
        folderChild: false,
        isStarred: false,
        isEncryption: false,
        shares: [],
        isConvert: false,
        internalTextIds: [],
        canDelete: true,
        canEdit: true,
        status: 1,
        isApprove: false,
        public: 0,
        permissions: [],
        users: [],
        hasChild: false,
      });
      document.fileId = fileToSave._id;
      document.originalFileId = fileToSave._id;

      // console.log('=======================================================');
      // const checkk = await existsPath(filenameToCopyPath);
      // console.log('Đường dẫn file copy co ton tai?: ', checkk);

      // console.log('=======================================================');

      await fsPromises.copyFile(filenameToCopyPath, saveModelFilePath);
      console.log('Duong dan tai lieu da luu: ', fileToSave.fullPath);

      saveResult = await Promise.all([await fileToSave.save(), await profile.save()]);
      result.push(saveResult);
      // xóa folder tiết kiệm bộ nhớ sau khi sử dụng. File zip và file excel còn tồn tại bên file, file sử udnjg đã có trong upload và sử dụng được
    }
    console.log('Xóa đường dẫn: ', folderPath);
    return result;
  } catch (error) {
    console.log('Lỗi khi xử lý dữ liệu');
    throw error;
  }
};

module.exports = { unzipFile, getDataFromExcelFile, processData, listFileAttachments };
