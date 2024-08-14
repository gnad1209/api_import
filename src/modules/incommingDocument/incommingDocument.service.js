const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const CLIENT_KHOLS = 'DHVB';
const File = require('./incommingDocument.model');
const Profile = require('../../models/profile.model');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
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
    console.log('compressedFilePath', compressedFilePath);

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
    await unzipFile(compressedFilePath, folderToSave);
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
    const fileUrl = 'https://administrator.lifetek.vn:233/api/files/66bc544d181ca41279b2adf9'; // dùng tạm
    if (check) {
      const fileCheck = await File.findById(file._id);
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

      const filenameToCopyPath = path.join(folderPath, initFilename);
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
        const pageNumber = await countPagePdf(filenameToCopyPath);
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

      const fileToSave = new fileManagerModel({
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

      saveResult = await Promise.all([await fileToSave.save(), await document.save(), await profile.save()]);
      result.push(saveResult);
      // xóa folder tiết kiệm bộ nhớ sau khi sử dụng. File zip và file excel còn tồn tại bên file, file sử udnjg đã có trong upload và sử dụng được
    }
    await deleteFolderAndContent(folderPath);
    console.log('Xóa đường dẫn: ', folderPath);
    return result;
  } catch (error) {
    console.log('Lỗi khi xử lý dữ liệu');
    throw error;
  }
};

/**
 * Kiểm tra xem đường dẫn có tồn tại hay không
 * @param {string} pathToCheck - Đường dẫn cần kiểm tra
 * @returns {boolean} - True nếu đường dẫn tồn tại, False nếu không tồn tại
 */
function existsPath(pathToCheck) {
  try {
    // Sử dụng fs.statSync để kiểm tra xem đường dẫn có tồn tại không
    const stats = fs.statSync(pathToCheck);
    return true; // Trả về true nếu đường dẫn tồn tại
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false; // Trả về false nếu đường dẫn không tồn tại
    } else {
      throw err; // Ném ra lỗi khác nếu có
    }
  }
}

function unzipFile(compressedFilePath, folderToSave) {}

function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return str;
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  // Bỏ các khoảng trắng liền nhau
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  // Remove punctuations
  // Bỏ dấu câu, kí tự đặc biệt
  // str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  return str.toLowerCase();
}

async function countPagePdf(file) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(file);
    // Get the number of pages
    const numPages = await pdfDoc.getPageCount();
    return numPages;
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    throw error;
  }
}

function createSortIndex(profileYear, profileIndex) {
  const sortIndex = profileYear * 10000 + profileIndex;
  return sortIndex;
}

module.exports = { createFolderAndSaveFilesV2, getDataFromExcelFile, dataProcessing };
