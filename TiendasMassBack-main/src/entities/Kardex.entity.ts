import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Producto } from "./Producto.entity";
import { Usuario } from "./Usuario.entity";

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE'
}

@Entity("Kardex")
export class Kardex {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Producto, { eager: true })
  producto: Producto;

  @Column({
    type: "enum",
    enum: TipoMovimiento
  })
  tipo_movimiento: TipoMovimiento;

  @Column("int")
  cantidad: number;

  @Column("int")
  stock_anterior: number;

  @Column("int")
  stock_nuevo: number;

  @Column({ length: 255 })
  motivo: string;

  @Column({ length: 100, nullable: true })
  referencia_id: string;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  usuario: Usuario;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
