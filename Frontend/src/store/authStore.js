import { create } from "zustand";
import { AxiosInstance } from "../lib/Axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { useChatStore } from "./chatStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: new Set(),
  error: null,

  // Auth Methods
  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true, error: null });
      const response = await AxiosInstance.get("/auth/check-auth", {
        withCredentials: true
      });
      set({ 
        authUser: response.data,
        isCheckingAuth: false
      });
      get().connectSocket(response.data._id);
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      set({ 
        authUser: null,
        isCheckingAuth: false,
        error: error.response?.data?.message || "Session expired"
      });
      return false;
    }
  },

  signup: async (formData) => {
    try {
      set({ isSigningUp: true, error: null });
      const response = await AxiosInstance.post("/auth/signup", formData, {
        withCredentials: true
      });
      set({ 
        authUser: response.data,
        isSigningUp: false
      });
      get().connectSocket(response.data._id);
      toast.success("Account created!");
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      set({
        isSigningUp: false,
        error: error.response?.data?.message || "Signup failed"
      });
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    }
  },

  signin: async (credentials) => {
    try {
      set({ isLoggingIn: true, error: null });
      const response = await AxiosInstance.post("/auth/signin", credentials, {
        withCredentials: true
      });
      set({ 
        authUser: response.data.user,
        isLoggingIn: false
      });
      get().connectSocket(response.data.user._id);
      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      set({
        isLoggingIn: false,
        error: error.response?.data?.message || "Login failed"
      });
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  },

  signout: async () => {
    try {
      set({ error: null });
      await AxiosInstance.post("/auth/signout", {}, {
        withCredentials: true
      });
      get().disconnectSocket();
      set({ 
        authUser: null, 
        onlineUsers: new Set() 
      });
      toast.success("Logged out!");
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      set({
        error: error.response?.data?.message || "Logout failed"
      });
      // Force clear auth state even if logout fails
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: new Set() });
      return false;
    }
  },

  // Socket Methods
  connectSocket: (userId) => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["websocket"],
      path: '/socket.io'  // Force WebSocket transport
    });

    const setupSocketListeners = () => {
      newSocket.on("connect", () => {
        console.log("Socket connected");
        newSocket.emit("register-user", userId);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        if (err.message.includes("401")) {
          // Handle unauthorized errors
          set({ authUser: null });
          toast.error("Session expired. Please login again.");
        }
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          newSocket.connect();
        }
      });

      newSocket.on("user-online", (userId) => {
        set(state => ({
          onlineUsers: new Set([...state.onlineUsers, userId])
        }));
        useChatStore.getState().setUserOnline(userId);
      });

      newSocket.on("user-offline", (userId) => {
        set(state => {
          const newOnlineUsers = new Set(state.onlineUsers);
          newOnlineUsers.delete(userId);
          return { onlineUsers: newOnlineUsers };
        });
        useChatStore.getState().setUserOffline(userId);
      });

      newSocket.on("user-typing", ({ userId, isTyping }) => {
        useChatStore.getState().setUserTyping(userId, isTyping);
      });

      newSocket.on("message-read-receipt", ({ messageId, readerId }) => {
        useChatStore.getState().updateMessageReadStatus(messageId, readerId);
      });

      newSocket.on("message-delivered-receipt", ({ messageId }) => {
        useChatStore.getState().updateMessageDeliveryStatus(messageId);
      });

      newSocket.on("receive-message", (message) => {
        const chatStore = useChatStore.getState();
        const { selectedUser, authUser } = get();

        newSocket.emit("message-delivered", {
          messageId: message._id,
          senderId: message.senderId
        });

        if (selectedUser && message.senderId === selectedUser._id) {
          newSocket.emit("message-read", {
            messageId: message._id,
            readerId: authUser._id,
            senderId: message.senderId
          });
          chatStore.addReceivedMessage({ ...message, read: true });
        } else {
          chatStore.addReceivedMessage(message);
          chatStore.addUnreadMessage(message.senderId);
        }
      });
    };

    setupSocketListeners();
    set({ socket: newSocket });

    return () => {
      newSocket.off();
    };
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.off();
      socket.disconnect();
      set({ socket: null, onlineUsers: new Set() });
    }
  },

  sendTypingStatus: (receiverId, isTyping) => {
    const { socket, authUser } = get();
    if (!socket || !authUser) return;

    const event = isTyping ? "typing-started" : "typing-stopped";
    socket.emit(event, {
      senderId: authUser._id,
      receiverId
    });
  },

  clearError: () => set({ error: null })
}));