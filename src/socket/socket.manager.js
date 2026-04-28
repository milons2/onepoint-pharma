const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { 
      origin: "*", 
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket"] // Match the client-side transport
  });

  io.on("connection", (socket) => {
    console.log("Live Ticker Connected:", socket.id);
    
    // Send a welcome tip immediately upon connection
    socket.emit("NEWS_TICKER", {
      type: "TIP",
      text: "পর্যাপ্ত স্টক বজায় রাখুন: প্যারাসিটামল ও গ্যাস্ট্রিকের ওষুধের চাহিদা এখন তুঙ্গে।",
      time: new Date().toLocaleTimeString()
    });
  });

  return io;
};

// Function to broadcast a New Sale
const broadcastSale = (amount) => {
  if (io) {
    const now = new Date();
    io.emit("NEWS_TICKER", {
      type: "SALE",
      text: `নতুন বিক্রি সম্পন্ন: ৳${amount}`,
      time: now.toLocaleTimeString('bn-BD'),
      rawTime: now.toISOString()
    });
  }
};

// Function to broadcast Pharma Tips
const broadcastTip = (tipEn, tipBn) => {
  if (io) {
    io.emit("NEWS_TICKER", {
      type: "TIP",
      text: `${tipBn} | Pro Tip: ${tipEn}`,
      time: new Date().toLocaleTimeString()
    });
  }
};

module.exports = { initSocket, broadcastSale, broadcastTip };