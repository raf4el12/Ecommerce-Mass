import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm";
import { RolPermiso } from "./RolPermiso.entity";

export enum AdminModulo {
  DASHBOARD = "DASHBOARD",
  PRODUCTOS = "PRODUCTOS",
  CATEGORIAS = "CATEGORIAS",
  SUBCATEGORIAS = "SUBCATEGORIAS",
  ESTADOS = "ESTADOS",
  MASTER_TABLE = "MASTER_TABLE",
  METODO_PAGO = "METODO_PAGO",
  METODO_ENVIO = "METODO_ENVIO",
  TIENDAS = "TIENDAS",
  USUARIOS = "USUARIOS",
  PEDIDOS = "PEDIDOS",
}

export enum AdminAccion {
  READ = "READ",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

@Entity("Permiso")
@Index(["modulo", "accion"], { unique: true })
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: AdminModulo })
  modulo: AdminModulo;

  @Column({ type: "enum", enum: AdminAccion })
  accion: AdminAccion;

  @OneToMany(() => RolPermiso, (rp) => rp.permiso)
  rolPermisos: RolPermiso[];
}
