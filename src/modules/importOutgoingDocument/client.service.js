const Client = require('../models/client.model');

class ClientService {
  /**
   * Kiểm tra dung lượng lưu trữ của client.
   * @param {string} clientId - Mã định danh của client.
   * @param {number} requiredStorage - Dung lượng lưu trữ yêu cầu.
   */
  static async checkStorageCapacity(clientId, requiredStorage) {
    const client = await Client.findOne({ clientId });
    if (client) {
      if (client.storageCapacity) {
        const remainingStorage = client.storageCapacity - client.usedStorage;
        if (remainingStorage < requiredStorage) {
          return { success: false, message: 'Dung lượng còn lại không đủ' };
        }
      }
      client.usedStorage += requiredStorage;
      await client.save();
      return { success: true };
    }
    return { success: false, message: 'Client not found' };
  }
}

module.exports = ClientService;
