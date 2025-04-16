import { create } from "zustand";
import { AxiosInstance } from "../lib/Axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { useChatStore } from "./chatStore";

const BASE_URL = import.meta.env.VITE_API_URL || "https://chatspacev2.onrender.com";

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
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.data) {
        set({ authUser: response.data });
        get().connectSocket(response.data._id);
        return true;
      }
      throw new Error("No user data");
    } catch (error) {
      console.error("Auth check failed:", error);
      set({ authUser: null, error: error.message || "Authentication failed" });
      localStorage.removeItem('token');
      return false;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (formData) => {
    try {
      set({ isSigningUp: true, error: null });
      const response = await AxiosInstance.post("/auth/signup", formData, {
        withCredentials: true
      });
      
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      } else if (response.data?._id) {
        // If no token in response but user created, still works with cookies
        toast.success("Account created!");
        set({ authUser: response.data });
        get().connectSocket(response.data._id);
        return true;
      }
      
      toast.success("Account created!");
      set({ authUser: response.data });
      get().connectSocket(response.data._id);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      set({ error: error.response?.data?.message || error.message || "Signup failed" });
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  signin: async (credentials) => {
    try {
      set({ isLoggingIn: true, error: null });
      const response = await AxiosInstance.post("/auth/signin", credentials, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data?.user) {
        throw new Error("Invalid response format");
      }

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      set({ authUser: response.data.user });
      
      // Connect socket after setting auth user
      await get().connectSocket(response.data.user._id);
      
      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      set({ error: error.response?.data?.message || error.message || "Login failed" });
      localStorage.removeItem('token');
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signout: async () => {
    try {
      await AxiosInstance.post("/auth/signout", {}, {
        withCredentials: true
      });
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: new Set() });
      localStorage.removeItem('token');
      toast.success("Logged out!");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      set({ error: error.message });
      toast.error(error.response?.data?.message || "Logout failed");
      return false;
    }
  },

  // Socket Methods
  connectSocket: (userId) => {
    return new Promise((resolve) => {
      const { socket } = get();
      
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
      }

      const token = localStorage.getItem('token');
      console.log("Token for socket connection:", token ? "Found" : "Not found");
      
      // Simple fallback solution - use a dummy token if none exists
      // This way socket will at least try to connect and cookies might work
      const socketToken = token || "fallback-auth";

      const newSocket = io(BASE_URL, {
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: "/socket.io",
        auth: { token: socketToken },
        transports: ['websocket', 'polling']
      });

      const setupSocketListeners = () => {
        newSocket.on("connect", () => {
          console.log("Socket connected");
          newSocket.emit("register-user", userId);
          resolve(true);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
          // Try again with polling if websocket fails
          if (newSocket.io.opts.transports[0] === 'websocket') {
            console.log("Falling back to polling transport");
            newSocket.io.opts.transports = ['polling', 'websocket'];
            setTimeout(() => newSocket.connect(), 1000);
          }
          resolve(false);
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
      newSocket.connect();
      set({ socket: newSocket });
    });
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