
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from './Home';
import HomeFarmacia from './HomeFarmacia';
import AgregarUsuario from './AgregarUsuario';
import Proveedores from './Proveedores';
import Agregar from './Agregar_Productos';
import Historial from './historial_medico';
import BuscarPa from './Buscar_paciente';
import AgendarCita from './AgendarCita';
import Agendarcita1 from './agendarcita1';
import Agenda from './Agenda';
import Reportes from './reportes';
import Login from './Login';
import Devoluciones from './Devoluciones';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from './AuthContext';
import Encamamiento from './Encamamiento';
import MedicamentosView from './MedicamentosView';
import Turnos from './GenerarTurno';
import VerTurnos from './PantallaTurnos';
import VerTurnosPublico from './PantallaTurnosPublico';
import CierresDeCaja from './CierresDeCaja';
import Enfermero from './enfermero';
import 'bootstrap/dist/css/bootstrap.min.css';
import HistorialEncamamiento from './HistorialEncamamiento';

// =======================
// 🚀 LAZY LOADING
// =======================
// Estas páginas NO deben cargarse hasta entrar a ellas (evita que la caja se abra sola)
const Ventas = React.lazy(() => import('./ventas'));
const Ventas2 = React.lazy(() => import('./Ventas2'));


// =======================
// 📌 COMPONENTE PRINCIPAL
// =======================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* HOME */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/Home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/HomeFarmacia" element={<PrivateRoute><HomeFarmacia /></PrivateRoute>} />

          {/* ADMIN */}
          <Route path="/AgregarUsuario" element={<PrivateRoute><AgregarUsuario /></PrivateRoute>} />
          <Route path="/Proveedores" element={<PrivateRoute><Proveedores /></PrivateRoute>} />
          <Route path="/Agregar_productos" element={<PrivateRoute><Agregar /></PrivateRoute>} />

          {/* CLÍNICA */}
          <Route path="/Historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
          <Route path="/Buscar_paciente" element={<PrivateRoute><BuscarPa /></PrivateRoute>} />
          <Route path="/Encamamiento" element={<PrivateRoute><Encamamiento /></PrivateRoute>} />
          <Route path="/Agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
          <Route path="/AgendarCita" element={<PrivateRoute><AgendarCita /></PrivateRoute>} />
          <Route path="/Agendarcita1" element={<PrivateRoute><Agendarcita1 /></PrivateRoute>} />
          <Route path="/HistorialEncamamiento" element={<PrivateRoute><HistorialEncamamiento /></PrivateRoute>} />

          {/* 🔥 FARMACIA / VENTAS (Lazy loading) */}
          <Route 
            path="/ventas" 
            element={
              <PrivateRoute>
                <Suspense fallback={<div>Cargando ventas...</div>}>
                  <Ventas />
                </Suspense>
              </PrivateRoute>
            } 
          />

          <Route 
            path="/ventas2" 
            element={
              <PrivateRoute>
                <Suspense fallback={<div>Cargando ventas 2...</div>}>
                  <Ventas2 />
                </Suspense>
              </PrivateRoute>
            } 
          />

          <Route path="/Devoluciones" element={<PrivateRoute><Devoluciones /></PrivateRoute>} />
          <Route path="/medicamentos" element={<PrivateRoute><MedicamentosView /></PrivateRoute>} />
          <Route path="/enfermero" element={<PrivateRoute><Enfermero /></PrivateRoute>} />

          {/* REPORTES */}
          <Route path="/Reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />

          {/* TURNOS */}
          <Route path="/Turnos" element={<PrivateRoute><Turnos /></PrivateRoute>} />
          <Route path="/VerTurnos" element={<PrivateRoute><VerTurnos /></PrivateRoute>} />
          <Route path="/VerTurnosPublico" element={<PrivateRoute><VerTurnosPublico /></PrivateRoute>} />

          {/* CIERRES DE CAJA */}
          <Route path="/cierres" element={<PrivateRoute><CierresDeCaja /></PrivateRoute>} />


        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
