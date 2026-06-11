import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import logo from './logo.jpg';
import Sidebar from './sidebar'; // ← Importar 
import Navbar from './Navbar'; 
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

function Home() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.nombre) {
      setHistorialMedico(prev => ({
        ...prev,
        medico_responsable: user.nombre
      }));
    }
  }, [user]);
  

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [historialMedico, setHistorialMedico] = useState({
    nombre_paciente: '',
    fecha_consulta: '',
    diagnostico: '',
    sintomas: '',
    dpi: '',
    sexo: '',
    religion: '',
    medico_responsable: '',
    medicamentos_recetados: [
      { nombre: '', modo_administracion: '', cantidad: '', unidad: '', comentario: '' }
    ],
    antecedentes_medico: '',
    antecedentes_quirurgico: '',
    antecedentes_alergico: '',
    antecedentes_traumaticos: '',
    antecedentes_familiares: '',
    antecedentes_vicios_y_manias: ''
  });

  const [sugerencias, setSugerencias] = useState([]);
  const [recetaGenerada, setRecetaGenerada] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleNombreChange = async (e) => {
    const value = e.target.value;
    setHistorialMedico({ ...historialMedico, nombre_paciente: value });
    
    // Realizar la búsqueda de pacientes
    if (value.length >= 3) {
      try {
        const { data } = await axios.get(`${URL}/buscar_pacientes`, {
          params: { nombre: value }
        });
        setSugerencias(data); // Actualiza las sugerencias
      } catch (error) {
        console.error('Error al buscar pacientes:', error);
      }
    } else {
      setSugerencias([]);
    }
  };

  const handleSeleccionarSugerencia = async (paciente) => {
    setHistorialMedico({
      ...historialMedico,
      nombre_paciente: paciente.nombre_paciente,
      dpi: paciente.dpi,
      sexo: paciente.sexo,
      religion: paciente.religion,
      antecedentes_medico: paciente.antecedentes_medico,
      antecedentes_quirurgico: paciente.antecedentes_quirurgico,
      antecedentes_alergico: paciente.antecedentes_alergico,
      antecedentes_traumaticos: paciente.antecedentes_traumaticos,
      antecedentes_familiares: paciente.antecedentes_familiares,
      antecedentes_vicios_y_manias: paciente.antecedentes_vicios_y_manias
    });
    setSugerencias([]);
  };

  const handleHistorialChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('medicamento_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].nombre = value;
      setHistorialMedico({ ...historialMedico, medicamentos_recetados: nuevosMedicamentos });
    } else if (name.startsWith('modo_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].modo_administracion = value;
      setHistorialMedico({ ...historialMedico, medicamentos_recetados: nuevosMedicamentos });
    } else if (name.startsWith('cantidad_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].cantidad = value;
      setHistorialMedico({ ...historialMedico, medicamentos_recetados: nuevosMedicamentos });
    } else if (name.startsWith('unidad_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].unidad = value;
      setHistorialMedico({ ...historialMedico, medicamentos_recetados: nuevosMedicamentos });
    } else if (name.startsWith('comentario_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].comentario = value;
      setHistorialMedico({ ...historialMedico, medicamentos_recetados: nuevosMedicamentos });
    } else {
      setHistorialMedico({ ...historialMedico, [name]: value });
    }
  };

  const handleAddMedicamento = () => {
    setHistorialMedico((prevState) => ({
      ...prevState,
      medicamentos_recetados: [
        ...prevState.medicamentos_recetados,
        { nombre: '', modo_administracion: '', cantidad: '', unidad: '', comentario: '' }
      ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dpiSinGuiones = historialMedico.dpi.replace(/-/g, '');

    const medicamentosFiltrados = historialMedico.medicamentos_recetados.filter(
      (medicamento) => medicamento.nombre && typeof medicamento.nombre === 'string' && medicamento.nombre.trim() !== ''
    );

    const datosParaEnviar = {
      ...historialMedico,
      dpi: dpiSinGuiones,
      medicamentos_recetados: medicamentosFiltrados,
    };

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Estás a punto de guardar los datos del historial médico.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(`${URL}/historial-medico`, datosParaEnviar);

          Swal.fire({
            title: 'Guardado',
            text: 'El historial médico ha sido guardado exitosamente.',
            icon: 'success',
            confirmButtonText: 'OK',
          }).then(() => {
            setRecetaGenerada(true);
          });
        } catch (error) {
          console.error('Hubo un error al agregar el historial médico:', error);
          Swal.fire('Error', 'Hubo un error al guardar el historial médico.', 'error');
        }
      }
    });
  };

  const handleNuevo = () => {
    setHistorialMedico({
      nombre_paciente: '',
      fecha_consulta: '',
      diagnostico: '',
      sintomas: '',
      dpi: '',
      sexo: '',
      religion: '',
      medico_responsable: '',
      telefono: '',  // Agregado
      fecha_nacimiento: '',  
      medicamentos_recetados: [
        { nombre: '', modo_administracion: '', cantidad: '', unidad: '', comentario: '' }
      ],
      antecedentes_medico: '',
      antecedentes_quirurgico: '',
      antecedentes_alergico: '',
      antecedentes_traumaticos: '',
      antecedentes_familiares: '',
      antecedentes_vicios_y_manias: ''
    });
    setRecetaGenerada(false);  // Oculta la receta generada
  };
  
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const imgData = logo;

    doc.addImage(imgData, 'JPEG', 15, 10, 50, 20);

    doc.setFontSize(14);
    doc.text('Dr. Oscar Herrera', 80, 25);
    doc.setFontSize(12);
    doc.text('CENTRO MEDICO JERUSALEM', 75, 30);
    doc.text('CONSULTAS • RECIÉN NACIDOS • NIÑOS • ADOLESCENTES • ADULTOS', 50, 35);
    doc.line(15, 40, 195, 40);

    doc.setFontSize(12);
    doc.text(`Nombre del Paciente: ${historialMedico.nombre_paciente}`, 20, 50);
    doc.text(`Fecha de Consulta: ${historialMedico.fecha_consulta}`, 20, 60);

    doc.text('Medicamentos Recetados:', 20, 70);
    let yPosition = 80;

    historialMedico.medicamentos_recetados
      .filter((med) => med.nombre.trim() !== '')
      .forEach((medicamento, index) => {
        doc.text(
          `${index + 1}. ${medicamento.nombre}, ${medicamento.modo_administracion}, ${medicamento.cantidad} ${medicamento.unidad}${medicamento.comentario ? `, ${medicamento.comentario}` : ''}`,
          20,
          yPosition
        );
        yPosition += 10;
      });

    doc.setFontSize(10);
    doc.text(`Médico Responsable: ${historialMedico.medico_responsable}`, 20, yPosition + 10);

    doc.setFontSize(10);
    doc.text('CENTRO MEDICO JERUSALEM', 20, 260);
    doc.text('Camino a aldea lolemi, chocola,', 20, 270);
    doc.text('Aldea Chocola, san pablo jocopilas, suchitepequez', 20, 275);
    doc.text('Tel: 3161 2260', 20, 280);

    doc.save('receta-medica.pdf');
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Ingreso de Historial Médico</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />

        <div id="page-content-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <h2>Ingreso de Historial Médico</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group col-md-6">
                    <label>Nombre del Paciente:</label>
          <input
            type="text"
            className="form-control"
            name="nombre_paciente"
            value={historialMedico.nombre_paciente}
            onChange={handleNombreChange}
            autoComplete="off"
          />
          {sugerencias.length > 0 && (
            <ul className="suggestions-list">
              {sugerencias.map((sugerencia) => (
                <li
                  key={sugerencia.dpi}
                  onClick={() => handleSeleccionarSugerencia(sugerencia)}
                >
                  {sugerencia.nombre_paciente}
                </li>
              ))}
            </ul>
          )}
                    </div>
                    <div className="form-group col-md-6">
                      <label>Fecha de Consulta:</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_consulta"
                        value={historialMedico.fecha_consulta}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>Diagnóstico:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="diagnostico"
                        value={historialMedico.diagnostico}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Síntomas:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="sintomas"
                        value={historialMedico.sintomas}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>DPI:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="dpi"
                        value={historialMedico.dpi}
                        onChange={handleHistorialChange}
                        maxLength={15}
                        required
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Sexo:</label>
                      <select
                        className="form-control"
                        name="sexo"
                        value={historialMedico.sexo}
                        onChange={handleHistorialChange}
                        required
                      >
                        <option value="">Seleccione</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>Religión:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="religion"
                        value={historialMedico.religion}
                        onChange={handleHistorialChange}
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Médico Responsable:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="medico_responsable"
                        value={historialMedico.medico_responsable}
                        readOnly
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-6">
    <label>Teléfono:</label>
    <input
      type="text"
      className="form-control"
      name="telefono"
      value={historialMedico.telefono}
      onChange={handleHistorialChange}
      maxLength={15}
      required
    />
  </div>
  <div className="form-group col-md-6">
    <label>Fecha de Nacimiento:</label>
    <input
      type="date"
      className="form-control"
      name="fecha_nacimiento"
      value={historialMedico.fecha_nacimiento}
      onChange={handleHistorialChange}
      required
    />
  </div>
                  </div>

                  <div className="form-group">
                    <label>Medicamentos Recetados:</label>
                    {historialMedico.medicamentos_recetados.map((medicamento, index) => (
                      <div key={index} className="form-row align-items-center mb-2">
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control"
                            name={`medicamento_${index}`}
                            value={medicamento.nombre}
                            placeholder={`Medicamento ${index + 1}`}
                            onChange={handleHistorialChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <select
                            className="form-control"
                            name={`modo_${index}`}
                            value={medicamento.modo_administracion}
                            onChange={handleHistorialChange}
                          >
                            <option value="">Seleccionar</option>
                            <option value="tomar">Tomar</option>
                            <option value="inhalar">Inhalar</option>
                            <option value="inyectar">Inyectar</option>
                            <option value="nebulizar">Nebulizar</option>
                          </select>
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            name={`cantidad_${index}`}
                            value={medicamento.cantidad}
                            placeholder="Cantidad"
                            onChange={handleHistorialChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <select
                            className="form-control"
                            name={`unidad_${index}`}
                            value={medicamento.unidad}
                            onChange={handleHistorialChange}
                          >
                            <option value="">Unidad</option>
                            <option value="tabletas">Tabletas</option>
                            <option value="gotas">Gotas</option>
                            <option value="cm">Cm</option>
                            <option value="puff">Puff</option>
                            <option value="ampolla">Ampolla</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control"
                            name={`comentario_${index}`}
                            value={medicamento.comentario}
                            placeholder="Dosis"
                            onChange={handleHistorialChange}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-primary mt-2"
                      onClick={handleAddMedicamento}
                    >
                      Agregar Más Medicamentos
                    </button>
                  </div>

                  <div className="form-group">
                    <h4>Antecedentes</h4>
                    <div className="form-row">
                      <div className="col-md-4">
                        <label>Antecedentes Médicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_medico"
                          value={historialMedico.antecedentes_medico}
                          onChange={handleHistorialChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Antecedentes Quirúrgicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_quirurgico"
                          value={historialMedico.antecedentes_quirurgico}
                          onChange={handleHistorialChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Antecedentes Alérgicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_alergico"
                          value={historialMedico.antecedentes_alergico}
                          onChange={handleHistorialChange}
                        />
                      </div>
                    </div>
                    <div className="form-row mt-3">
                      <div className="col-md-4">
                        <label>Antecedentes Traumáticos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_traumaticos"
                          value={historialMedico.antecedentes_traumaticos}
                          onChange={handleHistorialChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Antecedentes Familiares:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_familiares"
                          value={historialMedico.antecedentes_familiares}
                          onChange={handleHistorialChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Vicios y Manías:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_vicios_y_manias"
                          value={historialMedico.antecedentes_vicios_y_manias}
                          onChange={handleHistorialChange}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary mt-3">
                    Enviar
                  </button>
                  <button type="button" className="btn btn-secondary mt-3 ml-3" onClick={handleNuevo}>
                    Nuevo
                  </button>
                  <button type="button" className="btn btn-secondary mt-3 ml-3" onClick={handleGeneratePDF}>
                    Generar Receta en PDF
                  </button>
                </form>

                {recetaGenerada && (
                  <div className="mt-5">
                    <h3>Receta Médica</h3>
                    <p>
                      <strong>Paciente:</strong> {historialMedico.nombre_paciente}
                    </p>
                    <p>
                      <strong>Diagnóstico:</strong> {historialMedico.diagnostico}
                    </p>
                    <p>
                      <strong>Medicamentos:</strong>
                    </p>
                    <ul>
                      {historialMedico.medicamentos_recetados
                        .filter((med) => med.nombre.trim() !== '')
                        .map((med, index) => (
                          <li key={index}>{med.nombre}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;









import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './sidebar'; 
import Navbar from './Navbar'; 
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Para buscar por nombre
  const [dpiSearchTerm, setDpiSearchTerm] = useState(''); // Para buscar por DPI
  const [selectedPaciente, setSelectedPaciente] = useState(null); // Paciente seleccionado para mostrar detalles
  const [showModal, setShowModal] = useState(false); // Controlar la ventana emergente
  const [showUpdateModal, setShowUpdateModal] = useState(false);



  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Función para obtener los pacientes según el término de búsqueda
  const fetchPacientes = async () => {
    try {
      const response = await axios.get(`${URL}/buscar_pacientes`, {
        params: {
          nombre: searchTerm,
          dpi: dpiSearchTerm,
        },
      });
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al obtener los pacientes:', error);
    }
  };

  useEffect(() => {
    // Hacer una búsqueda inicial cuando se carga el componente
    fetchPacientes();
  }, []);

  const handleSearch = () => {
    fetchPacientes();
  };

  // Función para mostrar el modal con los detalles del paciente seleccionado
  const handleVisualizar = (paciente) => {
    setSelectedPaciente(paciente);
    setShowModal(true);
  };

  const handleActualizar = (paciente) => {
    setSelectedPaciente(paciente);
    setShowUpdateModal(true);
  };
  
  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedPaciente(null);
  };
  
  
  const handleGuardarActualizacion = async () => {
    try {
      await axios.put(`${URL}/actualizar_paciente/${selectedPaciente.id}`, selectedPaciente);
      alert('Paciente actualizado correctamente');
      handleCloseUpdateModal();
      fetchPacientes(); // Vuelve a cargar la lista
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      alert('Error al actualizar el paciente');
    }
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPaciente(null); // Limpiar el paciente seleccionado al cerrar el modal
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Historial de Pacientes</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />
        {/* /#sidebar-wrapper */}
        {/* Page Content */}
        <div id="page-content-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid">
            <h2>Pacientes</h2>

            {/* Filas para las barras de búsqueda */}
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

            {/* Tabla responsive */}
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Paciente</th>
                    <th>DPI</th>
                    <th>Fecha de Consulta</th>
                    <th>Diagnóstico</th>
                    <th>Telefono</th>
                    <th>Medicamentos Recetados</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id}>
                      <td>{paciente.id}</td>
                      <td>{paciente.nombre_paciente}</td>
                      <td>{paciente.dpi}</td>
                      <td> {paciente.fecha_consulta
                            ? paciente.fecha_consulta.slice(0, 10).split('-').reverse().join('/')
                           : 'No disponible'}
                      </td>
                      <td>{paciente.diagnostico}</td>
                      <td>{paciente.telefono}</td>
                      <td>
                        <ul>
                          {paciente.medicamentos_recetados.map((medicamento, index) => (
                            <li key={index}>{medicamento}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                      <button className="btn btn-info mr-2" onClick={() => handleVisualizar(paciente)}>
                       Visualizar
                      </button>
                      <button className="btn btn-warning" onClick={() => handleActualizar(paciente)}>
                       Actualizar
                       </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal para mostrar los detalles del paciente */}
            {showModal && selectedPaciente && (
              <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Detalles del Paciente</h5>
                      <button type="button" className="close" onClick={handleCloseModal}>
                        &times;
                      </button>
                    </div>
                    <div className="modal-body">
                    <div className="container">

  <h5 className="text-center mb-4">Datos Personales</h5>

  <div className="row">
    <div className="col-md-6">
      <p><strong>Nombre:</strong> {selectedPaciente.nombre_paciente}</p>
      <p><strong>Fecha de Nacimiento:</strong> {selectedPaciente.fecha_nacimiento ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString() : 'No registrada'}</p>
      <p><strong>Sexo:</strong> {selectedPaciente.sexo}</p>
      <p><strong>Religión:</strong> {selectedPaciente.religion}</p>
    </div>

    <div className="col-md-6">
      <p><strong>DPI:</strong> {selectedPaciente.dpi}</p>
      <p><strong>Fecha de Consulta:</strong> {new Date(selectedPaciente.fecha_consulta).toLocaleDateString()}</p>
      <p><strong>Médico Responsable:</strong> {selectedPaciente.medico_responsable}</p>
      <p><strong>Teléfono:</strong> {selectedPaciente.telefono}</p>
    </div>
  </div>

  <hr />

  <h5 className="text-center mb-4">Diagnóstico</h5>

  <div className="row">
    <div className="col-12">
      <p><strong>Diagnóstico:</strong> {selectedPaciente.diagnostico}</p>
    </div>
  </div>

  <hr />

  <h5 className="text-center mb-4">Medicamentos Recetados</h5>

  <div className="row">
    <div className="col-12">
      <ul>
        {selectedPaciente.medicamentos_recetados.map((medicamento, index) => (
          <li key={index}>{medicamento}</li>
        ))}
      </ul>
    </div>
  </div>

  <hr />

  <h5 className="text-center mb-4">Antecedentes Médicos</h5>

  <div className="row">
    <div className="col-md-6">
      <p><strong>Antecedentes Médicos:</strong> {selectedPaciente.antecedentes_medico}</p>
      <p><strong>Antecedentes Quirúrgicos:</strong> {selectedPaciente.antecedentes_quirurgico}</p>
      <p><strong>Antecedentes Alérgicos:</strong> {selectedPaciente.antecedentes_alergico}</p>
    </div>

    <div className="col-md-6">
      <p><strong>Antecedentes Traumáticos:</strong> {selectedPaciente.antecedentes_traumaticos}</p>
      <p><strong>Antecedentes Familiares:</strong> {selectedPaciente.antecedentes_familiares}</p>
      <p><strong>Vicios y Manías:</strong> {selectedPaciente.antecedentes_vicios_y_manias}</p>
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
              </div>
            )}
            {showUpdateModal && selectedPaciente && (
  <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
  <div className="modal-dialog modal-lg">
    <div className="modal-content">

        {/* Encabezado del modal */}
        <div className="modal-header">
          <h5 className="modal-title">Actualizar Paciente</h5>
          <button type="button" className="close" onClick={handleCloseUpdateModal}>
            &times;
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <div className="modal-dialog modal-lg">
        <div className="modal-content">
  {/* DATOS PERSONALES */}
  <h5 className="text-center">Datos Personales</h5>
  <div className="form-row">
    <div className="form-group col-md-6">
      <label>Nombre</label>
      <input type="text" className="form-control" value={selectedPaciente.nombre_paciente || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, nombre_paciente: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>DPI</label>
      <input type="text" className="form-control" value={selectedPaciente.dpi || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, dpi: e.target.value })} />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group col-md-6">
      <label>Fecha de Consulta</label>
      <input type="date" className="form-control" value={selectedPaciente.fecha_consulta ? selectedPaciente.fecha_consulta.slice(0,10) : ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, fecha_consulta: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Fecha de Nacimiento</label>
      <input type="date" className="form-control" value={selectedPaciente.fecha_nacimiento ? selectedPaciente.fecha_nacimiento.slice(0,10) : ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, fecha_nacimiento: e.target.value })} />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group col-md-6">
      <label>Sexo</label>
      <input type="text" className="form-control" value={selectedPaciente.sexo || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, sexo: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Religión</label>
      <input type="text" className="form-control" value={selectedPaciente.religion || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, religion: e.target.value })} />
    </div>
  </div>

  <div className="form-group">
    <label>Teléfono</label>
    <input type="text" className="form-control" value={selectedPaciente.telefono || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, telefono: e.target.value })} />
  </div>

  <div className="form-group">
    <label>Médico Responsable</label>
    <input type="text" className="form-control" value={selectedPaciente.medico_responsable || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, medico_responsable: e.target.value })} />
  </div>

  {/* DIAGNOSTICO */}
  <h5 className="text-center mt-4">Diagnóstico</h5>
  <div className="form-group">
    <textarea className="form-control" rows="2" value={selectedPaciente.diagnostico || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, diagnostico: e.target.value })}></textarea>
  </div>

  {/* MEDICAMENTOS */}
  <h5 className="text-center mt-4">Medicamentos Recetados</h5>
  <div className="form-group">
    <textarea className="form-control" rows="2" value={selectedPaciente.medicamentos_recetados ? selectedPaciente.medicamentos_recetados.join(', ') : ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, medicamentos_recetados: e.target.value.split(',').map(m => m.trim()) })}></textarea>
  </div>

  {/* ANTECEDENTES */}
  <h5 className="text-center mt-4">Antecedentes Médicos</h5>
  <div className="form-row">
    <div className="form-group col-md-6">
      <label>Antecedentes Médicos</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_medico || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_medico: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Antecedentes Quirúrgicos</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_quirurgico || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_quirurgico: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Antecedentes Alérgicos</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_alergico || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_alergico: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Antecedentes Traumáticos</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_traumaticos || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_traumaticos: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Antecedentes Familiares</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_familiares || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_familiares: e.target.value })} />
    </div>
    <div className="form-group col-md-6">
      <label>Vicios y Manías</label>
      <input type="text" className="form-control" value={selectedPaciente.antecedentes_vicios_y_manias || ''} onChange={(e) => setSelectedPaciente({ ...selectedPaciente, antecedentes_vicios_y_manias: e.target.value })} />
    </div>
  </div>
  </div>
  </div>
</div>

        {/* Pie del modal */}
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
        {/* /#page-content-wrapper */}
      </div>
    </div>
  );
}

export default Home;
