import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getServerTime } from '../services/api';

const ServerTimeContext = createContext(null);

export function ServerTimeProvider({ children }) {
  const [serverOffset, setServerOffset] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [nowDate, setNowDate] = useState(new Date());

  const offsetRef = useRef(0);

  // Synchronize clock offset with Linux Server
  const syncServerTime = async () => {
    try {
      const startTime = Date.now();
      const res = await getServerTime();
      if (res && res.timestamp) {
        const endTime = Date.now();
        const latency = Math.round((endTime - startTime) / 2);
        // Calculate offset: serverTime - clientNow
        const offset = (res.timestamp + latency) - Date.now();
        offsetRef.current = offset;
        setServerOffset(offset);
        setIsSynced(true);
      }
    } catch (err) {
      console.warn('[ServerTime] Sync failed, falling back to local clock until reconnected:', err);
    }
  };

  useEffect(() => {
    syncServerTime();
    // Re-sync with server every 30 seconds to maintain exact clock alignment
    const syncInterval = setInterval(syncServerTime, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  // Update local ticker every 1000ms using the computed server offset
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date(Date.now() + offsetRef.current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper method: Get current Date object synchronized to server
  const getServerDate = () => {
    return new Date(Date.now() + offsetRef.current);
  };

  // Formatted strings directly based on server date
  const timeString12h = nowDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  const dateStringFormatted = nowDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <ServerTimeContext.Provider value={{
      serverDate: nowDate,
      getServerDate,
      serverOffset,
      isSynced,
      timeString12h,
      dateStringFormatted,
      syncServerTime
    }}>
      {children}
    </ServerTimeContext.Provider>
  );
}

export function useServerTime() {
  const context = useContext(ServerTimeContext);
  if (!context) {
    // Return a safe fallback if used outside Provider
    const now = new Date();
    return {
      serverDate: now,
      getServerDate: () => new Date(),
      serverOffset: 0,
      isSynced: false,
      timeString12h: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      dateStringFormatted: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      syncServerTime: () => {}
    };
  }
  return context;
}
