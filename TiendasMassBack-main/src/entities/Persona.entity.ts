import { Entity, PrimaryGeneratedColumn, Column, OneToOne, Index } from "typeorm";
import { Cliente } from "./Cliente.entity";
import { Empleado } from "./Empleado.entity";

@Entity("Persona")
export class Persona {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tipoDocumento: string; // DNI | CE | PASAPORTE (si quieres luego lo pasamos a enum)

  @Index({ unique: true })
  @Column({ length: 20 })
  numeroDocumento: string; // DNI: 8, etc.

  @Column({ length: 120 })
  nombres: string;

  @Column({ length: 120, nullable: true })
  apellidoPaterno?: string;

  @Column({ length: 120, nullable: true })
  apellidoMaterno?: string;

  @Column({ length: 255 })
  correo: string;

  @Column({ length: 20, nullable: true })
  telefono?: string;

  @Column({ type: "date", nullable: true })
  fechaNacimiento?: string;

  @Column({ length: 15, nullable: true })
  sexo?: string;

  @OneToOne(() => Cliente, (c) => c.persona)
  cliente?: Cliente;

  @OneToOne(() => Empleado, (e) => e.persona)
  empleado?: Empleado;
}
