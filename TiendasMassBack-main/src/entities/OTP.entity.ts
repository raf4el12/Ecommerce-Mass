import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Usuario } from "./Usuario.entity";

@Entity("OTP")
export class OTP {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column()
  email: string;

  @Column({ default: false })
  verificado: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  creadoEn: Date;

  @Column({ default: 0 })
  intentos: number;
}
