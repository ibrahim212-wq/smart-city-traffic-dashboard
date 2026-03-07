import { useState, useEffect, useRef, useCallback } from "react";

export interface WsTrafficData {
  step: number;
  total_vehicles: number;
  traffic_light_id: string;
  current_phase: number;
}

export type WsConnectionStatus = "connecting" | "connected" | "disconnected";

export interface WsTrafficState {
  data: WsTrafficData | null;
  status: WsConnectionStatus;
}

export function useWebSocketTraffic(): WsTrafficState {
  const [data, setData] = useState<WsTrafficData | null>(null);
  const [status, setStatus] = useState<WsConnectionStatus>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    setStatus("connecting");

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/traffic");
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const parsed: WsTrafficData = JSON.parse(event.data as string);
        setData(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional teardown
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { data, status };
}
