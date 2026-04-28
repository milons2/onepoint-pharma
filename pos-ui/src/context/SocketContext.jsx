import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use .env if available (cloud-ready), fallback to localhost
    const SOCKET_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3001";

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],   // Force WebSocket (Electron safe)
      upgrade: false,              // Disable transport upgrade
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 5000,
      autoConnect: false,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected to backend:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection retrying...");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);