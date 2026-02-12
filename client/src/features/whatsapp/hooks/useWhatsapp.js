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

        const handleWhatsAppEvent = (event) => {
            console.log('WhatsApp event received:', event.type, event);

            // Handle different event types from webhook
            switch (event.type) {
                case 'message':
                    // New message received
                    const messageData = event.data || event.payload;
                    const messageChatId = messageData.chat_id;

                    // Normalize JID helper
                    const normalizeJid = (jid) => jid ? jid.replace('@s.whatsapp.net', '') : '';
                    const currentChatJid = normalizeJid(chatJid);
                    const incomingChatJid = normalizeJid(messageData.chat_id || messageData.key?.remoteJid);

                    // If the message belongs to current chat
                    if (currentChatJid && incomingChatJid === currentChatJid) {
                        console.log('Invalidating messages for chat:', chatJid);
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                    }
                    // Always update chat list (for last message preview & unread count)
                    queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });

                    // Show notification for messages from others (not from me)
                    if (messageData && !messageData.from_me && messageData.from) {
                        toast.success(`New message from ${messageData.from_name || messageData.from}`);
                    }
                    break;

                case 'ack':
                    // Message status update (delivered/read)
                    const ackData = event.data || event.payload;
                    const ackChatId = ackData.chat_id;

                    if (ackChatId === chatJid) {
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                    }
                    break;

                case 'reaction':
                    // Message reaction
                    const reactionData = event.data || event.payload;
                    const reactionChatId = reactionData.chat_id;

                    if (reactionChatId === chatJid) {
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                    }
                    break;

                case 'revoked':
                    // Message deleted
                    const revokedData = event.data || event.payload;
                    const revokedChatId = revokedData.chat_id;

                    if (revokedChatId === chatJid) {
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                    }
                    break;

                case 'edited':
                    // Message edited
                    const editedData = event.data || event.payload;
                    const editedChatId = editedData.chat_id;

                    if (editedChatId === chatJid) {
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                    }
                    break;

                case 'group_participants':
                    // Group participant changes
                    // Update chat list to reflect group changes
                    queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
                    break;

                default:
                    // Legacy/direct payload format (backward compatibility)
                    if (event.chat_id === chatJid || event.from === chatJid || event.to === chatJid) {
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", chatJid] });
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
                    }
                    break;
            }
        };

        socket.on('whatsapp_message', handleWhatsAppEvent);

        return () => {
            socket.off('whatsapp_message', handleWhatsAppEvent);
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
