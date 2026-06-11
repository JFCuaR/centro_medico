import React, { useEffect, useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';
import axios from 'axios';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function PantallaTurnos() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [turnos, setTurnos] = useState([]);
    const [turnoActual, setTurnoActual] = useState(null);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const fetchTurnos = async () => {
        try {
            const response = await axios.get(`${URL}/api/turnos`);
            const lista = Array.isArray(response.data) ? response.data.flat() : [];
            // Calculamos estados
            setTurnos(lista);
            setTurnoActual(lista.find(t => (t.estado || '').toLowerCase() === 'atendiendo') || null);
        } catch (error) {
            console.error('Error al obtener turnos:', error);
        }
    };

    // --- Acciones ---
    const llamarTurno = async (id) => {
        try {
            await axios.put(`${URL}/api/turnos/${id}/atender`);
            await fetchTurnos();
        } catch (error) {
            console.error('Error al pasar a atendiendo:', error);
        }
    };

    const finalizarTurno = async (id) => {
        try {
            await axios.put(`${URL}/api/turnos/${id}/finalizar`);
            await fetchTurnos();
        } catch (error) {
            console.error('Error al finalizar:', error);
        }
    };

    const noAtendidoTurno = async (id) => {
        try {
            await axios.put(`${URL}/api/turnos/${id}/no-atendido`);
            await fetchTurnos();
        } catch (error) {
            console.error('Error al marcar no atendido:', error);
        }
    };


    // helper para avisar a la TV
    const avisarReanuncio = (turno) => {
        const payload = { type: 'reanuncio', id_turno: turno.id_turno, ts: Date.now(), nombre_paciente: turno.nombre_paciente, motivo: turno.motivo };
        // BroadcastChannel (si está disponible)
        try {
            const ch = new BroadcastChannel('turnos_channel');
            ch.postMessage(payload);
            ch.close();
        } catch { }
        // Fallback con localStorage (dispara evento 'storage' en otras pestañas)
        localStorage.setItem('turno_reanuncio', JSON.stringify(payload));
    };


    const llamarSiguiente = async () => {
        try {
            const enEsperaOrdenados = turnos
                .filter(t => (t.estado || '').toLowerCase() === 'espera')
                // si tienes 'creado_en', usa ese; si no, por id_turno
                .sort((a, b) => (a.creado_en || a.id_turno) > (b.creado_en || b.id_turno) ? 1 : -1);

            if (enEsperaOrdenados.length === 0) return;
            await llamarTurno(enEsperaOrdenados[0].id_turno);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTurnos();
        const intervalo = setInterval(fetchTurnos, 5000);
        return () => clearInterval(intervalo);
    }, []);

    const turnosEnEspera = turnos.filter(t => (t.estado || '').toLowerCase() === 'espera');

    return (

        <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
            <Sidebar isOpen={isSidebarOpen} />
            {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
            <div id="page-content-wrapper">
                <Navbar toggleSidebar={toggleSidebar} />
                <link
                    href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
                    rel="stylesheet"
                />
                <div className="container mt-4 text-center">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="mb-0">Turno Actual</h1>
                        <button
                            className="btn btn-primary"
                            onClick={llamarSiguiente}
                            disabled={!!turnoActual || turnosEnEspera.length === 0}
                            title={turnoActual ? 'Finaliza o marca no atendido para llamar al siguiente' : 'Llamar siguiente en espera'}
                        >
                            📣 Llamar siguiente
                        </button>
                    </div>

                    {turnoActual ? (
                        <div className="alert alert-primary">
                            <div className="h3 mb-3">
                                {turnoActual.nombre_paciente} — {turnoActual.motivo}
                            </div>
                            <div className="d-flex justify-content-center gap-2">
                                <button
                                    className="btn btn-success mr-2"
                                    onClick={() => avisarReanuncio(turnoActual)}
                                >
                                    🔊 Llamar de nuevo
                                </button>

                                <button
                                    className="btn btn-danger mr-2"
                                    onClick={() => finalizarTurno(turnoActual.id_turno)}
                                >
                                    ✅ Atendido
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => noAtendidoTurno(turnoActual.id_turno)}
                                >
                                    🚫 No atendido
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted">No hay turno activo</div>
                    )}

                    <hr />

                    <h3>Turnos en espera</h3>
                    <div className="row justify-content-center">
                        <div className="col-md-8">
                            <ul className="list-group">
                                {turnosEnEspera.map(turno => (
                                    <li
                                        key={turno.id_turno}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                    >
                                        <span>{turno.nombre_paciente} — {turno.motivo}</span>
                                        <div className="btn-group">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => llamarTurno(turno.id_turno)}
                                                title="Pasar a atendiendo"
                                            >
                                                ▶️ Atender
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => noAtendidoTurno(turno.id_turno)}
                                                title="Marcar como no atendido"
                                            >
                                                🚫 No atendido
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {turnosEnEspera.length === 0 && (
                                    <li className="list-group-item text-muted">No hay turnos en espera</li>
                                )}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PantallaTurnos;
