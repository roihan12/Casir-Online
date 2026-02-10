import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import whatsappService from "../services/whatsappService";
import socket from "@common/services/socketService";
import { useEffect } from "react";
import toast from "react-hot-toast";

// Hook for fetching all chats
export const useWhatsappChats = (params = {}) => {
  return useQuery({
    queryKey: ["whatsapp-chats", params],
    queryFn: () => whatsappService.getAllChats(params),
    staleTime: 60 * 1000, 
  });
};

// Hook for fetching messages for a specific chat
export const useWhatsappMessages = (chatJid, params = {}) => {
    const queryClient = useQueryClient();

    // Setup socket listener for real-time updates
    useEffect(() => {
        if (!chatJid) return;

        const handleNewMessage = (data) => {
            console.log('New WhatsApp message received:', data);
            
            // Optimistically update or invalidate query
            // If the message belongs to current chat
            if (data.chatJid === chatJid || data.from === chatJid || data.to === chatJid) {
                 queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                 queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] }); // Update last message in list
            }
        };

        socket.on('whatsapp_message', handleNewMessage);

        return () => {
            socket.off('whatsapp_message', handleNewMessage);
        };
    }, [chatJid, queryClient]);

  return useQuery({
    queryKey: ["whatsapp-messages", chatJid, params],
    queryFn: () => whatsappService.getChatMessages(chatJid, params),
    enabled: !!chatJid,
    select: (response) => {
        // Handle response structure wrapper
        const messages = response?.results?.data || response?.data || [];
        return messages.map((msg) => ({
          id: msg.id,
          text: msg.content || msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Media Message',
          sender: msg.fromMe ? 'me' : 'other',
          time: new Date(msg.messageTimestamp * 1000 || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: msg.messageTimestamp * 1000 || msg.timestamp,
          status: msg.status || 'sent',
          ...msg
        })).reverse();
      }
  });
};

// Hook for sending messages
export const useWhatsappSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatJid, message }) => whatsappService.sendMessage(null, { phone: chatJid.replace('@s.whatsapp.net', ''), message }),
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", variables.chatJid] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    }
  });
};

// Hook for checking connection status
export const useWhatsappStatus = () => {
    return useQuery({
        queryKey: ["whatsapp-status"],
        queryFn: () => whatsappService.getBotStatus(),
        refetchInterval: 10000 // Check every 10 seconds
    });
};
