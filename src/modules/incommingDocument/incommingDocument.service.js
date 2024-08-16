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
const getDataFromExcelFile = async (file, check = false) => {
  try {
    // Đọc file Excel từ Buffer
    const workbook = XLSX.read(file, { type: 'buffer' });

    // Lấy danh sách các sheet trong file
    const sheetNames = workbook.SheetNames;

    // Chuyển đổi nội dung sheet đầu tiên thành JSON
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

    return sheetData; // Trả về dữ liệu dạng JSON
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error.message);
    return null;
  }
};

/**
 * Xử lý dữ liệu
 * @param {Array} data Mảng dữ liệu đọc từ excel
 * @param {*} folderPath đường dẫn tới folder chứa các file văn bản và file import
 * @param {*} config Cấu hình tùy chọn
 * @returns dữ liệu đã xử lý
 */
const dataProcessing = async (data, folderPath, config = {}) => {
  try {
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
