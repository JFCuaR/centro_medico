import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './HistorialEncamamiento.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function HistorialEncamamiento() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [encamamientos, setEncamamientos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const obtenerEncamamientos = async () => {
    try {
      setCargando(true);
      const res = await axios.get(`${URL}/api/encamamientos/historial`, {
        params: { busqueda, estado },
      });
      setEncamamientos(res.data || []);
    } catch (error) {
      console.error('Error al cargar encamamientos:', error);
      setEncamamientos([]);
    } finally {
      setCargando(false);
    }
  };

  const obtenerDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      const res = await axios.get(`${URL}/api/encamamientos/historial/${id}`);
      setDetalle(res.data);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  useEffect(() => {
    obtenerEncamamientos();
  }, []);

  const buscar = (e) => {
    e.preventDefault();
    obtenerEncamamientos();
  };

  const renderMedicamentosDia = (medicamentos) => {
    if (!medicamentos) return 'Sin datos';

    if (Array.isArray(medicamentos)) {
      if (medicamentos.length === 0) return 'Sin medicamentos';
      return (
        <ul className="mb-0">
          {medicamentos.map((med, index) => (
            <li key={index}>
              {typeof med === 'object' ? med.nombre || JSON.stringify(med) : med}
            </li>
          ))}
        </ul>
      );
    }

    return medicamentos;
  };

  return (
    <div>
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid mt-4">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h2 className="mb-3">Historial de Encamamientos</h2>

                <form onSubmit={buscar} className="row g-3">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por paciente, DPI, diagnóstico o médico"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3">
                    <select
                      className="form-control"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="activos">Activos</option>
                      <option value="finalizados">Finalizados</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <button type="submit" className="btn btn-primary w-100">
                      Buscar
                    </button>
                  </div>

                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-secondary w-100"
                      onClick={() => {
                        setBusqueda('');
                        setEstado('');
                        setDetalle(null);
                        setTimeout(() => {
                          window.location.reload();
                        }, 100);
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-5 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h4 className="mb-3">Pacientes ingresados</h4>

                    {cargando ? (
                      <p>Cargando registros...</p>
                    ) : encamamientos.length === 0 ? (
                      <p>No hay encamamientos registrados.</p>
                    ) : (
                      <div className="list-group historial-lista">
                        {encamamientos.map((item) => (
                          <button
                            key={item.id_encamamiento}
                            className="list-group-item list-group-item-action"
                            onClick={() => obtenerDetalle(item.id_encamamiento)}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{item.paciente_nombre}</h6>
                                <small>DPI: {item.dpi || 'Sin DPI'}</small>
                                <br />
                                <small>Ingreso: {item.fecha_ingreso || 'Sin fecha'}</small>
                                <br />
                                <small>Cuarto: {item.no_cuarto ?? 'N/A'} | Cama: {item.no_cama ?? 'N/A'}</small>
                              </div>

                              <span
                                className={`badge ${
                                  item.fecha_salida || item.ocupado === '0'
                                    ? 'bg-secondary'
                                    : 'bg-success'
                                }`}
                              >
                                {item.fecha_salida || item.ocupado === '0' ? 'Finalizado' : 'Activo'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-7 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h4 className="mb-3">Detalle del encamamiento</h4>

                    {cargandoDetalle ? (
                      <p>Cargando detalle...</p>
                    ) : !detalle ? (
                      <p>Selecciona un encamamiento para ver toda la información.</p>
                    ) : (
                      <>
                        <div className="detalle-bloque">
                          <h5>Paciente</h5>
                          <p><strong>Nombre:</strong> {detalle.encamamiento.paciente_nombre}</p>
                          <p><strong>DPI:</strong> {detalle.encamamiento.dpi || 'Sin dato'}</p>
                          <p><strong>Teléfono:</strong> {detalle.encamamiento.telefono || 'Sin dato'}</p>
                          <p><strong>Fecha nacimiento:</strong> {detalle.encamamiento.fecha_nacimiento || 'Sin dato'}</p>
                          <p><strong>Sexo:</strong> {detalle.encamamiento.sexo || 'Sin dato'}</p>
                          <p><strong>Religión:</strong> {detalle.encamamiento.religion || 'Sin dato'}</p>
                        </div>

                        <div className="detalle-bloque">
                          <h5>Encamamiento</h5>
                          <p><strong>ID:</strong> {detalle.encamamiento.id_encamamiento}</p>
                          <p><strong>Fecha ingreso:</strong> {detalle.encamamiento.fecha_ingreso || 'Sin dato'}</p>
                          <p><strong>Fecha salida:</strong> {detalle.encamamiento.fecha_salida || 'Aún ingresado'}</p>
                          <p><strong>Cuarto:</strong> {detalle.encamamiento.no_cuarto ?? 'N/A'}</p>
                          <p><strong>Cama:</strong> {detalle.encamamiento.no_cama ?? 'N/A'}</p>
                          <p><strong>Observación salida:</strong> {detalle.encamamiento.observacion_salida || 'Sin observación'}</p>
                        </div>

                        <div className="detalle-bloque">
                          <h5>Historial médico relacionado</h5>
                          <p><strong>Fecha consulta:</strong> {detalle.encamamiento.fecha_consulta || 'Sin dato'}</p>
                          <p><strong>Diagnóstico:</strong> {detalle.encamamiento.diagnostico || 'Sin dato'}</p>
                          <p><strong>Síntomas:</strong> {detalle.encamamiento.sintomas || 'Sin dato'}</p>
                          <p><strong>Medicamentos recetados:</strong> {detalle.encamamiento.medicamentos_recetados || 'Sin dato'}</p>
                          <p><strong>Médico responsable:</strong> {detalle.encamamiento.medico_responsable || 'Sin dato'}</p>
                        </div>

                        <div className="detalle-bloque">
                          <h5>Paciente interno</h5>
                          <p><strong>Medicamentos aplicados:</strong> {detalle.encamamiento.medicamentos_aplicados || 'Sin dato'}</p>
                          <p><strong>Dieta:</strong> {detalle.encamamiento.dieta_interna || 'Sin dato'}</p>
                          <p><strong>Estado:</strong> {detalle.encamamiento.estado_interno || 'Sin dato'}</p>
                          <p><strong>Médico:</strong> {detalle.encamamiento.medico_interno || 'Sin dato'}</p>
                          <p><strong>Observaciones:</strong> {detalle.encamamiento.observaciones_interno || 'Sin dato'}</p>
                        </div>

                        <div className="detalle-bloque">
                          <h5>Signos vitales diarios</h5>
                          {detalle.signos_vitales?.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-bordered table-sm">
                                <thead>
                                  <tr>
                                    <th>Fecha</th>
                                    <th>Momento</th>
                                    <th>P/A</th>
                                    <th>Temp</th>
                                    <th>F.C.</th>
                                    <th>F.R.</th>
                                    <th>Sat.</th>
                                    <th>Glucemia</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detalle.signos_vitales.map((signo) => (
                                    <tr key={signo.id_signo}>
                                      <td>{signo.fecha}</td>
                                      <td>{signo.momento}</td>
                                      <td>{signo.presion_arterial || '-'}</td>
                                      <td>{signo.temperatura ?? '-'}</td>
                                      <td>{signo.frecuencia_cardiaca ?? '-'}</td>
                                      <td>{signo.frecuencia_respiratoria ?? '-'}</td>
                                      <td>{signo.saturacion_oxigeno ?? '-'}</td>
                                      <td>{signo.glucemia ?? '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p>No hay signos vitales registrados.</p>
                          )}
                        </div>

                        <div className="detalle-bloque">
                          <h5>Datos clínicos diarios</h5>
                          {detalle.datos_clinicos?.length > 0 ? (
                            detalle.datos_clinicos.map((dato) => (
                              <div className="card mb-3 border-clinico" key={dato.id_dato}>
                                <div className="card-body">
                                  <p><strong>Fecha:</strong> {dato.fecha}</p>
                                  <p><strong>Momento:</strong> {dato.momento}</p>
                                  <p><strong>Dieta:</strong> {dato.dieta || 'Sin dato'}</p>
                                  <p><strong>Visitar por:</strong> {dato.visitar_por || 'Sin dato'}</p>
                                  <p><strong>Medicamentos del día:</strong></p>
                                  {renderMedicamentosDia(dato.medicamentos_dia)}
                                  <p className="mt-2"><strong>Soluciones:</strong> {dato.soluciones || 'Sin dato'}</p>
                                  <p><strong>Laboratorio:</strong> {dato.laboratorio || 'Sin dato'}</p>
                                  <p><strong>Especiales:</strong> {dato.especiales || 'Sin dato'}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p>No hay datos clínicos diarios registrados.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialEncamamiento;