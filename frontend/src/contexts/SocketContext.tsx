"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    setSocketInstance(s);

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.connect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
