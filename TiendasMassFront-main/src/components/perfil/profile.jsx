import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import './styleperfil.css';
import Swal from 'sweetalert2';
import { validatePerfilForm, validateField } from '../../utils/perfilvalidaciones';
const API_URL = "http://localhost:5001";
const Profile = ({ userData, setUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [clienteData, setClienteData] = useState(null);
  const [clienteLoading, setClienteLoading] = useState(true);


  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    codigoPostal: ''
  });

  const [clienteForm, setClienteForm] = useState({
  persona: {
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    telefono: ''
  },
  empresa: {
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    correo: '',
    telefono: ''
  }
});


  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: userData.nombre || '',
        telefono: userData.telefono || '',
        ciudad: userData.ciudad || '',
        direccion: userData.direccion || '',
        codigoPostal: userData.codigoPostal || ''
      });
    }
  }, [userData]);

  //traenos los datos de si es juridico o natural
useEffect(() => {
  const fetchCliente = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        console.warn("No hay token en localStorage");
        setClienteData(null);
        return;
      }

      const res = await fetch(`${API_URL}/api/clientes/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => null);

      console.log("clientes/me status:", res.status);
      console.log("clientes/me data:", data);

      if (!res.ok) {
        setClienteData(null);
        return;
      }

      setClienteData(data);
      setClienteForm({
            persona: {
              numeroDocumento: data?.persona?.numeroDocumento || '',
              nombres: data?.persona?.nombres || '',
              apellidoPaterno: data?.persona?.apellidoPaterno || '',
              apellidoMaterno: data?.persona?.apellidoMaterno || '',
              correo: data?.persona?.correo || '',
              telefono: data?.persona?.telefono || ''
            },
            empresa: {
              ruc: data?.empresa?.ruc || '',
              razonSocial: data?.empresa?.razonSocial || '',
              nombreComercial: data?.empresa?.nombreComercial || '',
              correo: data?.empresa?.correo || '',
              telefono: data?.empresa?.telefono || ''
            }
      });


    } catch (e) {
      console.error("Error fetchCliente:", e);
      setClienteData(null);
    } finally {
      setClienteLoading(false);
    }
  };

  fetchCliente();
}, []);



  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Validación en tiempo real
    const error = validateField(field, value, formData);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

 const handleSave = async () => {
  const errors = validatePerfilForm(formData);
  setFieldErrors(errors);
  if (Object.keys(errors).length > 0) return;

  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No hay token. Vuelve a iniciar sesión.' });
      return;
    }

    // 1) Guardar Usuario
    const response = await fetch(`${API_URL}/api/usuarios/update/${userData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json().catch(() => null);
    console.log("update usuario status:", response.status);
    console.log("update usuario body:", result);

    if (!response.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error usuario',
        text: result?.message || 'Error al guardar los datos del usuario',
      });
      return;
    }

    setUserData(result.usuario);
    setFormData(result.usuario);

    // 2) Guardar Cliente/Persona/Empresa
    if (clienteData) {
      const resCliente = await fetch(`${API_URL}/api/clientes/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clienteForm),
      });

      const dataCliente = await resCliente.json().catch(() => null);
      console.log("update cliente status:", resCliente.status);
      console.log("update cliente body:", dataCliente);
      
      if (!resCliente.ok) {
        Swal.fire({
          icon: 'error',
          title: `Error cliente (${resCliente.status})`,
          text: (dataCliente && (dataCliente.message || dataCliente.error)) || 'Error al guardar datos de cliente',
        });
        console.log("PUT /clientes/me status:", resCliente.status, "body:", dataCliente);
        return;
      }


      setClienteData(dataCliente);
    }

    setIsEditing(false);
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Perfil actualizado correctamente',
    });

  } catch (error) {
    console.error("ERROR handleSave:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.message || 'Error al guardar el perfil',
    });
  }
};



  const handleToggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setFormData({
        nombre: userData.nombre || '',
        telefono: userData.telefono || '',
        ciudad: userData.ciudad || '',
        direccion: userData.direccion || '',
        codigoPostal: userData.codigoPostal || ''
      });
      setFieldErrors({});
      setIsEditing(true);
    }
  };

  const fullNameParts = String(userData?.nombre || '').trim().split(/\s+/).filter(Boolean);
  const nombresFallback = fullNameParts[0] || '';
  const apellidoPaternoFallback = fullNameParts[1] || '';
  const apellidoMaternoFallback = fullNameParts.slice(2).join(' ');

  return (
    <div className="profile-section">
      <div className="section-header">
        <div className="header-content">
          <h2>Mi Perfil</h2>
          <p>Gestiona tu información personal</p>
        </div>
        <button className="edit-btn" onClick={handleToggleEdit}>
          <Edit3 size={16} />
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre completo</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className={fieldErrors.nombre ? 'input-error' : ''}
                  />
                  {fieldErrors.nombre && (
                    <span className="error-text">{fieldErrors.nombre}</span>
                  )}
                </>
              ) : (
                <div className="field-display">{userData.nombre}</div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="field-display">{userData.email}</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombres</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.persona.nombres}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, nombres: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData?.persona?.nombres || nombresFallback || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label>Apellido Paterno</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.persona.apellidoPaterno}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, apellidoPaterno: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData?.persona?.apellidoPaterno || apellidoPaternoFallback || '-'}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Apellido Materno</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.persona.apellidoMaterno}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, apellidoMaterno: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData?.persona?.apellidoMaterno || apellidoMaternoFallback || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label>Tipo de cliente</label>
              <div className="field-display">
                {clienteLoading ? "Cargando..." : (clienteData?.tipoCliente?.nombre || "Sin perfil de cliente")}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              {isEditing ? (
                <>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={fieldErrors.telefono ? 'input-error' : ''}
                  />
                  {fieldErrors.telefono && (
                    <span className="error-text">{fieldErrors.telefono}</span>
                  )}
                </>
              ) : (
                <div className="field-display">{userData.telefono}</div>
              )}
            </div>

            <div className="form-group">
              <label>Ciudad</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    className={fieldErrors.ciudad ? 'input-error' : ''}
                  />
                  {fieldErrors.ciudad && (
                    <span className="error-text">{fieldErrors.ciudad}</span>
                  )}
                </>
              ) : (
                <div className="field-display">{userData.ciudad}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    className={fieldErrors.direccion ? 'input-error' : ''}
                  />
                  {fieldErrors.direccion && (
                    <span className="error-text">{fieldErrors.direccion}</span>
                  )}
                </>
              ) : (
                <div className="field-display">{userData.direccion}</div>
              )}
            </div>

            <div className="form-group">
              <label>Código Postal</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={formData.codigoPostal}
                    onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                    className={fieldErrors.codigoPostal ? 'input-error' : ''}
                  />
                  {fieldErrors.codigoPostal && (
                    <span className="error-text">{fieldErrors.codigoPostal}</span>
                  )}
                </>
              ) : (
                <div className="field-display">{userData.codigoPostal}</div>
              )}
            </div>
          </div>

{/* ===== Datos de Cliente (Natural / Jurídico) ===== */}
<div className="profile-form" style={{ marginTop: 20 }}>
  {!clienteLoading && clienteData && (
    <>
      {/* ===================== NATURAL ===================== */}
      {clienteData.tipoCliente?.nombre === "NATURAL" && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>DNI</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.persona.numeroDocumento}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, numeroDocumento: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.persona?.numeroDocumento || "-"}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo (Persona)</label>
              {isEditing ? (
                <input
                  type="email"
                  value={clienteForm.persona.correo}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, correo: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.persona?.correo || "-"}</div>
              )}
            </div>

            <div className="form-group">
              <label>Teléfono (Persona)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.persona.telefono}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      persona: { ...prev.persona, telefono: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.persona?.telefono || "-"}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================== JURIDICO ===================== */}
      {clienteData.tipoCliente?.nombre === "JURIDICO" && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>RUC</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.empresa.ruc}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, ruc: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.empresa?.ruc || "-"}</div>
              )}
            </div>

            <div className="form-group">
              <label>Razón Social</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.empresa.razonSocial}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, razonSocial: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.empresa?.razonSocial || "-"}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre Comercial</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.empresa.nombreComercial}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, nombreComercial: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.empresa?.nombreComercial || "-"}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Correo (Empresa)</label>
              {isEditing ? (
                <input
                  type="email"
                  value={clienteForm.empresa.correo}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, correo: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.empresa?.correo || "-"}</div>
              )}
            </div>

            <div className="form-group">
              <label>Teléfono (Empresa)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={clienteForm.empresa.telefono}
                  onChange={(e) =>
                    setClienteForm(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, telefono: e.target.value }
                    }))
                  }
                />
              ) : (
                <div className="field-display">{clienteData.empresa?.telefono || "-"}</div>
              )}
            </div>
          </div>

        </>
      )}
    </>
  )}

  {!clienteLoading && !clienteData && (
    <div className="form-row">
      <div className="form-group">
        <div className="field-display">
          Este usuario aún no tiene datos de cliente (natural/jurídico).
        </div>
      </div>
    </div>
  )}
</div>

          

        </div>
      </div>
    </div>
  );
};

export default Profile;
