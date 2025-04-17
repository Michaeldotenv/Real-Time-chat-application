checkout at https://chatzspace.onrender.com/#/

# Real-Time Chat Application 💬  


A full-stack chat app with **real-time messaging**, **typing indicators**, and **image sharing** powered by WebSockets and Cloudinary.

## ✨ Features  
- Instant messaging with Socket.io  
- Online status tracking  
- Typing indicators
- emojis for for expressions(emoji-picker-react)
- Image uploads (Cloudinary)  
- Read receipts & message delivery status  
- Responsive UI with animations  

## 🛠️ Tech Stack  
**Frontend**: React, Zustand, Tailwind CSS  
**Backend**: Node.js, Express, MongoDB  
**Real-Time**: Socket.io  
**Storage**: Cloudinary (images)  
**Auth**: JWT with HTTP-only cookies  

## 🚀 Quick Start  

### 1. Clone & Setup  
```bash
git clone https://github.com/Michaeldotenv/Real-Time-chat-application.git
cd chat-app

2. Configure Environment
Create .env files in both /client and /server using the .env.example templates.

3. Run Locally
Backend:

bash
Copy
cd server
npm install
npm start
Frontend:

bash
Copy
cd ../client
npm install
npm run dev
🌐 Deployment
Frontend: Hosted on GitHub Pages

bash
Copy
cd client
npm run deploy
Backend: Deploy to Render or Fly.io

Set environment variables

Enable WebSocket support

📂 Project Structure
Copy
chat-app/
├── client/          # React frontend
├── server/          # Node.js backend
├── .github/         # CI/CD workflows
└── README.md
🔧 Troubleshooting
Socket Connection Issues: Ensure CORS and WS/WSS URLs match your deployment

Image Uploads: Verify Cloudinary credentials in .env

📜 License
MIT © [Tubokeyi Micheal]

Copy

