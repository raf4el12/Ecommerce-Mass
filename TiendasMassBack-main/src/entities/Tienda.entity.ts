import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('Tienda')
export class Tienda {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true
  })
  nombre: string;

@Column({ type: 'varchar', length: 200 })
direccion: string;


  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  telefono: string;

  @Column({
    type: 'boolean',
    default: true
  })
  activo: boolean;
  
  @CreateDateColumn()
  createdAt: Date;  
  @UpdateDateColumn()
  updatedAt: Date;  
}
