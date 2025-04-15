import { create } from "zustand";
import { AxiosInstance } from "../lib/Axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { useChatStore } from "./chatStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Changed port to 5000 to match server

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: new Set(),

  // Auth Methods
  checkAuth: async () => {
    try {
      const response = await AxiosInstance.get("/auth/check-auth", {
        withCredentials: true
      });
      set({ authUser: response.data });
      get().connectSocket(response.data._id);
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (formData) => {
    try {
      set({ isSigningUp: true });
      const response = await AxiosInstance.post("/auth/signup", formData, {
        withCredentials: true
      });
      set({ authUser: response.data });
      get().connectSocket(response.data._id);
      toast.success("Account created!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

// In authStore.js - update the signin method
signin: async (credentials) => {
  try {
    set({ isLoggingIn: true });
    const response = await AxiosInstance.post("auth/signin", credentials, {
      withCredentials: true
    });
    
    // Ensure we're getting the expected response structure
    if (response.data && response.data.user) {
      set({ authUser: response.data.user });
      get().connectSocket(response.data.user._id);
      toast.success("Login successful!");
      return true;
    } else {
      throw new Error("Invalid response structure");
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error(error.response?.data?.message || "Login failed");
    return false;
  } finally {
    set({ isLoggingIn: false, isCheckingAuth: false }); // Ensure checking state is reset
  }
},
  signout: async () => {
    try {
      await AxiosInstance.post("auth/signout", {}, {
        withCredentials: true
      });
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: new Set() });
      toast.success("Logged out!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
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
      path: "/socket.io",
      secure: process.env.NODE_ENV === "production",
    });

    const setupSocketListeners = () => {
      newSocket.on("connect", () => {
        console.log("Socket connected");
        newSocket.emit("register-user", userId);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection error. Trying to reconnect...");
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

          chatStore.addReceivedMessage({
            ...message,
            read: true
          });
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
  }
}));