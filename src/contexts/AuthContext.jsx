
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Admin credentials check (local)
        if (username === 'admin' && password === 'admin123') {
            const userData = { id: 1, name: 'Administrator', role: 'admin', avatar: 'AD' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        }

        if (username === 'officer' && password === 'officer123') {
            const userData = { id: 2, name: 'Sarah Connor', role: 'officer', avatar: 'SC' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        }

        if (username === 'investigator' && password === 'investigator123') {
            const userData = { id: 3, name: 'Sherlock Holmes', role: 'investigator', avatar: 'SH' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        }

        // Try backend API for demo trading accounts
        try {
            const res = await fetch('http://localhost:3000/api/client/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                const userData = {
                    id: data.account.id,
                    name: data.account.name,
                    role: 'client',
                    avatar: data.account.name.split(' ').map(n => n[0]).join(''),
                    account: data.account,
                    token: data.token
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return true;
            }
        } catch (e) {
            console.error('Backend login failed:', e);
        }

        throw new Error('Invalid credentials');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
