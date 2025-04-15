import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { IoSend, IoImage, IoCheckmark, IoCheckmarkDone, IoSadOutline } from 'react-icons/io5';
import debounce from 'lodash/debounce';
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiSmile } from 'react-icons/bs';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const {
    messages,
    selectedUser,
    isMessagesLoading,
    sendMessage,
    getMessages,
    typingUsers
  } = useChatStore();
  const { authUser, socket, sendTypingStatus, onlineUsers } = useAuthStore();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const filePreviewUrl = image ? URL.createObjectURL(image) : null;

  const debouncedTypingStatus = useRef(
    debounce((isTyping) => {
      if (selectedUser?._id) {
        sendTypingStatus(selectedUser._id, isTyping);
      }
    }, 500)
  ).current;

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
    return () => {
      if (selectedUser?._id) {
        sendTypingStatus(selectedUser._id, false);
      }
    };
  }, [selectedUser?._id, getMessages, sendTypingStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      debouncedTypingStatus.cancel();
      if (selectedUser?._id) {
        sendTypingStatus(selectedUser._id, false);
      }
    };
  }, [debouncedTypingStatus, selectedUser, sendTypingStatus]);

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    if (newMessage.length > 0) {
      debouncedTypingStatus(true);
    } else {
      debouncedTypingStatus.cancel();
      if (selectedUser?._id) {
        sendTypingStatus(selectedUser._id, false);
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    messageInputRef.current.focus();
  };

  const handleSend = async () => {
    if ((!message && !image) || !selectedUser) return;
    try {
      const formData = new FormData();
      if (message) formData.append('text', message);
      if (image) formData.append('image', image);
  
      await sendMessage(selectedUser._id, formData);
      setMessage('');
      setImage(null);
      debouncedTypingStatus.cancel();
      if (selectedUser?._id) {
        sendTypingStatus(selectedUser._id, false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    setImage(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedUser) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IoSadOutline className="mx-auto text-4xl text-gray-400 mb-2" />
        <h3 className="text-xl font-medium">Select a chat</h3>
        <p className="text-gray-500">Choose a conversation from the sidebar</p>
      </div>
    </div>
  );

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

  const isUserTyping = selectedUser?._id ? typingUsers[selectedUser._id] || false : false;
  const isUserOnline = selectedUser?._id ? (onlineUsers?.has?.(selectedUser._id.toString()) || false) : false;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-300 bg-base-100 flex items-center gap-3">
        <div className="relative">
          <img 
            src={selectedUser.profilePic} 
            alt={selectedUser.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100 ${
            isUserOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {isUserOnline && (
              <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping"></span>
            )}
          </span>
        </div>
        <div>
          <h3 className="font-medium">{selectedUser.fullName}</h3>
          <p className={`text-xs ${
            isUserTyping ? 'text-primary animate-pulse' :
            isUserOnline ? 'text-green-500' : 'text-gray-500'
          }`}>
            {isUserTyping ? 'Typing...' : isUserOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-base-200/20">
        {isMessagesLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet 👋</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="divider text-xs text-gray-500">{date}</div>
              {dateMessages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-4 ${msg.senderId === authUser?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2 rounded-lg relative ${
                    msg.senderId === authUser?._id
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-300 text-base-content'
                  }`}>
                    {msg.isSending && (
                      <div className="absolute -top-2 -right-2">
                        <span className="loading loading-spinner loading-xs"></span>
                      </div>
                    )}
                    {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                    {msg.image && (
                      <img
                        src={msg.image}
                        className="mt-2 rounded-lg max-w-full max-h-60 object-contain cursor-pointer"
                        alt="Sent content"
                        onClick={() => window.open(msg.image, '_blank')}
                      />
                    )}
                    <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {msg.senderId === authUser?._id && (
                        <span className="ml-1">
                          {msg.isSending ? null : msg.readBy?.length > 0 ? (
                            <IoCheckmarkDone className="inline text-blue-400" />
                          ) : msg.delivered ? (
                            <IoCheckmarkDone className="inline" />
                          ) : (
                            <IoCheckmark className="inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}

        {isUserTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-base-300 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-base-300 bg-base-100 relative">
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-10">
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              width={300}
              height={350}
              searchDisabled
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
              theme="dark"
            />
          </div>
        )}
        
        {image && (
          <div className="mb-2 relative">
            <img
              src={filePreviewUrl}
              className="max-w-xs max-h-40 rounded-lg object-contain"
              alt="Preview"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 btn btn-circle btn-xs btn-error"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current.click()}
            className="btn btn-ghost btn-circle"
            aria-label="Attach image"
          >
            <IoImage size={20} />
          </button>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="btn btn-ghost btn-circle"
            aria-label="Add emoji"
          >
            <BsEmojiSmile size={20} />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 input input-bordered min-h-12 pt-2"
            rows={1}
            style={{ resize: 'none' }}
          />
          
          <button
            className="btn btn-primary btn-circle"
            onClick={handleSend}
            disabled={!message && !image}
            aria-label="Send message"
          >
            <IoSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;