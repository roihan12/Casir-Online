import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";

export const useChat = (sessionId) => {
  const queryClient = useQueryClient();

  const getSessionsQuery = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => chatApi.getSessions(),
  });

  const getHistoryQuery = useQuery({
    queryKey: ["chat-history", sessionId],
    queryFn: () => chatApi.getHistory(sessionId),
    enabled: !!sessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title) => chatApi.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries(["chat-sessions"]);
    },
  });

  const askMutation = useMutation({
    mutationFn: (data) => chatApi.askQuestion(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["chat-history", variables.sessionId]);
    },
  });

  return {
    sessions: getSessionsQuery.data?.data || [],
    isLoadingSessions: getSessionsQuery.isLoading,
    
    history: getHistoryQuery.data?.data || [],
    isLoadingHistory: getHistoryQuery.isLoading,
    
    createSession: createSessionMutation.mutateAsync,
    isCreatingSession: createSessionMutation.isPending,
    
    askQuestion: askMutation.mutateAsync,
    isAsking: askMutation.isPending,
  };
};
