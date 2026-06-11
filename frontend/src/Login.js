import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import miImagen from './logo.jpg';
import './Login.css';  // Estilos personalizados

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post(`${URL}/login`, {
                username: email,
                password
            });

           if (response.data.token) {
    const token = response.data.token;
    const rol = response.data.rol;
    
    // 🔹 Incluir los datos de caja que vienen del backend
    const user = {
        ...response.data.user,
        idCaja: response.data.idCaja || null,
        estadoCaja: response.data.estadoCaja || 'pendiente',
        fechaApertura: response.data.fechaApertura || null
    };

    login(token, user);

                // Redirigir según el rol
                if (rol === 'farmaceutico') {
                    navigate('/home'); // Redirige a HomeFarmacia.js si el rol es farmaceutico
                } else if (rol === 'admin') {
                    navigate('/home'); // Redirige a Home.js si el rol es doctor
                } else if (rol === 'doctor') {
                    navigate('/home'); // Redirige a Home.js si el rol es doctor
                } else if (rol == 'TV'){
                    navigate('/VerTurnosPublico')
                }else {alert('Rol desconocido, contacta con el administrador');}
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400) {
                    alert('Usuario o contraseña incorrectos');
                } else if (error.response.status === 403) {
                    alert('Cuenta desactivada. Contacta con el administrador');
                } else {
                    alert('Error del servidor');
                }
            } else {
                console.error('Error al iniciar sesión', error);
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="image-container mt-4">
                              <img src={miImagen} alt="logo" />
                            </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Usuario</label>
                        <input
                            type="text"
                            className="form-control"
                            id="email"
                            placeholder="Usuario"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 rounded-pill">Logar</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
