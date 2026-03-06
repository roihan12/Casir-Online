const { Prisma } = require("@prisma/client");
const prisma = require("../config/db");

class ChatService {
  /**
   * Mendapatkan daftar sesi chat milik user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getSessions(userId) {
    // Karena kita tidak memakai Prisma schema model, gunakan raw SQL
    const sessions = await prisma.withRls(tx => tx.$queryRaw`
      SELECT id, title, created_at, updated_at 
      FROM chat_sessions 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `);
    
    return sessions;
  }

  /**
   * Mengambil riwayat percakapan dari satu sesi
   * @param {string} sessionId
   * @param {string} userId - untuk keamanan (memastikan user memiliki sesi ini)
   * @returns {Promise<Array>}
   */
  static async getSessionHistory(sessionId, userId) {
    // Verifikasi kepemilikan
    const sessionOwner = await prisma.withRls(tx => tx.$queryRaw`
        SELECT user_id FROM chat_sessions WHERE id = ${sessionId}::uuid
    `);

    if (!sessionOwner.length || sessionOwner[0].user_id !== userId) {
        throw new Error("Sesi chat tidak ditemukan atau tidak memiliki akses.");
    }

    const history = await prisma.withRls(tx => tx.$queryRaw`
      SELECT id, role, content, created_at 
      FROM chat_messages 
      WHERE session_id = ${sessionId}::uuid
      ORDER BY created_at ASC
    `);

    return history;
  }

  /**
   * Membuat sesi chat baru
   * @param {string} userId
   * @param {string} title
   * @returns {Promise<object>} session details
   */
  static async createSession(userId, title = "New Chat") {
    const newSession = await prisma.withRls(tx => tx.$queryRaw`
      INSERT INTO chat_sessions (user_id, title)
      VALUES (${userId}, ${title})
      RETURNING id, title, created_at, updated_at
    `);

    return newSession[0];
  }

  /**
   * Menyimpan pesan ke dalam sesi
   * @param {string} sessionId
   * @param {string} role ('user' | 'ai')
   * @param {string} content
   * @returns {Promise<object>} inserted message
   */
  static async saveMessage(sessionId, role, content) {
    // Pastikan session diperbarui `updated_at` nya
    await prisma.withRls(tx => tx.$queryRaw`
      UPDATE chat_sessions 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}::uuid
    `);

    const newMessage = await prisma.withRls(tx => tx.$queryRaw`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (${sessionId}::uuid, CAST(${role} AS chat_role), ${content})
      RETURNING id, role, content, created_at
    `);

    return newMessage[0];
  }
}

module.exports = ChatService;
