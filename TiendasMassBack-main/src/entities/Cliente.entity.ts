import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  RelationId
} from "typeorm";

import { Usuario } from "./Usuario.entity";
import { Persona } from "./Persona.entity";
import { Empresa } from "./Empresa.entity";
import { TipoCliente } from "./TipoCliente.entity";

@Entity("Cliente")
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  // 1 usuario -> 1 cliente (enganche con tu sistema actual)
  @Column({ nullable: true, unique: true })
  usuarioId?: number;

  @OneToOne(() => Usuario, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "usuarioId" })
  usuario?: Usuario;

  // Datos personales
  @Column()
  personaId: number;

  @OneToOne(() => Persona, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "personaId" })
  persona: Persona;

  // TipoCliente (tabla)
  @ManyToOne(() => TipoCliente, (t) => t.clientes, { nullable: false })
  @JoinColumn({ name: "tipoClienteId" })
  tipoCliente: TipoCliente;

  @RelationId((cliente: Cliente) => cliente.tipoCliente)
  tipoClienteId: number;

  // Empresa solo si es JURIDICO
  @Column({ nullable: true })
  empresaId?: number;

  @ManyToOne(() => Empresa, (e) => e.clientes, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "empresaId" })
  empresa?: Empresa;

  @Column({ length: 20, nullable: true })
  telefono?: string;

  @Column({ length: 255, nullable: true })
  correo?: string;
}
