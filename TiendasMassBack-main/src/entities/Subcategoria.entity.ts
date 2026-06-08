import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Categoria } from './Categoria.entity';
import { Producto } from './Producto.entity';
import { Estado } from './Estado.entity';

@Entity('Subcategoria')
export class Subcategoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Categoria, categoria => categoria.subcategorias)
  categoria: Categoria;

  @ManyToMany(() => Producto, producto => producto.subcategorias)
  productos: Producto[];

  @ManyToOne(() => Estado, estado => estado.subcategorias)
  estado: Estado;
}
