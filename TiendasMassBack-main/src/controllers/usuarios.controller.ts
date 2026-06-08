import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { Usuario } from '../entities/Usuario.entity';
import { Estado } from '../entities/Estado.entity';
import { Rol } from '../entities/Rol.entity';

import { Persona } from '../entities/Persona.entity';
import { Cliente } from '../entities/Cliente.entity';
import { Empresa } from '../entities/Empresa.entity';
import { TipoCliente } from '../entities/TipoCliente.entity';

//JWT
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const privateKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'private.key'), 'utf8');

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, ' ').trim();

const buildFullName = (nombres: string, apellidoPaterno?: string, apellidoMaterno?: string): string => {
  return normalizeSpaces([nombres, apellidoPaterno || '', apellidoMaterno || ''].filter(Boolean).join(' '));
};

const usuarioRepository = AppDataSource.getRepository(Usuario);
const estadoRepository = AppDataSource.getRepository(Estado);

// Obtener todos los usuarios
export const getAllUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await usuarioRepository.find({
      relations: ['estado', 'rol'], // Incluye el estado y rol en la respuesta
    });
    res.json(usuarios);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// Obtener usuario por ID
export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuario = await usuarioRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      ciudad: usuario.ciudad,
      codigoPostal: usuario.codigoPostal,
      estado: usuario.estado.nombre,
      rol: usuario.rol ? {
        id: usuario.rol.id,
        nombre: usuario.rol.nombre
      } : null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Registrar nuevo usuario
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      direccion,
      estadoId = 1,  
      telefono,
      ciudad,
      codigoPostal,
      rolId = 2  ,
      // ✅ NUEVO (viene del front)
      tipoClienteId,
      persona,
      empresa
    } = req.body;

    const personaNombres = normalizeSpaces(String(persona?.nombres ?? persona?.nombre ?? ''));
    const personaApellidoPaterno = normalizeSpaces(String(persona?.apellidoPaterno ?? ''));
    const personaApellidoMaterno = normalizeSpaces(String(persona?.apellidoMaterno ?? ''));
    const nombreCompleto = buildFullName(personaNombres, personaApellidoPaterno, personaApellidoMaterno);

    // Validaciones de entrada
    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    if (!persona || !personaNombres) {
      res.status(400).json({ message: 'Los datos de persona son requeridos y nombres es obligatorio' });
      return;
    }

    // Validación del nombre completo derivado desde Persona
    if (nombreCompleto.length < 2) {
      res.status(400).json({ message: 'El nombre completo debe tener al menos 2 caracteres' });
      return;
    }

    if (nombreCompleto.length > 255) {
      res.status(400).json({ message: 'El nombre completo no puede exceder 255 caracteres' });
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(nombreCompleto)) {
      res.status(400).json({ message: 'El nombre completo solo puede contener letras y espacios' });
      return;
    }

    // Validación de email (formato y longitud)
    if (email.length > 254) {
      res.status(400).json({ message: 'El correo electrónico no puede exceder 254 caracteres' });
      return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Formato de correo electrónico inválido' });
      return;
    }

    // Normalizar email (trim y lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Validación de contraseña (6-128 caracteres, mayúscula, minúscula, número, sin espacios)
    if (password.length < 6) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    if (password.length > 128) {
      res.status(400).json({ message: 'La contraseña no puede exceder 128 caracteres' });
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ message: 'La contraseña debe contener al menos una letra mayúscula' });
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      res.status(400).json({ message: 'La contraseña debe contener al menos una letra minúscula' });
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      res.status(400).json({ message: 'La contraseña debe contener al menos un número' });
      return;
    }
    
    if (/\s/.test(password)) {
      res.status(400).json({ message: 'La contraseña no puede contener espacios' });
      return;
    }

    // Validación de dirección (opcional, pero si se llena debe tener 5-200 caracteres)
    if (direccion && direccion.trim().length > 0) {
      if (direccion.trim().length < 5) {
        res.status(400).json({ message: 'La dirección debe tener al menos 5 caracteres' });
        return;
      }
      
      if (direccion.length > 200) {
        res.status(400).json({ message: 'La dirección no puede exceder 200 caracteres' });
        return;
      }
    }

    // Verifica si el usuario ya existe
    const usuarioExistente = await usuarioRepository.findOneBy({ email: normalizedEmail });
    if (usuarioExistente) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return;
    }

    // Busca el rol por ID (más eficiente)
    const rol = await AppDataSource.getRepository(Rol).findOneBy({ id: rolId });
    if (!rol) {
      res.status(400).json({ message: `Rol con ID ${rolId} no encontrado` });
      return;
    }

    // Busca el estado por ID
    const estado = await estadoRepository.findOneBy({ id: estadoId });
    if (!estado) {
      res.status(400).json({ message: `Estado con ID ${estadoId} no encontrado` });
      return;
    }

      // ✅ Validar que venga tipoClienteId y persona
    if (!tipoClienteId) {
      res.status(400).json({ message: 'tipoClienteId es requerido' });
      return;
    }
    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // ✅ Todo en transacción para que no quede a medias
    const resultado = await AppDataSource.transaction(async (manager) => {
      const rolRepo = manager.getRepository(Rol);
      const estadoRepo = manager.getRepository(Estado);
      const usuarioRepo = manager.getRepository(Usuario);

      const tipoClienteRepo = manager.getRepository(TipoCliente);
      const personaRepo = manager.getRepository(Persona);
      const empresaRepo = manager.getRepository(Empresa);
      const clienteRepo = manager.getRepository(Cliente);

      // Revalidar rol/estado dentro de transacción
      const rolTx = await rolRepo.findOneBy({ id: rolId });
      if (!rolTx) throw new Error(`Rol con ID ${rolId} no encontrado`);

      const estadoTx = await estadoRepo.findOneBy({ id: estadoId });
      if (!estadoTx) throw new Error(`Estado con ID ${estadoId} no encontrado`);

      // TipoCliente (tabla)
      const tipo = await tipoClienteRepo.findOneBy({ id: Number(tipoClienteId) });
      if (!tipo) throw new Error(`TipoCliente con ID ${tipoClienteId} no encontrado`);

      const tipoNombre = String(tipo.nombre).toUpperCase(); // NATURAL | JURIDICO

      // Validaciones por tipo (mínimas)
      if (tipoNombre === 'NATURAL') {
        const dni = String(persona.numeroDocumento || '');
        if (dni.length !== 8) throw new Error('DNI inválido (debe tener 8 dígitos)');
      }

      if (tipoNombre === 'JURIDICO') {
        if (!empresa) throw new Error('Datos de empresa requeridos para persona jurídica');
        const ruc = String(empresa.ruc || '');
        if (ruc.length !== 11) throw new Error('RUC inválido (debe tener 11 dígitos)');
        if (!empresa.razonSocial) throw new Error('Razón social es obligatoria');
      }

      // 1) Crear Usuario (igual que antes)
      const nuevoUsuarioTx = usuarioRepo.create({
        nombre: nombreCompleto,
        email: normalizedEmail,
        password: hashedPassword,
        direccion,
        estado: estadoTx,
        telefono,
        ciudad,
        codigoPostal,
        rol: rolTx
      });

      const usuarioGuardadoTx = await usuarioRepo.save(nuevoUsuarioTx);

      // 2) Crear Persona
      const personaTx = personaRepo.create({
        tipoDocumento: persona.tipoDocumento || 'DNI',
        numeroDocumento: String(persona.numeroDocumento || ''),
        nombres: personaNombres,
        apellidoPaterno: personaApellidoPaterno || '',
        apellidoMaterno: personaApellidoMaterno || '',
        correo: (persona.correo || normalizedEmail).trim().toLowerCase(),
        telefono: persona.telefono || telefono || ''
      });

      const personaGuardada = await personaRepo.save(personaTx);

      // 3) Crear Empresa si es JURIDICO
      let empresaGuardada: Empresa | null = null;

      if (tipoNombre === 'JURIDICO') {
        // Evitar duplicado por RUC (si ya existe)
        const existeEmpresa = await empresaRepo.findOne({ where: { ruc: String(empresa.ruc) } });
        if (existeEmpresa) throw new Error('Ya existe una empresa con ese RUC');

        const empresaTx = empresaRepo.create({
          ruc: String(empresa.ruc),
          razonSocial: empresa.razonSocial,
          nombreComercial: empresa.nombreComercial || '',
          correo: (empresa.correo || normalizedEmail).trim().toLowerCase(),
          telefono: empresa.telefono || telefono || ''
        });

        empresaGuardada = await empresaRepo.save(empresaTx);
      }

      const clienteTx = clienteRepo.create({
        usuario: usuarioGuardadoTx,
        personaId: personaGuardada.id,
        tipoCliente: tipo,
        empresa: empresaGuardada ?? undefined,
        correo: normalizedEmail,
        telefono: persona.telefono || telefono || ''
      });


      const clienteGuardado = await clienteRepo.save(clienteTx);

      return { usuarioGuardadoTx, clienteGuardado, personaGuardada, empresaGuardada, rolTx, estadoTx };
    });

    // ✅ Respuesta (misma estructura que ya tenías) + clienteId
    res.status(201).json({
      id: resultado.usuarioGuardadoTx.id,
      nombre: resultado.usuarioGuardadoTx.nombre,
      email: resultado.usuarioGuardadoTx.email,
      direccion: resultado.usuarioGuardadoTx.direccion,
      telefono: resultado.usuarioGuardadoTx.telefono,
      ciudad: resultado.usuarioGuardadoTx.ciudad,
      codigoPostal: resultado.usuarioGuardadoTx.codigoPostal,
      estado: {
        id: resultado.estadoTx.id,
        nombre: resultado.estadoTx.nombre
      },
      rol: {
        id: resultado.rolTx.id,
        nombre: resultado.rolTx.nombre
      },

      // ✅ extra para debug/uso
      clienteId: resultado.clienteGuardado.id
    });
        return; // opcional, pero ayuda
  } catch (error: any) {
    console.error('Error en register:', error);
    res.status(500).json({ message: error.message || 'Error interno del servidor' });
    return;
  }
};



