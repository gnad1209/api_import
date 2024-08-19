const unzipper = require('unzipper');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');
const path = require('path');
const AdmZip = require('adm-zip');
const fs_extra = require('fs-extra');

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

/**
 * Đếm số trang của file pdf với đường dẫn
 * Cài thêm thư viện pdf-lib
 * Đã có thư viện fs
 * @param {Path} fullPath Đường dẫn thực tới file tương ứng model FileManager
 * @returns
 */
async function countPagePdf(fullPath) {
  try {
    const fileContents = await fsPromises.readFile(fullPath);
    const _PDFInstance = await PDFDocument.load(fileContents);
    const numberOfPages = _PDFInstance.getPages().length;
    return numberOfPages;
  } catch (error) {
    console.log('Lỗi khi đếm số trang pdf');
    throw error;
  }
}

/**
 * Function Import from outsource -- không cần quan tâm lắm đến hàm này vì nó sử dụng cho bên khác
 * @param {*} profileYear
 * @param {*} profileNumber
 * @returns
 */
function createSortIndex(profileYear, profileNumber) {
  profileYear = typeof profileYear === 'string' && profileYear ? profileYear : '0000';
  profileNumber = typeof profileNumber === 'string' ? profileNumber : '';
  if (isNaN(profileYear)) {
    return `1${profileYear}_${profileNumber.padStart(20, '0')}`;
  }
  const yearNo =
    '' + (9999 - (!isNaN(parseInt(profileYear.replace(/\D/g, ''))) ? parseInt(profileYear.replace(/\D/g, '')) : 9999));
  return `0${yearNo}_${profileNumber.padStart(20, '0')}`;
}

function deleteFolderAndContent(folderPath) {
  // Kiểm tra xem đường dẫn có tồn tại không
  if (!fs.existsSync(folderPath)) {
    return;
  }

  // Xóa tất cả các file bên trong thư mục
  function deleteFiles(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        // Nếu là thư mục, gọi đệ quy hàm để xóa nội dung bên trong
        deleteFiles(filePath);
      } else {
        // Nếu là file, xóa file
        fs.unlinkSync(filePath);
      }
    }
  }

  // Xóa tất cả các file bên trong thư mục
  deleteFiles(folderPath);

  // Xóa thư mục
  fs.rmdirSync(folderPath);
  console.log(`Đã xóa thư mục ${folderPath} và toàn bộ nội dung bên trong.`);
}

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

async function extractZipFile(zipFilePath, folderToSave, folderToSaveAttachment) {
  // Kiểm tra xem các thư mục đích đã tồn tại hay chưa, nếu chưa thì tạo
  await fs_extra.ensureDir(folderToSave);
  await fs_extra.ensureDir(folderToSaveAttachment);

  // Giải nén tệp zipFile
  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  zipEntries.forEach((entry) => {
    const entryName = entry.entryName;
    const filePath = path.resolve(folderToSave, entryName);

    if (entry.isDirectory) {
      // Nếu entry là một thư mục, thì tạo thư mục
      fs_extra.ensureDirSync(filePath);
    } else {
      // Nếu entry là một file, thì ghi file ra đĩa
      zip.extractEntryTo(entry, folderToSave, false, true);

      // Kiểm tra nếu file là file nén (attachment.zip) thì giải nén nó
      if (path.extname(entryName) === '.zip') {
        const attachmentZipPath = filePath;
        const attachmentZip = new AdmZip(attachmentZipPath);
        attachmentZip.extractAllTo(folderToSaveAttachment, true);
      }
    }
  });

  console.log('Giải nén hoàn thành!');
}

function readExcelDataAsArray(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return data;
  } catch (error) {
    console.error('Error reading Excel buffer:', error.message);
    return null;
  }
}

module.exports = {
  removeVietnameseTones,
  countPagePdf,
  existsPath,
  createSortIndex,
  deleteFolderAndContent,
  extractZipFile,
  readExcelDataAsArray,
};
