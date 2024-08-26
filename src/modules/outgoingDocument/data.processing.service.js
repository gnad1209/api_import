const Profile = require('./models/profile.model');
const Document = require('./models/document.model');
const fileManagerModel = require('./models/filemanager.model');
const FileModel = require('./models/file.model');
const BookModel = require('./models/book.model');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

class DataProcessingService {
  static async dataProcessing(data, folderPath, config = {}, uploadedUnzipToUnZipFile) {
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

      // const checkFolder = await existsPath(folderPath);
      // if (!checkFolder) {
      //   throw new Error('Thư mục xử lý không tồn tại');
      // }

      // bắt đầu xử lý

      for (const row of data) {
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
        const saveModelFilePath = path.join(__dirname, '..', '..', '..', 'uploads', defaultClientId, saveFilename);

        let profileFilter = {
          status: 1,
          // planId: defaultPlan,
          // planId: defaultPlan ? defaultPlan : mongoose.Types.ObjectId(defaultPlan),
          planId: new mongoose.Types.ObjectId(defaultPlan),
          $or: [{ profileTitle }, { profileTitle_en }],
          profileYear,
        };
        if (config.profileId) {
          profileFilter = {
            status: 1,
            _id: mongoose.Types.ObjectId.isValid(config.profileId)
              ? new mongoose.Types.ObjectId(config.profileId)
              : config.profileId,
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
          const pageNumber = 12;

          // const pageNumber = await countPagePdf(filenameToCopyPath);

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

        const fileMapping = {};

        // So sánh với các tên file đọc từ file excel văn bản với tên file đính kèm và liên kết id bản ghi của file đấy với bản ghi văn bản
        for (const element of uploadedUnzipToUnZipFile) {
          // Tách phần tên file ra khỏi phần mở rộng
          const fileNameWithoutExtension = element.name.split('.')[0];

          if (fileNameWithoutExtension == row.column15.split('.')[0]) {
            fileMapping.attachment_file1 = element._id;
          } else if (fileNameWithoutExtension == row.column16.split('.')[0]) {
            fileMapping.attachment_file2 = element._id;
          } else if (fileNameWithoutExtension == row.column17.split('.')[0]) {
            fileMapping.attachment_file3 = element._id;
          }
        }
        console.log('fileMapping', fileMapping);

        //tạo bản ghi văn bản mới từ file excel đọc được
        const bookToSave = new BookModel({
          toBook: row.column0 || 0,
          abstractNote: row.column1 || '',
          urgencyLevel: row.column2 || '',
          senderUnit: row.column3 || '',
          documentType: row.column4 || '',
          releaseDate: row.column5 || '',
          releaseNo: row.column6 || '',
          documentField: row.column7 || '',
          privateLevel: row.column8 || '',
          currentNote: row.column9 || '',
          incommingDocument: row.column10 || '',
          tasks: row.column11 || '',
          autoReleaseCheck: row.column12 || false,
          caSignCheck: row.column13 || false,
          currentRole: row.column14 || '',
          attachment_file1: fileMapping.attachment_file1,
          attachment_file2: fileMapping.attachment_file2,
          attachment_file3: fileMapping.attachment_file3,
          nextRole: row.column18 || '',
        });

        // Lưu bản ghi văn bản
        await bookToSave.save();

        // Cập nhật các bản ghi file với id của bản ghi văn bản
        await Promise.all(
          uploadedUnzipToUnZipFile.map(async (file) => {
            // Tìm bản ghi sách tương ứng dựa trên tên file và cập nhật
            if (
              file._id.equals(fileMapping.attachment_file1) ||
              file._id.equals(fileMapping.attachment_file2) ||
              file._id.equals(fileMapping.attachment_file3)
            ) {
              await FileModel.findByIdAndUpdate(file._id, { book: bookToSave._id });
            }
          }),
        );

        document.fileId = fileToSave._id;
        document.originalFileId = fileToSave._id;

        // console.log('Duong dan tai lieu da luu: ', fileToSave.fullPath);
        // console.log('document == document ', document);
        // console.log('bookToSave == bookToSave ', bookToSave);
        // console.log('uploadedUnzipToUnZipFile == uploadedUnzipToUnZipFile ', uploadedUnzipToUnZipFile);

        const saveResult = await Promise.all([fileToSave.save(), document.save(), profile.save()]);
        result.push(saveResult);
      }

      return result;
    } catch (error) {
      console.log('Lỗi khi xử lý dữ liệu');
      throw error;
    }
  }
}

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

module.exports = DataProcessingService;
