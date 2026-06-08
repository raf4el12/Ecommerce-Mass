import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm";
import { Cliente } from "./Cliente.entity";

@Entity("Empresa")
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 11 })
  ruc: string; // 11 dígitos

  @Column({ length: 200 })
  razonSocial: string;

  @Column({ length: 200, nullable: true })
  nombreComercial?: string;

  @Column({ length: 255 })
  correo: string;

  @Column({ length: 20, nullable: true })
  telefono?: string;

  @OneToMany(() => Cliente, (c) => c.empresa)
  clientes: Cliente[];
}
