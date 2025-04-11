import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import NoChatSelected from "../components/NoChatSelected";
import { useEffect } from "react";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { authUser, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex flex-col h-screen bg-base-200">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden pt-16">
        <div className="w-full max-w-6xl mx-auto flex h-full">
          <div className="bg-base-100 rounded-lg shadow-lg w-full h-full flex">
            {/* Sidebar */}
            <div className="w-1/4 border-r border-base-300 overflow-hidden">
              <Sidebar />
            </div>
            
            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? <Chat /> : <NoChatSelected />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;