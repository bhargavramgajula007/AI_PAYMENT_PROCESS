import { useState, useEffect, useCallback } from 'react';

export function useTransactionStream() {
    const [transactions, setTransactions] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [rings, setRings] = useState([]);

    const connect = useCallback(() => {
        const eventSource = new EventSource('http://localhost:3000/api/stream');

        eventSource.onopen = () => {
            setIsConnected(true);
            console.log('SSE connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle connection confirmation
                if (data.type === 'connected') {
                    return;
                }

                // Handle ring detection
                if (data.type === 'ring_detected') {
                    setRings(prev => [data.ring, ...prev].slice(0, 20));
                    return;
                }

                // Handle trade data
                if (data.trade_id) {
                    setTransactions(prev => [data, ...prev].slice(0, 100));
                }
            } catch (e) {
                console.error('Failed to parse SSE data:', e);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            eventSource.close();
            // Reconnect after 3 seconds
            setTimeout(connect, 3000);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        const cleanup = connect();
        return cleanup;
    }, [connect]);

    return { transactions, isConnected, rings };
}
