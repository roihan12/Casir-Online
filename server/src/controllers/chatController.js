const { ResponseError } = require("../error/responseError");
const ChatService = require("../services/chatService");
const GeminiService = require("../services/geminiService");
const DashboardService = require("../services/dashboardService"); // Assuming this exists with getDashboardData

class ChatController {
  
  /**
   * Mengambil daftar semua sesi chat user
   */
  static async getSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const sessions = await ChatService.getSessions(userId);
      
      res.status(200).json({
        status: "success",
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Membuat sesi chat baru
   */
  static async startSession(req, res, next) {
    try {
      const userId = req.user.id;
      const title = req.body.title || "New Chat";
      
      const session = await ChatService.createSession(userId, title);
      
      res.status(201).json({
        status: "success",
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengambil riwayat percakapan dari satu sesi
   */
  static async getHistory(req, res, next) {
    try {
      const sessionId = req.params.sessionId;
      const userId = req.user.id;

      const history = await ChatService.getSessionHistory(sessionId, userId);
      
      res.status(200).json({
        status: "success",
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menerima pertanyaan user dan mengembalikan jawaban dari AI
   */
  static async ask(req, res, next) {
    try {
      const { sessionId, question, cabangId } = req.body;
      const user = req.user;

      if (!sessionId || !question) {
        throw new ResponseError(400, "Session ID dan Question diperlukan.");
      }

      // 1. Dapatkan history obrolan sebelumnya
      const history = await ChatService.getSessionHistory(sessionId, user.id);

      // 2. Ambil konteks POS berjalan secara Realtime untuk Cabang yang diminta
      let posData = null;
      try {
          // You might need to cast req.user layout if dashboardService expects it
          posData = await DashboardService.getDashboardData(user, cabangId === "global" ? null : cabangId);

          console.log("POS Data:", JSON.stringify(posData, null, 2));


      } catch (err) {
          console.warn("Failed fetching POS Data Context:", err.message);
      }

      // 3. Lempar ke Gemini
      const geminiService = require("../services/geminiService");
      if (!geminiService.askPosAssistant) {
          throw new Error("Sistem Asisten AI belum diimplementasikan di GeminiService");
      }

      const answer = await geminiService.askPosAssistant(question, history, posData);

      // 4. Simpan ke database
      await ChatService.saveMessage(sessionId, "user", question);
      const aiMessage = await ChatService.saveMessage(sessionId, "ai", answer);

      // 5. Kembalikan Response
      res.status(200).json({
        status: "success",
        data: {
          answer: answer,
          messageId: aiMessage.id
        }
      });
    } catch (error) {
        console.error("Ask AI Error:", error);
        next(error);
    }
  }
}

module.exports = ChatController;
