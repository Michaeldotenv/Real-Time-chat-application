import { create } from "zustand";
import { AxiosInstance } from "../lib/Axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { useChatStore } from "./chatStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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
      const response = await AxiosInstance.get("/auth/check-auth");
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
      const response = await AxiosInstance.post("/auth/signup", formData);
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

  signin: async (credentials) => {
    try {
      set({ isLoggingIn: true });
      const response = await AxiosInstance.post("/auth/signin", credentials);
      set({ authUser: response.data.user });
      get().connectSocket(response.data.user._id);
      toast.success("Login successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signout: async () => {
    try {
      await AxiosInstance.post("/auth/signout");
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
      timeout: 10000
    });

    const setupSocketListeners = () => {
      // Connection Events
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

      // User Status Events
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

      // Typing Events
      newSocket.on("user-typing", ({ userId, isTyping }) => {
        useChatStore.getState().setUserTyping(userId, isTyping);
      });

      // Message Events
      newSocket.on("message-read-receipt", ({ messageId, readerId }) => {
        useChatStore.getState().updateMessageReadStatus(messageId, readerId);
      });

      newSocket.on("message-delivered-receipt", ({ messageId }) => {
        useChatStore.getState().updateMessageDeliveryStatus(messageId);
      });

      newSocket.on("receive-message", (message) => {
        const chatStore = useChatStore.getState();
        const { selectedUser, authUser } = get();

        // Send delivery receipt
        newSocket.emit("message-delivered", {
          messageId: message._id,
          senderId: message.senderId
        });

        if (selectedUser && message.senderId === selectedUser._id) {
          // Send read receipt if viewing chat
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