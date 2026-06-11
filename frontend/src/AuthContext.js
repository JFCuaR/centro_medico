// src/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    useEffect(() => {
    if (token) {
        const API_URL =
          process.env.REACT_APP_URL_BACKEND || `http://${window.location.hostname}:3001`;

        axios.get(`${API_URL}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            setUser(res.data.user);
        })
        .catch(() => {
            setUser(null);
            setToken('');
            localStorage.removeItem('token');
        });
    }
}, [token]);

    const login = (token, userData) => {
  localStorage.setItem('token', token);
  setToken(token);
  // 🔹 Guardar datos extendidos del usuario (por si el backend devuelve caja)
  setUser({
    ...userData,
    idCaja: userData.idCaja || null,
    estadoCaja: userData.estadoCaja || null,
  });
};


    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
