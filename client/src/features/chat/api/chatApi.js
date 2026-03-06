import api from "@common/utils/api";

export const chatApi = {
  createSession: async (title = "New Chat") => {
    const response = await api.post("/chat/start", { title });
    return response.data;
  },
  
  getSessions: async () => {
    const response = await api.get("/chat/sessions");
    return response.data;
  },
  
  getHistory: async (sessionId) => {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  },
  
  askQuestion: async (data) => {
    const response = await api.post("/chat/ask", data);
    return response.data;
  }
};