// Iniciar sesión
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validaciones de entrada
    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    // Normalizar email (trim y lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    const usuario = await usuarioRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      res.status(401).json({ message: 'Contraseña incorrecta' });
      return;
    }

    // Crear token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol.nombre
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '2h'
      }
    );

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        direccion: usuario.direccion || "",
        telefono: usuario.telefono,
        ciudad: usuario.ciudad,
        codigoPostal: usuario.codigoPostal,
        estado: usuario.estado,
        rol: usuario.rol
      },
      token: token,
      expiresIn: '2h'
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar 
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, ciudad, codigoPostal, estadoId, rolId, password } = req.body;

    const usuario = await usuarioRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (estadoId !== undefined) {
      const estado = await estadoRepository.findOneBy({ id: estadoId });
      if (!estado) {
        res.status(400).json({ message: 'Estado no válido' });
        return;
      }
      usuario.estado = estado;
    }

    if (rolId !== undefined) {
      const rol = await AppDataSource.getRepository(Rol).findOneBy({ id: rolId });
      if (!rol) {
        res.status(400).json({ message: `Rol con ID ${rolId} no encontrado` });
        return;
      }
      usuario.rol = rol;
    }

    if (nombre !== undefined) usuario.nombre = nombre;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (ciudad !== undefined) usuario.ciudad = ciudad;
    if (codigoPostal !== undefined) usuario.codigoPostal = codigoPostal;
    
    if (password !== undefined && password.trim() !== '') {
      usuario.password = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = await usuarioRepository.save(usuario);

    res.json({
      message: 'Perfil actualizado correctamente',
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        direccion: usuarioActualizado.direccion,
        telefono: usuarioActualizado.telefono,
        ciudad: usuarioActualizado.ciudad,
        codigoPostal: usuarioActualizado.codigoPostal,
        estado: usuarioActualizado.estado ? {
          id: usuarioActualizado.estado.id,
          nombre: usuarioActualizado.estado.nombre
        } : null,
        rol: usuarioActualizado.rol ? {
          id: usuarioActualizado.rol.id,
          nombre: usuarioActualizado.rol.nombre
        } : null,
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


import { OTP } from "../entities/OTP.entity";

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuario = await usuarioRepository.findOneBy({ id: parseInt(id, 10) });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Eliminar OTPs relacionados antes de borrar usuario
    const otpRepo = AppDataSource.getRepository(OTP);
    await otpRepo.delete({ usuario: { id: usuario.id } });

    try {
      await usuarioRepository.remove(usuario);
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      // Error de foreign key
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message?.includes('a foreign key constraint fails')) {
        res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene registros relacionados en otras tablas.' });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

