const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const CLIENT_KHOLS = 'DHVB';
const File = require('./incommingDocument.model');
const Profile = require('../../models/profile.model');
const Document = require('../../models/document.model');
const fileManager = require('../../models/fileManager.model');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');
const {
  removeVietnameseTones,
  countPagePdf,
  existsPath,
  createSortIndex,
  deleteFolderAndContent,
  decompressFile,
  readExcelDataAsArray,
} = require('./common');
// const { createWriteStream, createReadStream } = require('fs');
// const { createUnzip } = require('zlib');
/**
 * Nhận thông tin file nén và file import, lưu file, giải nén
 * @param {Object} importFile Thông tin file import, từ model File
 * @param {Object} compressedFile Thông tin file nén,== từ model File
 * @param {Object} config Sau này dùng
 * @returns Đường dẫn tới thư mục lưu file import, file zip và các file đã được giải nén
 */
const createFolderAndSaveFilesV2 = async (importFile, compressedFile, config = {}) => {
  try {
    const time = new Date() * 1;

    const importFileName = importFile.filename;
    const compressedFileName = compressedFile.filename;
    const folderToSave = path.join(__dirname, '..', '..', 'uploads', `${CLIENT_KHOLS}`, `import_${time}`);
    const firstUploadFolder = path.join(__dirname, '..', '..', 'files');

    const importFilePath = path.join(firstUploadFolder, importFileName);
    const newImportFilePath = path.join(folderToSave, importFileName);
    const compressedFilePath = path.join(firstUploadFolder, compressedFileName);
    const newCompressedFilePath = path.join(folderToSave, compressedFileName);

    const [checkSaveFolder, checkImportFile, checkZipFile] = await Promise.all([
      existsPath(folderToSave),
      existsPath(importFilePath),
      existsPath(compressedFilePath),
    ]);

    if (!checkSaveFolder) {
      await fsPromises.mkdir(folderToSave); // tạo đường dẫn thư mục nếu không tồn tại
    }
    if (!checkImportFile || !checkZipFile) {
      throw new Error('Không tồn tại file đã upload');
    }

    await Promise.all([
      fsPromises.copyFile(importFilePath, newImportFilePath),
      fsPromises.copyFile(compressedFilePath, newCompressedFilePath),
    ]);

    // const os = process.platform;
    // if (os == 'win32') {
    //   await unzipFileWindow(compressedFilePath, folderToSave);
    // } else {
    // await decompressFile(compressedFilePath, folderToSave);
    // }
    // await unzipFile(compressedFilePath, folderToSave); // tạm thời comment
    console.log('Thư mục lưu: ', folderToSave);
    return folderToSave;
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
    // const fileUrl = process.env.BASE_URL + file._id;
    const readFileExcelUrl = process.env.READ_EXCEL_URL;
    const request = await axios.post(readFileExcelUrl, null, {
      params: {
        pageIndex: 0,
        typeData: 'raw',
        docUrl: fileUrl,
      },
    });
    if (request && request.data && Array.isArray(request.data)) {
      return request.data;
    }
    return [];
  } catch (error) {
    console.log('Lỗi lấy dữ liệu từ file excel');
    throw error;
  }
}

/**
 * Xử lý dữ liệu
 * @param {Array} data Mảng dữ liệu đọc từ excel
 * @param {*} folderPath đường dẫn tới folder chứa các file văn bản và file import
 * @param {*} config Cấu hình tùy chọn
 * @returns dữ liệu đã xử lý
 */
