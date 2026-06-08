import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const isCompiled = __dirname.includes("dist");

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "tiendasmass", 
  synchronize: true, // 👈 Puesto en true para sincronizar como Prisma
  logging: false,
  entities: [isCompiled ? "dist/entities/**/*.js" : "src/entities/**/*.ts"],
});
