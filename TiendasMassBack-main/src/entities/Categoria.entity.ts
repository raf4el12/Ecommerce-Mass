import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Producto } from './Producto.entity';
import { Estado } from './Estado.entity';
import { Subcategoria } from './Subcategoria.entity';
import { ManyToOne } from 'typeorm';

@Entity('Categoria')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => Producto, producto => producto.categoria)
  productos: Producto[];

  @OneToMany(() => Subcategoria, subcategoria => subcategoria.categoria)
  subcategorias: Subcategoria[];
  
  @ManyToOne(() => Estado, estado => estado.categorias)
  estado: Estado;
}
