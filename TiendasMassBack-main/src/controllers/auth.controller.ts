import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { Usuario } from '../entities/Usuario.entity';
import fs from 'fs';
import path from 'path';
import { crearOTP, validarOTP, registrarIntentoOTP } from '../services/otp.service';

const privateKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'private.key'), 'utf8');
const usuarioRepository = AppDataSource.getRepository(Usuario);

// Login general (para usuarios y administradores)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const usuario = await usuarioRepository.findOne({
      where: { email },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar si el usuario está activo
    if (usuario.estado?.nombre?.toLowerCase() !== 'activo') {
      res.status(401).json({ error: 'Usuario inactivo o suspendido' });
      return;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    // NO generar token aquí - solo retornar datos del usuario
    // El token se generará después de verificar el OTP
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
      requiresOTP: true
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Login específico para administradores (ahora permite cualquier usuario con permisos)
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const usuario = await usuarioRepository.findOne({
      where: { email },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar si el usuario está activo
    if (usuario.estado?.nombre?.toLowerCase() !== 'activo') {
      res.status(401).json({ error: 'Usuario inactivo o suspendido' });
      return;
    }

    // Verificar si es administrador O tiene un rol asignado (para usuarios con permisos específicos)
    const rolNombre = usuario.rol?.nombre?.toLowerCase();
    const esAdmin = rolNombre && (rolNombre.includes('admin') || rolNombre.includes('administrador'));
    
    if (!usuario.rol) {
      res.status(403).json({ error: 'Acceso denegado. Usuario sin rol asignado' });
      return;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    // Generar token JWT para el usuario
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol?.nombre,
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '24h'
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
      isAdmin: esAdmin
    });

  } catch (error: any) {
    console.error('Error en admin login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar token
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, privateKey) as any;

    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const usuario = await usuarioRepository.findOne({
      where: { id: decoded.userId },
      relations: ['estado', 'rol'],
    });

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

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
      isValid: true
    });

  } catch (error: any) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Solicitar OTP para verificación de dos factores
export const solicitarOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email es requerido' });
      return;
    }

    // Verificar que el usuario existe
    const usuario = await usuarioRepository.findOne({
      where: { email },
      relations: ['estado']
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (usuario.estado?.nombre?.toLowerCase() !== 'activo') {
      res.status(401).json({ error: 'Usuario inactivo o suspendido' });
      return;
    }

    // Crear y enviar OTP
    const resultado = await crearOTP(email, usuario.id);

    if (!resultado) {
      res.status(500).json({ error: 'No se pudo enviar el código OTP' });
      return;
    }

    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
      mensaje: 'Código OTP enviado al email',
      email: email,
      // ⚠️ Solo en dev: expone el código en el response para visualizarlo
      //    en DevTools → Network. NUNCA se envía cuando NODE_ENV=production.
      ...(isDev && { codigoDev: resultado }),
    });

  } catch (error: any) {
    console.error('Error al solicitar OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar OTP
export const verificarOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      res.status(400).json({ error: 'Email y código OTP son requeridos' });
      return;
    }

    // Validar OTP
    const esValido = await validarOTP(email, codigo);

    if (!esValido) {
      await registrarIntentoOTP(email);
      res.status(401).json({ error: 'Código OTP inválido o expirado' });
      return;
    }

    // OTP válido, generar token
    const usuario = await usuarioRepository.findOne({
      where: { email },
      relations: ['estado', 'rol']
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol?.nombre,
        verificado2FA: true
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '24h'
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
      expiresIn: '24h',
      mensaje: 'Verificación completada'
    });

  } catch (error: any) {
    console.error('Error al verificar OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};