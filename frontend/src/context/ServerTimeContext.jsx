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
        setNowDate(new Date(Date.now() + offset));
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

  // Formatted strings directly based on server date in Indian Standard Time (IST)
  const timeString12h = nowDate.toLocaleTimeString('en-US', { 
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  const dateStringFormatted = nowDate.toLocaleDateString('en-US', { 
    timeZone: 'Asia/Kolkata',
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Calculate IST Month and Year
  const serverMonth = parseInt(nowDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric' }), 10);
  const serverYear = parseInt(nowDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' }), 10);

  return (
    <ServerTimeContext.Provider value={{
      serverDate: nowDate,
      getServerDate,
      serverMonth,
      serverYear,
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
    const fallbackMonth = parseInt(now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric' }), 10);
    const fallbackYear = parseInt(now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' }), 10);
    return {
      serverDate: now,
      getServerDate: () => new Date(),
      serverMonth: fallbackMonth,
      serverYear: fallbackYear,
      serverOffset: 0,
      isSynced: false,
      timeString12h: now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      dateStringFormatted: now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      syncServerTime: () => {}
    };
  }
  return context;
}
