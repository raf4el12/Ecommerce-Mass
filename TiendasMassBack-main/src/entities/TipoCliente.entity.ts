import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Cliente } from "./Cliente.entity";

@Entity("TipoCliente")
export class TipoCliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  nombre: string; // NATURAL | JURIDICO

  @Column({ length: 200, nullable: true })
  descripcion?: string;

  @OneToMany(() => Cliente, (c) => c.tipoCliente)
  clientes: Cliente[];
}
