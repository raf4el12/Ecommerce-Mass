import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Persona } from "./Persona.entity";

@Entity("Empleado")
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  personaId: number;

  @OneToOne(() => Persona, { cascade: true, onDelete: "CASCADE" })  
  @JoinColumn({ name: "personaId" })
  persona: Persona;

  @Column({ type: "date" })
  fechaInicio: string;

  @Column({ type: "date", nullable: true })
  fechaFin?: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  salario?: number;

  @Column({ length: 30, default: "ACTIVO" })
  estado: string;
}
