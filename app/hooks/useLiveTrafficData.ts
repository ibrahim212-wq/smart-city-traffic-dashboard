import { useState, useEffect, useRef } from "react";

export interface LiveTrafficData {
  step: number;
  total_vehicles: number;
  traffic_light_id: string;
  current_phase: number;
}

export interface LiveTrafficState {
  data: LiveTrafficData | null;
  isLoading: boolean;
  error: string | null;
}

export function useLiveTrafficData(): LiveTrafficState {
  const [state, setState] = useState<LiveTrafficState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const mountedRef = useRef(true);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialLoadRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!mountedRef.current) return;

      try {
        const res = await fetch("http://127.0.0.1:8000/api/live-traffic");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data: LiveTrafficData = await res.json();

        if (!mountedRef.current) return;

        // Clear any existing error timeout
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }

        setState(prev => ({
          ...prev,
          data,
          isLoading: false,
          error: null,
        }));

        // Mark initial load as complete
        hasInitialLoadRef.current = true;

      } catch (err: any) {
        if (!mountedRef.current) return;
        
        // Only show error if it's not the initial load timeout
        if (hasInitialLoadRef.current) {
          setState(prev => ({
            ...prev,
            error: err.message || "Failed to fetch live traffic data",
          }));

          // Clear error after 3 seconds if connection is restored
          errorTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setState(prev => ({ ...prev, error: null }));
            }
          }, 3000);
        } else {
          // For initial load failure, just set loading to false
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err.message || "Failed to fetch live traffic data",
          }));
          hasInitialLoadRef.current = true;
        }
      }
    };

    // Initial fetch
    fetchData();

    // 1-second polling interval (only after initial load)
    const intervalId = setInterval(() => {
      if (hasInitialLoadRef.current) {
        fetchData();
      }
    }, 1000);

    return () => {
      mountedRef.current = false;
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      clearInterval(intervalId);
    };
  }, []);

  return state;
}
