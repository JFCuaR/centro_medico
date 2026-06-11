import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dpiSearchTerm, setDpiSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [medicamentosEdit, setMedicamentosEdit] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const convertirMedicamentosALista = (medicamentos) => {
    if (!medicamentos) return [];

    if (Array.isArray(medicamentos)) {
      return medicamentos
        .flatMap((m) => String(m).split('|'))
        .map((m) => m.trim())
        .filter(Boolean);
    }

    return String(medicamentos)
      .split('|')
      .map((m) => m.trim())
      .filter(Boolean);
  };

const fetchPacientes = async () => {
  try {
    const response = await axios.get(`${URL}/buscar_pacientes`, {
      params: {
        nombre: searchTerm,
        dpi: dpiSearchTerm,
      },
    });

    console.log('PACIENTES BACKEND:', response.data);
    setPacientes(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
  }
};

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleSearch = () => {
    fetchPacientes();
  };

  const handleVisualizar = (paciente) => {
    setSelectedPaciente(paciente);
    setShowModal(true);
  };

  const handleActualizar = (paciente) => {
    setSelectedPaciente({ ...paciente });
    setMedicamentosEdit(convertirMedicamentosALista(paciente.medicamentos_recetados));
    setShowUpdateModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPaciente(null);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedPaciente(null);
  };

  const handleGuardarActualizacion = async () => {
    try {
      const updatedPaciente = {
        ...selectedPaciente,
        medicamentos_recetados: medicamentosEdit
          .filter((m) => m.trim() !== '')
          .join('|'),
      };

      await axios.put(
        `${URL}/actualizar_paciente/${selectedPaciente.id}`,
        updatedPaciente
      );

      alert('Paciente actualizado correctamente');
      handleCloseUpdateModal();
      fetchPacientes();
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      alert('Error al actualizar el paciente');
    }
  };

  const handleDelete = async (idHistorial) => {
    const confirmDelete = window.confirm('¿Eliminar este registro del historial médico?');
    if (confirmDelete) {
      try {
        await axios.delete(`${URL}/eliminar_historial/${idHistorial}`);
        alert('Registro eliminado correctamente');
        fetchPacientes();
      } catch (error) {
        console.error('Error al eliminar registro:', error);
        alert('Error al eliminar el registro');
      }
    }
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Historial de Pacientes</title>
      <link
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />

        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid">
            <h2>Pacientes</h2>

            <div className="row">
              <div className="col-md-6 mb-3">
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="col-md-6 mb-3">
                <input
                  type="text"
                  placeholder="Buscar por DPI..."
                  value={dpiSearchTerm}
                  onChange={(e) => setDpiSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <button className="btn btn-primary mb-3" onClick={handleSearch}>
              Buscar
            </button>

            <div className="card shadow">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">👥 Pacientes Registrados</h5>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-striped table-hover mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Nombre del Paciente</th>
                        <th>DPI</th>
                        <th>Fecha de Consulta</th>
                        <th>Diagnóstico</th>
                        <th>Teléfono</th>
                        <th>Medicamentos Recetados</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pacientes.slice(0, 10).map((paciente) => (
                        <tr key={paciente.id}>
                          <td>{paciente.id}</td>
                          <td>{paciente.nombre_paciente}</td>
                          <td>{paciente.dpi}</td>
                          <td>
                            {paciente.fecha_consulta
                              ? String(paciente.fecha_consulta)
                                  .slice(0, 10)
                                  .split('-')
                                  .reverse()
                                  .join('/')
                              : 'No disponible'}
                          </td>
                          <td>{paciente.diagnostico || ''}</td>
                          <td>{paciente.telefono || ''}</td>
                          <td>
                            <ul className="mb-0">
                              {convertirMedicamentosALista(paciente.medicamentos_recetados).map(
                                (medicamento, index) => (
                                  <li key={index}>{medicamento}</li>
                                )
                              )}
                            </ul>
                          </td>
                          <td>
                            <button
                              className="btn btn-info btn-sm mr-2"
                              onClick={() => handleVisualizar(paciente)}
                            >
                              Visualizar
                            </button>

                            <button
                              className="btn btn-warning btn-sm mr-2"
                              onClick={() => handleActualizar(paciente)}
                            >
                              Editar
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(paciente.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}

                      {pacientes.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center py-3">
                            No hay pacientes registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {showModal && selectedPaciente && (
              <div
                className="modal"
                style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Detalles del Paciente</h5>
                      <button type="button" className="close" onClick={handleCloseModal}>
                        &times;
                      </button>
                    </div>

                    <div
                      className="modal-body"
                      style={{ maxHeight: '70vh', overflowY: 'auto' }}
                    >
                      <div className="container">
                        <h5 className="text-center mb-4">Datos Personales</h5>

                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Nombre:</strong> {selectedPaciente.nombre_paciente}</p>
                            <p>
                              <strong>Fecha de Nacimiento:</strong>{' '}
                              {selectedPaciente.fecha_nacimiento
                                ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString()
                                : 'No registrada'}
                            </p>
                            <p><strong>Sexo:</strong> {selectedPaciente.sexo || 'No registrado'}</p>
                            <p><strong>Religión:</strong> {selectedPaciente.religion || 'No registrada'}</p>
                          </div>

                          <div className="col-md-6">
                            <p><strong>DPI:</strong> {selectedPaciente.dpi || 'No registrado'}</p>
                            <p>
                              <strong>Fecha de Consulta:</strong>{' '}
                              {selectedPaciente.fecha_consulta
                                ? new Date(selectedPaciente.fecha_consulta).toLocaleDateString()
                                : 'No registrada'}
                            </p>
                            <p><strong>Médico Responsable:</strong> {selectedPaciente.medico_responsable || 'No registrado'}</p>
                            <p><strong>Teléfono:</strong> {selectedPaciente.telefono || 'No registrado'}</p>
                          </div>
                        </div>

                        <hr />

                        <h5 className="text-center mb-4">Diagnóstico y Consulta</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Diagnóstico:</strong> {selectedPaciente.diagnostico || 'No registrado'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Síntomas:</strong> {selectedPaciente.sintomas || 'No registrados'}</p>
                          </div>
                        </div>

                        <hr />

                        <h5 className="text-center mb-4">Signos Vitales</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Presión arterial:</strong> {selectedPaciente.presion_arterial || 'No registrada'}</p>
                            <p><strong>Temperatura:</strong> {selectedPaciente.temperatura || 'No registrada'}</p>
                            <p><strong>Frecuencia cardíaca:</strong> {selectedPaciente.frecuencia_cardiaca || 'No registrada'}</p>
                            <p><strong>Frecuencia respiratoria:</strong> {selectedPaciente.frecuencia_respiratoria || 'No registrada'}</p>
                          </div>

                          <div className="col-md-6">
                            <p><strong>Saturación de oxígeno:</strong> {selectedPaciente.saturacion_oxigeno || 'No registrada'}</p>
                            <p><strong>Glucemia:</strong> {selectedPaciente.glucemia || 'No registrada'}</p>
                            <p><strong>Peso:</strong> {selectedPaciente.peso || 'No registrado'}</p>
                            <p><strong>Talla:</strong> {selectedPaciente.talla || 'No registrada'}</p>
                          </div>
                        </div>

                        <hr />

                        <h5 className="text-center mb-4">Medicamentos Recetados</h5>
                        <div className="row">
                          <div className="col-12">
                            <ul>
                              {convertirMedicamentosALista(selectedPaciente.medicamentos_recetados).map(
                                (medicamento, index) => (
                                  <li key={index}>{medicamento}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>

                        <hr />

                        <h5 className="text-center mb-4">Antecedentes Médicos</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Antecedentes Médicos:</strong> {selectedPaciente.antecedentes_medico || 'No registrados'}</p>
                            <p><strong>Antecedentes Quirúrgicos:</strong> {selectedPaciente.antecedentes_quirurgico || 'No registrados'}</p>
                            <p><strong>Antecedentes Alérgicos:</strong> {selectedPaciente.antecedentes_alergico || 'No registrados'}</p>
                          </div>

                          <div className="col-md-6">
                            <p><strong>Antecedentes Traumáticos:</strong> {selectedPaciente.antecedentes_traumaticos || 'No registrados'}</p>
                            <p><strong>Antecedentes Familiares:</strong> {selectedPaciente.antecedentes_familiares || 'No registrados'}</p>
                            <p><strong>Vicios y Manías:</strong> {selectedPaciente.antecedentes_vicios_y_manias || 'No registrados'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showUpdateModal && selectedPaciente && (
              <div
                className="modal"
                style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Actualizar Paciente</h5>
                      <button type="button" className="close" onClick={handleCloseUpdateModal}>
                        &times;
                      </button>
                    </div>

                    <div
                      className="modal-body"
                      style={{ maxHeight: '70vh', overflowY: 'auto' }}
                    >
                      <h5 className="text-center">Datos Personales</h5>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.nombre_paciente || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                nombre_paciente: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>DPI</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.dpi || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                dpi: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Fecha de Consulta</label>
                          <input
                            type="date"
                            className="form-control"
                            value={
                              selectedPaciente.fecha_consulta
                                ? String(selectedPaciente.fecha_consulta).slice(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                fecha_consulta: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Fecha de Nacimiento</label>
                          <input
                            type="date"
                            className="form-control"
                            value={
                              selectedPaciente.fecha_nacimiento
                                ? String(selectedPaciente.fecha_nacimiento).slice(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                fecha_nacimiento: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Sexo</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.sexo || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                sexo: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Religión</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.religion || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                religion: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Teléfono</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedPaciente.telefono || ''}
                          onChange={(e) =>
                            setSelectedPaciente({
                              ...selectedPaciente,
                              telefono: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Médico Responsable</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedPaciente.medico_responsable || ''}
                          onChange={(e) =>
                            setSelectedPaciente({
                              ...selectedPaciente,
                              medico_responsable: e.target.value,
                            })
                          }
                        />
                      </div>

                      <h5 className="text-center mt-4">Diagnóstico</h5>
                      <div className="form-group">
                        <textarea
                          className="form-control"
                          rows="2"
                          value={selectedPaciente.diagnostico || ''}
                          onChange={(e) =>
                            setSelectedPaciente({
                              ...selectedPaciente,
                              diagnostico: e.target.value,
                            })
                          }
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Síntomas</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={selectedPaciente.sintomas || ''}
                          onChange={(e) =>
                            setSelectedPaciente({
                              ...selectedPaciente,
                              sintomas: e.target.value,
                            })
                          }
                        ></textarea>
                      </div>

                      <h5 className="text-center mt-4">Signos Vitales</h5>
                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Presión Arterial</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.presion_arterial || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                presion_arterial: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Temperatura</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.temperatura || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                temperatura: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Frecuencia Cardíaca</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.frecuencia_cardiaca || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                frecuencia_cardiaca: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Frecuencia Respiratoria</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.frecuencia_respiratoria || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                frecuencia_respiratoria: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Saturación de Oxígeno</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.saturacion_oxigeno || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                saturacion_oxigeno: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Glucemia</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.glucemia || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                glucemia: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Peso</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.peso || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                peso: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Talla</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.talla || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                talla: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <h5 className="text-center mt-4">Medicamentos Recetados</h5>
                      <div className="form-group">
                        {medicamentosEdit.map((med, idx) => (
                          <div key={idx} className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              value={med}
                              onChange={(e) => {
                                const updated = [...medicamentosEdit];
                                updated[idx] = e.target.value;
                                setMedicamentosEdit(updated);
                              }}
                            />
                            <div className="input-group-append">
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                  const updated = medicamentosEdit.filter((_, i) => i !== idx);
                                  setMedicamentosEdit(updated);
                                }}
                                disabled={medicamentosEdit.length === 1}
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => setMedicamentosEdit([...medicamentosEdit, ''])}
                        >
                          ➕ Agregar Medicamento
                        </button>
                      </div>

                      <h5 className="text-center mt-4">Antecedentes Médicos</h5>
                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Antecedentes Médicos</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_medico || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_medico: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Antecedentes Quirúrgicos</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_quirurgico || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_quirurgico: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Antecedentes Alérgicos</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_alergico || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_alergico: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Antecedentes Traumáticos</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_traumaticos || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_traumaticos: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Antecedentes Familiares</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_familiares || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_familiares: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label>Vicios y Manías</label>
                          <input
                            type="text"
                            className="form-control"
                            value={selectedPaciente.antecedentes_vicios_y_manias || ''}
                            onChange={(e) =>
                              setSelectedPaciente({
                                ...selectedPaciente,
                                antecedentes_vicios_y_manias: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseUpdateModal}>
                        Cancelar
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleGuardarActualizacion}>
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;