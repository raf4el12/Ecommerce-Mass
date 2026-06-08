import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Cliente } from "../entities/Cliente.entity";

import { Persona } from "../entities/Persona.entity";
import { Empresa } from "../entities/Empresa.entity";
import { Usuario } from "../entities/Usuario.entity";

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const buildFullName = (nombres: string, apellidoPaterno?: string, apellidoMaterno?: string): string => {
  return normalizeSpaces([nombres, apellidoPaterno || "", apellidoMaterno || ""].filter(Boolean).join(" "));
};

export const updateClienteMe = async (req: Request, res: Response) => {
  try {
    const payload = (req as any).usuario;
    const usuarioId = payload?.id;
    if (!usuarioId) return res.status(401).json({ message: "No autenticado" });

    const { persona, empresa } = req.body;

    const repoCliente = AppDataSource.getRepository(Cliente);

    const cliente = await repoCliente.findOne({
      where: { usuario: { id: Number(usuarioId) } },
      relations: { persona: true, empresa: true, tipoCliente: true, usuario: true }
    });

    if (!cliente) return res.status(404).json({ message: "Cliente no encontrado" });

    // ✅ Actualizar Persona (si mandan datos)
    if (persona) {
      const repoPersona = AppDataSource.getRepository(Persona);
      repoPersona.merge(cliente.persona, {
        tipoDocumento: persona.tipoDocumento ?? cliente.persona.tipoDocumento,
        numeroDocumento: persona.numeroDocumento ?? cliente.persona.numeroDocumento,
        nombres: persona.nombres ?? cliente.persona.nombres,
        apellidoPaterno: persona.apellidoPaterno ?? cliente.persona.apellidoPaterno,
        apellidoMaterno: persona.apellidoMaterno ?? cliente.persona.apellidoMaterno,
        correo: persona.correo ?? cliente.persona.correo,
        telefono: persona.telefono ?? cliente.persona.telefono
      });
      await repoPersona.save(cliente.persona);

      // Sincronizar nombre visible de Usuario para evitar desalineación con Persona.
      if (cliente.usuario) {
        const repoUsuario = AppDataSource.getRepository(Usuario);
        const nombreCompleto = buildFullName(
          String(cliente.persona.nombres || ""),
          String(cliente.persona.apellidoPaterno || ""),
          String(cliente.persona.apellidoMaterno || "")
        );

        if (nombreCompleto) {
          cliente.usuario.nombre = nombreCompleto;
          await repoUsuario.save(cliente.usuario);
        }
      }
    }

    // ✅ Actualizar Empresa solo si el cliente es JURIDICO
    const tipoNombre = String(cliente.tipoCliente?.nombre || "").toUpperCase();
    if (tipoNombre === "JURIDICO") {
      const repoEmpresa = AppDataSource.getRepository(Empresa);

      // si no existe empresa aún, la crea
      if (!cliente.empresa) {
        if (!empresa?.ruc || !empresa?.razonSocial) {
          return res.status(400).json({ message: "Empresa requiere ruc y razonSocial" });
        }
        const nueva = repoEmpresa.create({
          ruc: String(empresa.ruc),
          razonSocial: empresa.razonSocial,
          nombreComercial: empresa.nombreComercial || "",
          correo: empresa.correo || cliente.persona.correo,
          telefono: empresa.telefono || cliente.persona.telefono
        });
        const empGuardada = await repoEmpresa.save(nueva);
        cliente.empresa = empGuardada;
      } else if (empresa) {
        repoEmpresa.merge(cliente.empresa, {
          ruc: empresa.ruc ?? cliente.empresa.ruc,
          razonSocial: empresa.razonSocial ?? cliente.empresa.razonSocial,
          nombreComercial: empresa.nombreComercial ?? cliente.empresa.nombreComercial,
          correo: empresa.correo ?? cliente.empresa.correo,
          telefono: empresa.telefono ?? cliente.empresa.telefono
        });
        await repoEmpresa.save(cliente.empresa);
      }
    }

    // ✅ también puedes guardar correo/telefono en Cliente si lo usas
    if (persona?.correo) cliente.correo = persona.correo;
    if (persona?.telefono) cliente.telefono = persona.telefono;

    await repoCliente.save(cliente);

    // devolver actualizado con relaciones
    const actualizado = await repoCliente.findOne({
      where: { id: cliente.id },
      relations: { persona: true, empresa: true, tipoCliente: true }
    });

    return res.status(200).json(actualizado);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error al actualizar datos de cliente" });
  }
};


export const getClienteMe = async (req: Request, res: Response) => {
  try {
    // ✅ tu middleware verificarToken guarda el payload en req.usuario
    const payload = (req as any).usuario;

    // ✅ tu token en login firma { id: usuario.id, ... }
    const usuarioId = payload?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autenticado: token sin id" });
    }

    const repo = AppDataSource.getRepository(Cliente);

    // ✅ si tu Cliente tiene relación OneToOne con Usuario (sin columna usuarioId)
    const cliente = await repo.findOne({
      where: { usuario: { id: Number(usuarioId) } },
      relations: {
        persona: true,
        empresa: true,
        tipoCliente: true,
        usuario: true
      }
    });

    if (!cliente) {
      return res.status(404).json({ message: "El usuario no tiene perfil de cliente" });
    }

    return res.status(200).json(cliente);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error al obtener perfil cliente" });
  }
};
