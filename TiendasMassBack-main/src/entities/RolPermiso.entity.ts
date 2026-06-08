import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Index } from "typeorm";
import { Rol } from "./Rol.entity";
import { Permiso } from "./Permiso.entity";

@Entity("RolPermiso")
@Index(["rolId", "permisoId"], { unique: true })
export class RolPermiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  rolId: number;

  @Column({ type: "int" })
  permisoId: number;

  @ManyToOne(() => Rol, (rol) => rol.rolPermisos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "rolId" })
  rol: Rol;

  @ManyToOne(() => Permiso, (p) => p.rolPermisos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "permisoId" })
  permiso: Permiso;
}
