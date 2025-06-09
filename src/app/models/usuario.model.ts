import { Cargo } from "./cargo.model";

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  contrasena: string;
  cargo: Cargo;
  estado: boolean;
}
