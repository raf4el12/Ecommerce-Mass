import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RolPermiso } from "./RolPermiso.entity";

@Entity("Rol")
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @OneToMany(() => RolPermiso, (rp) => rp.rol)
  rolPermisos: RolPermiso[];
}
