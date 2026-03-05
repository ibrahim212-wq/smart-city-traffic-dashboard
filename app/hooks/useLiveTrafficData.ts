import { useState, useEffect } from "react";

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

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch("http://127.0.0.1:8000/api/live-traffic");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data: LiveTrafficData = await res.json();

        if (!mounted) return;

        setState({
          data,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || "Failed to fetch live traffic data",
        }));
      }
    };

    // Initial fetch
    fetchData();

    // 1-second polling interval
    const intervalId = setInterval(fetchData, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}
