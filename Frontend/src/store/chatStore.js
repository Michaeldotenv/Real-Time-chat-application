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

  getUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AxiosInstance.get("/messages/users");
      const { onlineUsers } = useAuthStore.getState();
      
      set({ 
        users: response.data.map(user => ({
          ...user,
          status: onlineUsers.has(user._id.toString()) ? 'online' : 'offline'
        })) 
      });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, error: null });
    try {
      const response = await AxiosInstance.get(`/messages/${userId}`);
      
      set(state => ({
        messages: response.data,
        unreadCounts: {
          ...state.unreadCounts,
          [userId]: 0
        }
      }));
      
      const { socket, authUser } = useAuthStore.getState();
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
      set({ error: error.response?.data?.message || error.message });
      throw error;
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  
  sendMessage: async (receiverId, formData) => {
    let tempId;
    try {
      const { socket } = useAuthStore.getState();
      if (!socket) throw new Error("Not connected to socket");
  
      tempId = Date.now().toString();
      const tempMessage = {
        _id: tempId,
        senderId: useAuthStore.getState().authUser._id,
        receiverId,
        text: formData.get('text') || null,
        image: formData.get('image') ? URL.createObjectURL(formData.get('image')) : null,
        createdAt: new Date(),
        isSending: true,
        delivered: false,
        readBy: []
      };
  
      set(state => ({ messages: [...state.messages, tempMessage] }));
      useAuthStore.getState().sendTypingStatus(receiverId, false);
  
      const response = await AxiosInstance.post(
        `/messages/send/${receiverId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
  
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? { ...response.data, isSending: false } : msg
        )
      }));
  
      return response.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== tempId)
      }));
      throw error;
    }
  },

  addReceivedMessage: (message) => {
    set(state => {
      if (state.messages.some(m => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
  },
  
  addUnreadMessage: (senderId) => {
    set(state => ({
      unreadCounts: {
        ...state.unreadCounts,
        [senderId]: (state.unreadCounts[senderId] || 0) + 1
      }
    }));
  },

  updateMessageReadStatus: (messageId, readerId) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg._id === messageId 
          ? { 
              ...msg, 
              readBy: [...(msg.readBy || []), readerId],
              read: true
            } 
          : msg
      )
    }));
  },

  updateMessageDeliveryStatus: (messageId) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, delivered: true, isSending: false } 
          : msg
      )
    }));
  },

  setUserTyping: (userId, isTyping) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping
      }
    }));
  },

  setSelectedUser: (selectedUser) => {
    set(state => ({
      selectedUser,
      unreadCounts: {
        ...state.unreadCounts,
        [selectedUser._id]: 0
      }
    }));
  },

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
  }
}));