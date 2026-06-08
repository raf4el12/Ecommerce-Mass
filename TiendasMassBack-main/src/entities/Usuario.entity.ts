import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Estado } from "./Estado.entity";
import { Rol } from './Rol.entity';
import { Pedido } from "./Pedidos.entity";
import { MetodoPago } from "./MetodoPago.entity";
import { Reporte } from "./Reportes.entity";
import { TarjetaUsuario } from './TarjetaUsuario.entity';
import { Direccion } from './Direccion.entity';
import { OneToOne } from "typeorm";
import { Cliente } from "./Cliente.entity";



@Entity("Usuario")
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255 })
  nombre: string;

  @Column("text", { nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  ciudad: string;

  @Column({ length: 10, nullable: true })
  codigoPostal: string;


  @ManyToOne(() => Estado, estado => estado.usuarios)
  estado: Estado;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @ManyToOne(() => Rol, { eager: true })
  rol: Rol;

  @OneToMany(() => Pedido, pedido => pedido.usuario)
  pedidos: Pedido[];

  @OneToMany(() => Reporte, reporte => reporte.usuario)
  reportes: Reporte[];

  @OneToMany(() => TarjetaUsuario, tarjeta => tarjeta.usuario)
  tarjetas: TarjetaUsuario[];

  @OneToMany(() => Direccion, direccion => direccion.usuario)
  direcciones: Direccion[];

  @OneToOne(() => Cliente, (c) => c.usuario)
  cliente?: Cliente;

  
}
