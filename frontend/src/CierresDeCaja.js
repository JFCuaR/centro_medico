// src/CierresDeCaja.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function CierresDeCaja() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [cierres, setCierres] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [detalleAbierto, setDetalleAbierto] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    // 🔹 Obtener lista de cajas (abiertas y cerradas)
    const obtenerCierres = async () => {
        try {
            const res = await axios.get(`${URL}/cierres`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setCierres(res.data);
        } catch (err) {
            console.error('Error al cargar cierres:', err);
            Swal.fire('Error', 'No se pudieron obtener los cierres.', 'error');
        }
    };

    // 🔹 Ver detalle de ventas por caja
    const verDetalleVentas = async (idCaja) => {
        try {
            const res = await axios.get(`${URL}/caja/${idCaja}/ventas`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setVentas(res.data);
            setDetalleAbierto(idCaja);
        } catch (err) {
            console.error('Error al cargar detalle:', err);
            Swal.fire('Error', 'No se pudo obtener el detalle de ventas.', 'error');
        }
    };

    // 🔹 Cerrar caja directamente desde el panel
    const cerrarCaja = async (idCaja) => {
        const confirmar = await Swal.fire({
            title: '¿Cerrar esta caja?',
            text: 'Se calculará el total y se marcará como cerrada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar',
            cancelButtonText: 'Cancelar',
        });
        if (!confirmar.isConfirmed) return;

        try {
            setLoading(true);
            const res = await axios.post(`${URL}/caja/cerrar`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            Swal.fire('✅ Caja cerrada', `Total: Q${res.data.total}`, 'success');
            obtenerCierres(); // refrescar lista
        } catch (err) {
            console.error('Error al cerrar caja:', err);
            Swal.fire('Error', 'No se pudo cerrar la caja.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Si una caja está abierta, calcular su total dinámico
    const obtenerTotalEnVivo = async (idCaja) => {
        try {
            const res = await axios.get(`${URL}/caja/${idCaja}/ventas`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const total = res.data.reduce((acc, v) => acc + parseFloat(v.total_venta || 0), 0);
            return total;
        } catch (err) {
            console.error('Error al obtener total dinámico:', err);
            return 0;
        }
    };

    useEffect(() => {
        obtenerCierres();
    }, []);

    // 🔹 Enriquecer los datos con totales en vivo (para abiertas)
    useEffect(() => {
        const actualizarTotales = async () => {
            const actualizadas = await Promise.all(
                cierres.map(async (caja) => {
                    if (caja.estado === 'abierta') {
                        const totalEnVivo = await obtenerTotalEnVivo(caja.id_caja);
                        return { ...caja, total_ventas: totalEnVivo };
                    }
                    return caja;
                })
            );
            setCierres(actualizadas);
        };
        if (cierres.length > 0) actualizarTotales();
    }, [cierres.length]);

    return (
        <div>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Cierres de Caja</title>
            <link
                href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
                rel="stylesheet"
            />

            <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
                <Sidebar isOpen={isSidebarOpen} />
                {isSidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

                <div id="page-content-wrapper">
                    <Navbar toggleSidebar={toggleSidebar} />
                    <div className="container-fluid mt-4">
                        <h2 className="text-center mb-4">💰 Cierres de Caja</h2>

                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="thead-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Fecha Apertura</th>
                                        <th>Fecha Cierre</th>
                                        <th>Total Ventas</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cierres.map((caja) => (
                                        <tr key={caja.id_caja}>
                                            <td>{caja.id_caja}</td>
                                            <td>{caja.usuario}</td>
                                            <td>{new Date(caja.fecha_apertura).toLocaleString()}</td>
                                            <td>{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : '-'}</td>
                                            <td>Q{parseFloat(caja.total_ventas || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${caja.estado === 'cerrada' ? 'bg-success' : 'bg-warning'}`}>
                                                    {caja.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => verDetalleVentas(caja.id_caja)}
                                                        disabled={caja.usuario !== localStorage.getItem('userName')}
                                                    >
                                                        Ver detalle
                                                    </button>


                                                    {caja.estado === 'abierta' && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => cerrarCaja(caja.id_caja)}
                                                            disabled={loading}
                                                        >
                                                            {loading ? 'Cerrando...' : 'Cerrar caja'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {detalleAbierto && (
                            <div className="mt-4">
                                <h4>🧾 Ventas del turno #{detalleAbierto}</h4>
                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>ID Venta</th>
                                                <th>Fecha</th>
                                                <th>Total Venta</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ventas.map((v) => (
                                                <tr key={v.id_venta}>
                                                    <td>{v.id_venta}</td>
                                                    <td>{new Date(v.fecha).toLocaleString()}</td>
                                                    <td>Q{parseFloat(v.total_venta).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    className="btn btn-secondary mt-2"
                                    onClick={() => setDetalleAbierto(null)}
                                >
                                    🔙 Volver
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CierresDeCaja;