const dataProcessing = async (data, folderPath, config = {}) => {
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

    // bắt đầu xử lý
    const files = fs.readdirSync(folderPath);
    const fileList = files.filter((file) => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });

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

      const profileYear = row.column0 || 0;
      const binderCode = row.column1 || '';
      const profileTitle = row.column2 || '';
      const profileTitle_en = removeVietnameseTones(profileTitle);
      const documentAbstract = row.column3 || ''; // trích yêu văn bản
      const profileIndex = row.column4 || ''; // số thứ tự trong hộp
      const initFilename = row.column5 || ''; // tên file thực tế

      // refix - khi mà không ai để ý đến việc đặt tên file trên hệ thống; sửa tên file thành dạng thao tác được ☠☠
      let plainName = removeVietnameseTones(row.column6.replace(/\s/g, ''));
      const filenameToSet = plainName || ''; // tên file mong muốn đặt
      // const filenameToSet = row.column6 || ''; // tên file mong muốn đặt

      let saveFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filenameToSet}`;
      saveFilename = saveFilename.length > 255 ? saveFilename.substring(0, 255) : saveFilename;
      let filenameToCopyPath = '';
      fileList.map((file) => {
        filenameToCopyPath = path.join(folderPath, file);
      });
      const saveModelFilePath = path.join(__dirname, '..', '..', 'uploads', defaultClientId, saveFilename);

      let profileFilter = {
        status: 1,
        planId: defaultPlan,
        $or: [{ profileTitle }, { profileTitle_en }],
        profileYear,
      };
      if (config.profileId) {
        profileFilter = {
          status: 1,
          _id: config.profileId,
        };
      }

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
    // xóa folder tiết kiệm bộ nhớ sau khi sử dụng. File zip và file excel còn tồn tại bên file, file sử udnjg đã có trong upload và sử dụng được
    await deleteFolderAndContent(folderPath);
    console.log('Xóa đường dẫn: ', folderPath);
    return result;
  } catch (error) {
    console.log('Lỗi khi xử lý dữ liệu');
    throw error;
  }
};

module.exports = { createFolderAndSaveFilesV2, getDataFromExcelFile, dataProcessing };

// async function importFormClient(req, res, next) {
//   const { modelName, filterUpdate, methodImport } = req.body;
//   let data = req.body.data;
//   const user = await Employee.findById(req.user.user);
//   if (!user) return res.json(new APIError('Unauthorized', 401, true));
//   let checkWarning = true;
//   const Model = mongoose.models[modelName];

//   if (modelName === 'Customer') {
//     data = data.filter(
//       (item, index) =>
//         index === data.findIndex((it) => it.code === item.code) &&
//         index === data.findIndex((it) => it.phoneNumber === item.phoneNumber) &&
//         index === data.findIndex((it) => it.email === item.email),
//     );
//   }

//   data = data.map((item) => {
//     if (Object.prototype.hasOwnProperty.call(item, 'gender')) {
//       item.gender = parseGenderSafety(item.gender);
//     }
//     const newItem = {};
//     Object.keys(item).forEach((key) => {
//       if (isSourceEle(item[key]) && !item[key].title) return;
//       newItem[key] = item[key];
//     });
//     return newItem;
//   });
//   let listRoleGroups = [];
//   if (modelName === 'hrm') {
//     const [responseData] = await Promise.all([
//       axios.get(`${process.env.API_ROLE_GROUPS_01}/role-groups?clientId=${process.env.CLIENT_ID}`),
//     ]);
//     // console.log('responseData', responseData);
//     // let { data: listRoleGroups } = responseData.data;
//     // if (!listRoleGroups) {
//     //   listRoleGroups = [];
//     // }
//     if (responseData.data) {
//       listRoleGroups = responseData.data;
//     }
//   }
//   const listRequired = checkRequired(modelName);
//   const listEnum = checkEnum(modelName);
//   const listDate = columnsDate(modelName);
//   if (methodImport === 'add') {
//     const modelSaveds = [];
//     for (let i = 0; i < data.length; i += 1) {
//       try {
//         let item = data[i];
//         item[FIELD.UID] = user._id;
//         // item[FIELD.OID] = user.organizationUnit ? user.organizationUnit.organizationUnitId : null;
//         item.organizationUnit = user.organizationUnit ? user.organizationUnit.organizationUnitId : null;
//         item.createdBy = user._id;
//         if (modelName === 'IncommingDocument') {
//           item.kanbanStatus = 'receive';
//         } else if (modelName === 'OutGoingDocument') {
//           item.kanbanStatus === 'new';
//         }

//         item.bookDocumentId = item && item.bookDocumentId && item.bookDocumentId.name;
//         if (item && item.bookDocumentId && item.bookDocumentId.name) delete item.bookDocumentId.name;
//         const arrError = [];

//         if (arrError.length !== 0) {
//           checkWarning = false;
//           modelSaveds.push({
//             success: false,
//             errors: arrError,
//           });
//           continue;
//         }

//         const filterOne = { [filterUpdate]: item[filterUpdate], status: { $ne: STATUS.DELETED } };
//         const model = await Model.findOne(filterOne);

//         if (modelName === 'Task') {
//           if (!item.parentId) {
//             item.parentId = null;
//           }
//         }

//         const keys = Object.keys(item);
//         for (let i = 0; i < keys.length; i++) {
//           console.log(modelName, keys[i], item[keys[i]]);
//           if (listRequired.includes(keys[i])) {
//             if (item[keys[i]] === '' || item[keys[i]] === 'undefined' || item[keys[i]] === null) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [`${keys[i]} là trường bắt buộc`],
//               });
//               continue;
//             }
//           }

//           if (listEnum.find((e) => e.name === keys[i])) {
//             const column = listEnum.find((e) => e.name === keys[i]);
//             const value = column.menuItem.map((i) => i.code);
//             if (column.menuItem && !column.menuItem.find((el) => el.code == item[keys[i]])) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [`${column.title} giá trị không hợp lệ trong ${value}`],
//               });
//               continue;
//             }
//           }

//           if (listDate.includes(keys[i])) {
//             const date = item[keys[i]].substring(1);
//             if (!moment(`${date}`, 'YYYY/MM/DD', true).isValid()) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [`${item[keys[i]]} không hợp lệ`],
//               });
//               continue;
//             }
//           }
//           if (
//             !(keys[i] === 'uid' || keys[i] === 'createdBy' || keys[i] === 'organizationUnit' || keys[i] === 'parentId')
//           ) {
//             const convertValue = await convertToObjectId(modelName, keys[i], item[keys[i]]);
//             if (typeof convertValue === 'object' && convertValue.hasOwnProperty('status')) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [convertValue.message],
//               });
//               continue;
//             } else if (keys[i] !== 'bookDocumentId') {
//               item[keys[i]] = convertValue;
//             }
//           }
//         }

//         if (modelName === 'hrm') {
//           if (!data[i].email || !data[i].code || !data[i].name || !data[i].organizationUnit) {
//             checkWarning = false;
//             modelSaveds.push({
//               success: false,
//               errors: ['Thiếu trường bắt buộc'],
//             });
//             continue;
//           }
//           if (model) {
//             if (model.email !== item.email) {
//               const exists = await existsEmail(item.email);
//               if (exists) {
//                 checkWarning = false;
//                 modelSaveds.push({
//                   success: false,
//                   errors: [`${item.email} đã tồn tại`],
//                 });
//                 continue;
//               }
//             }
//           }
//           let foundRoleGroup;
//           if (item.role) {
//             foundRoleGroup = listRoleGroups.find((l) => l.code === item.role);
//             if (!foundRoleGroup) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [`Không tìm thấy nhóm quyền với Mã nhóm quyền = ${item.role}`],
//               });
//             } else {
//               item.role = { roleCode: foundRoleGroup.code, roleName: foundRoleGroup.name };
//             }
//           }
//         }

//         if (model && modelName !== 'IncommingDocument') {
//           if (modelName === 'hrm') {
//             if (item.portal) {
//               const newUser = {};
//               newUser.username = item.email;
//               newUser.code = item.code;
//               newUser.email = item.email;
//               newUser.name = item.name;
//               newUser.password = '12345678';
//               hrmService.requestCreate(newUser, item.organizationUnit, item.role.roleCode);
//             }
//           }

//           Object.keys(item).forEach((key) => {
//             model[key] = item[key];
//           });
//           modelSaveds.push({
//             success: true,
//             data: await model.save(),
//           });
//           continue;
//         }

//         if (Object.keys(Model().schema.paths).includes('code')) {
//           // if (!item.code && modelName !== 'Task' && modelName !== 'Documentary') {
//           //   checkWarning = false;
//           //   modelSaveds.push({
//           //     success: false,
//           //     errors: ['Thiếu trường code là trường bắt buộc'],
//           //   });
//           //   continue;
//           // }

//           if (!item.code && modelName !== 'hrm') {
//             checkWarning = false;
//             modelSaveds.push({
//               success: false,
//               errors: ['Thiếu trường code là trường bắt buộc'],
//             });
//             continue;
//           }

//           let arr = 0;
//           const arrEr = ['code', 'email', 'phoneNumber'];
//           const modelFind = await Model.findOne({ code: item.code, status: { $ne: STATUS.DELETED } });
//           let modelFindEmail = false;
//           let modelFindPhone = false;
//           if (modelName === 'Customer') {
//             modelFindEmail = await Model.findOne({ email: item.email, status: { $ne: STATUS.DELETED } });
//             //  console.log("FFF",modelFindEmail);

//             if (modelFindEmail) arr = 1;

//             modelFindPhone = await Model.findOne({ phoneNumber: item.phoneNumber, status: { $ne: STATUS.DELETED } });
//             //  console.log("FFEEEF",modelFindPhone);
//             if (modelFindPhone) arr = 2;
//           }

//           if (modelFind || modelFindEmail || modelFindPhone) {
//             checkWarning = false;
//             modelSaveds.push({
//               success: false,
//               errors: [`Đã tồn tại một bản ghi với ${arrEr[arr]} = ${item[arrEr[arr]]}`],
//             });
//             continue;
//           }

//           if (modelName === 'hrm' && item.portal) {
//             const newUser = {};
//             newUser.username = item.email;
//             newUser.code = item.code;
//             newUser.email = item.email;
//             newUser.name = item.name;
//             newUser.password = '12345678';
//             hrmService.requestCreate(newUser, item.organizationUnit, item.role.roleCode);
//           }

//           if (modelName === 'Task' && item.template) {
//             const templateData = await Template.findOne({ name: item.template, status: STATUS.ACTIVED });
//             if (!templateData) {
//               checkWarning = false;
//               modelSaveds.push({
//                 success: false,
//                 errors: [`Không tồn tại quy trình với tên = ${item.template}`],
//               });
//               continue;
//             }
//             item.template = templateData._id.toString();
//             let endDateCal = new Date();
//             const level = 0;
//             const treeData = templateData.treeData;
//             const newTree = JSON.parse(JSON.stringify(treeData));
//             const dt = 'DATA';
//             const joinChild = convertTree(newTree, item.startDate, dt, [], true);

//             for (let index = 0; index < newTree.length; index += 1) {
//               const element = newTree[index];
//               const start = new Date(endDateCal);
//               const end = new Date(element.endDate);
//               if (end - start > 0) endDateCal = element.endDate;
//             }
//             const kanban = joinChild.array
//               .filter((h) => h.parent === 'DATA')
//               .map((h) => ({ code: h.id, name: h.title }));

//             item.kanban = kanban;
//             item.endDate = endDateCal;
//             item.creatorStatus = user.typeEmp;
//             const newProject = await Model.create(item);
//             newProject.projectId = newProject._id;
//             newProject.save();
//             await addTaskNested({
//               treeData: newTree,
//               parentId: newProject._id,
//               projectId: newProject.projectId,
//               level: level + 1,
//               taskStatus: newProject.taskStatus,
//               user: req.user.user,
//               priority: newProject.priority,
//               organizationUnit: newProject.organizationUnit,
//               isObligatory: true,
//               userData: user,
//               code: newProject.code,
//               minIndex: 0,
//               taskManager: newProject.taskManager,
//               template: newProject.template,
//               inCharge: newProject.inCharge,
//             });
//             modelSaveds.push({
//               success: true,
//               data: newProject,
//             });
//           }

//           const saved = await Model.create(item); // new Model(item).save();
//           saved.originId = saved._id;
//           await saved.save();
//           modelSaveds.push({
//             success: true,
//             data: saved,
//           });
//         } else {
//           const saved = await Model.create(item); // new Model(item).save();
//           saved.originId = saved._id;
//           await saved.save();
//           modelSaveds.push({
//             success: true,
//             data: saved,
//           });
//         }
//       } catch (error) {
//         console.log('error', error.message);
//         checkWarning = false;
//         modelSaveds.push({
//           success: false,
//           errors: [error.message],
//         });
//       }
//     }
//     res.json({ success: checkWarning, data: modelSaveds });
//   } else {
//     // chỉ chỉnh sửa
//     const modelUpdated = await Promise.all(
//       data.map(async (item) => {
//         const model = await Model.findOne({ [filterUpdate]: item[filterUpdate], status: { $ne: STATUS.DELETED } });
//         const keys = Object.keys(item);
//         for (let i = 0; i < keys.length; i++) {
//           console.log(modelName, keys[i], item[keys[i]]);
//           if (listRequired.includes(keys[i])) {
//             if (item[keys[i]] === '' || item[keys[i]] === 'undefined' || item[keys[i]] === null) {
//               checkWarning = false;
//               return {
//                 success: false,
//                 errors: [`${keys[i]} là trường bắt buộc`],
//               };
//             }
//           }

//           if (listEnum.find((e) => e.name === keys[i])) {
//             const column = listEnum.find((e) => e.name === keys[i]);
//             const value = column.menuItem.map((i) => i.code);
//             if (column.menuItem && !column.menuItem.find((el) => el.code == item[keys[i]])) {
//               checkWarning = false;
//               return {
//                 success: false,
//                 errors: [`${column.title} giá trị không hợp lệ trong ${value}`],
//               };
//             }
//           }

//           if (listDate.includes(keys[i])) {
//             const date = item[keys[i]].substring(1);
//             if (!moment(`${date}`, 'YYYY/MM/DD', true).isValid()) {
//               checkWarning = false;
//               return {
//                 success: false,
//                 errors: [`${item[keys[i]]} không hợp lệ`],
//               };
//             }
//           }

//           const convertValue = await convertToObjectId(modelName, keys[i], item[keys[i]]);
//           // if (convertValue) {
//           //   item[keys[i]] = convertValue;
//           // }
//           if (convertValue && convertValue.status === false) {
//             checkWarning = false;
//             return {
//               success: false,
//               errors: [convertValue.message],
//             };
//           }
//           item[keys[i]] = convertValue;
//         }
//         if (model) {
//           // Object.keys(item).map(async (key) => {
//           for (const key of Object.keys(item)) {
//             model[key] = item[key];
//             if (isSourceEle(item[key])) {
//               const ModelRef = mongoose.models[Model.schema.paths[`${key}._id`].options.ref];
//               const sourceCodeUpdate = Model.schema.paths[`${key}._id`].options.sourceCode;
//               // console.log(sourceCodeUpdate);
//               if (sourceCodeUpdate) {
//                 const findItem = await ModelRef.findOne({ code: sourceCodeUpdate })
//                   .lean()
//                   .exec();
//                 // console.log('findItem', findItem);
//                 if (findItem) {
//                   const compareFind = findItem.data.find(
//                     (element) => element.title.toLowerCase() === item[key].title.toLowerCase(),
//                   );
//                   model[key] = compareFind;
//                   // console.log('compareFind', model[key]);
//                   if (!compareFind) {
//                     const createItemDataUpdate = await ModelRef.findOneAndUpdate(
//                       { code: sourceCodeUpdate },
//                       {
//                         $push: {
//                           data: {
//                             title: item[key].title,
//                             value: convertToSlug(item[key].title),
//                           },
//                         },
//                       },
//                       { new: true },
//                     )
//                       .lean()
//                       .exec();
//                     if (createItemDataUpdate) {
//                       const itemCreated = createItemDataUpdate.data.find(
//                         (element) =>
//                           element.title === item[key].title && element.value === convertToSlug(item[key].title),
//                       );
//                       // console.log(itemCreated);
//                       model[key] = itemCreated;
//                       console.log((model[key] = itemCreated));
//                     }
//                   }
//                   await model.save();
//                   if (modelName === 'hrm' && item.portal) {
//                     const newUser = {};
//                     newUser.username = item.email;
//                     newUser.code = item.code;
//                     newUser.email = item.email;
//                     newUser.name = item.name;
//                     newUser.password = '12345678';
//                     hrmService.requestCreate(newUser, item.organizationUnit);
//                   }
//                 }
//               }
//             }
//           }
//           // });
//           return {
//             success: true,
//             errors: '',
//           };
//         }
//         // console.log('model', model);
//         // if (model) {
//         //   return {
//         //     success: true,
//         //     errors: model.save(),
//         //   };
//         // }

//         checkWarning = false;
//         return {
//           success: false,
//           errors: [`Không tìm thấy với ${filterUpdate} = ${item[filterUpdate]}`],
//         };
//       }),
//     );
//     res.json({ success: checkWarning, data: modelUpdated });
//   }
// }
