import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";

@Entity("MasterTable")
@Index(["parentId", "value"], { unique: true }) // value único por parent
export class MasterTable {
  @PrimaryColumn({ name: "idMasterTable", type: "int" })
  id: number;

  @Column({ name: "idMasterTableParent", type: "int", nullable: true })
  parentId: number | null;

  @ManyToOne(() => MasterTable, (mt) => mt.children, { nullable: true })
  @JoinColumn({ name: "idMasterTableParent" })
  parent?: MasterTable | null;

  @OneToMany(() => MasterTable, (mt) => mt.parent)
  children?: MasterTable[];

  @Column({ type: "varchar", length: 50, nullable: true })
  value: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 100 })
  name: string;

  // OJO: "order" es palabra reservada en SQL, por eso el name va con comillas/backticks en el SQL
  @Column({ name: "order", type: "int", default: 0 })
  order: number;

  @Column({ type: "varchar", length: 200, nullable: true })
  additionalOne: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  additionalTwo: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  additionalThree: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  userNew: string | null;

  @CreateDateColumn({ type: "datetime" })
  dateNew: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  userEdit: string | null;

  @UpdateDateColumn({ type: "datetime" })
  dateEdit: Date;

  @Column({ type: "char", length: 1, default: "A" })
  status: "A" | "I";
}
