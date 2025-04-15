import { create } from "zustand";
import { AxiosInstance } from "../lib/Axios.js";
import { useAuthStore } from "./authStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  loading: false,
  isMessagesLoading: false,
  typingUsers: {},
  unreadCounts: {},
  error: null,

  // Fetch all chat users
  getUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AxiosInstance.get("/messages/users");
      const { onlineUsers } = useAuthStore.getState();

      set({
        users: response.data.map(user => ({
          ...user,
          status: onlineUsers.has(user._id.toString()) ? 'online' : 'offline'
        })),
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || "Failed to fetch users",
        loading: false 
      });
      throw error;
    }
  },

  // Fetch messages for a specific user
  getMessages: async (userId) => {
    if (!userId) return;
    
    set({ isMessagesLoading: true, error: null });
    try {
      const response = await AxiosInstance.get(`/messages/${userId}`);
      const { socket, authUser } = useAuthStore.getState();

      set({
        messages: response.data,
        unreadCounts: {
          ...get().unreadCounts,
          [userId]: 0
        },
        isMessagesLoading: false
      });

      // Mark messages as read
      if (socket && authUser) {
        const unreadMessages = response.data.filter(
          msg => msg.senderId === userId && !msg.readBy?.includes(authUser._id)
        );

        unreadMessages.forEach(msg => {
          socket.emit("message-read", {
            messageId: msg._id,
            readerId: authUser._id,
            senderId: msg.senderId
          });
        });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || "Failed to fetch messages",
        isMessagesLoading: false 
      });
      throw error;
    }
  },

  // Send a new message
  sendMessage: async (receiverId, formData) => {
    if (!receiverId) throw new Error("Receiver ID is required");
    
    const { socket, authUser } = useAuthStore.getState();
    if (!socket) throw new Error("Socket connection not available");
    if (!authUser) throw new Error("Not authenticated");

    const tempId = Date.now().toString();
    try {
      // Create optimistic message
      const tempMessage = {
        _id: tempId,
        senderId: authUser._id,
        receiverId,
        text: formData.get('text') || null,
        image: formData.get('image') 
          ? URL.createObjectURL(formData.get('image')) 
          : null,
        createdAt: new Date(),
        isSending: true,
        delivered: false,
        readBy: []
      };

      set(state => ({ 
        messages: [...state.messages, tempMessage],
        typingUsers: {
          ...state.typingUsers,
          [receiverId]: false
        }
      }));

      // Send actual message
      const response = await AxiosInstance.post(
        `/messages/send/${receiverId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      // Replace temp message with actual message
      set(state => ({
        messages: state.messages.map(msg =>
          msg._id === tempId ? { ...response.data, isSending: false } : msg
        )
      }));

      return response.data;
    } catch (error) {
      // Remove temp message on error
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== tempId)
      }));
      throw error;
    }
  },

  // Add a received message
  addReceivedMessage: (message) => {
    set(state => {
      if (state.messages.some(m => m._id === message._id)) return state;
      return { 
        messages: [...state.messages, message],
        unreadCounts: {
          ...state.unreadCounts,
          [message.senderId]: (state.unreadCounts[message.senderId] || 0) + 
            (message.senderId !== state.selectedUser?._id ? 1 : 0)
        }
      };
    });
  },

  // Update message read status
  updateMessageReadStatus: (messageId, readerId) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg._id === messageId
          ? {
              ...msg,
              readBy: [...new Set([...(msg.readBy || []), readerId])],
              read: true
            }
          : msg
      )
    }));
  },

  // Update message delivery status
  updateMessageDeliveryStatus: (messageId) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg._id === messageId
          ? { ...msg, delivered: true, isSending: false }
          : msg
      )
    }));
  },

  // Set user typing status
  setUserTyping: (userId, isTyping) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping
      }
    }));
  },

  // Select a user to chat with
  setSelectedUser: (user) => {
    if (!user) return;
    
    set({
      selectedUser: user,
      unreadCounts: {
        ...get().unreadCounts,
        [user._id]: 0
      }
    });
  },

  // Set user online status
  setUserOnline: (userId) => {
    set(state => ({
      users: state.users.map(user =>
        user._id === userId ? { ...user, status: 'online' } : user
      ),
      selectedUser: state.selectedUser?._id === userId
        ? { ...state.selectedUser, status: 'online' }
        : state.selectedUser
    }));
  },

  // Set user offline status
  setUserOffline: (userId) => {
    set(state => ({
      users: state.users.map(user =>
        user._id === userId ? { ...user, status: 'offline' } : user
      ),
      selectedUser: state.selectedUser?._id === userId
        ? { ...state.selectedUser, status: 'offline' }
        : state.selectedUser,
      typingUsers: {
        ...state.typingUsers,
        [userId]: false
      }
    }));
  },

  // Clear chat state
  clearChat: () => {
    set({
      messages: [],
      selectedUser: null,
      typingUsers: {},
      unreadCounts: {}
    });
  }
}));