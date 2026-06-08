import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/data-source';
import { OTP } from '../entities/OTP.entity';

// Configurar transporter de Nodemailer
// Usar Gmail con contraseña de aplicación (app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tu_email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'tu_app_password'
  }
});

const otpRepository = AppDataSource.getRepository(OTP);

// Generar código OTP aleatorio de 6 dígitos
export const generarCodigoOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar OTP por email
export const enviarOTP = async (email: string, codigo: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu_email@gmail.com',
      to: email,
      subject: 'Código de Verificación - TiendasMass',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Código de Verificación</h2>
          <p>Tu código de verificación es:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${codigo}</h1>
          </div>
          <p style="color: #666;">Este código expira en 10 minutos.</p>
          <p style="color: #999; font-size: 12px;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error al enviar OTP:', error);
    return false;
  }
};

// Crear y guardar OTP en la BD
export const crearOTP = async (email: string, usuarioId?: number): Promise<string | null> => {
  try {
    // Eliminar OTPs anteriores no verificados
    await otpRepository.delete({
      email,
      verificado: false
    });

    const codigo = generarCodigoOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const nuevoOTP = otpRepository.create({
      codigo,
      email,
      expiresAt,
      verificado: false,
      intentos: 0,
      usuario: usuarioId ? { id: usuarioId } : undefined
    });

    await otpRepository.save(nuevoOTP);

    const isDev = process.env.NODE_ENV !== 'production';

    // En dev: imprime el código en la consola del backend (útil si no abres DevTools)
    if (isDev) {
      console.log(`\n🔑 [OTP DEV] ${email} → ${codigo}  (expira en 10 min)\n`);
    }

    // Intentar enviar por email. En dev no rompe si falla (credenciales SMTP ausentes).
    const enviado = await enviarOTP(email, codigo);

    if (!enviado && !isDev) {
      throw new Error('No se pudo enviar el email');
    }

    return codigo;
  } catch (error) {
    console.error('Error al crear OTP:', error);
    return null;
  }
};

// Validar OTP
export const validarOTP = async (email: string, codigo: string): Promise<boolean> => {
  try {
    const otp = await otpRepository.findOne({
      where: {
        email,
        codigo,
        verificado: false
      }
    });

    if (!otp) {
      return false;
    }

    // Verificar si expiró
    if (new Date() > otp.expiresAt) {
      return false;
    }

    // Marcar como verificado
    otp.verificado = true;
    await otpRepository.save(otp);

    return true;
  } catch (error) {
    console.error('Error al validar OTP:', error);
    return false;
  }
};

// Registrar intento fallido
export const registrarIntentoOTP = async (email: string): Promise<void> => {
  try {
    const otp = await otpRepository.findOne({
      where: {
        email,
        verificado: false
      },
      order: {
        creadoEn: 'DESC'
      }
    });

    if (otp && otp.intentos < 5) {
      otp.intentos += 1;
      await otpRepository.save(otp);
    }
  } catch (error) {
    console.error('Error al registrar intento:', error);
  }
};
