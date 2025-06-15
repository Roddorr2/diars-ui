import { Modulo } from "./modulo.enum";
import { TipoAccion } from "./tipoAccion.enum";
import { Usuario } from "./usuario.model";

export interface Historial {
  id: number;
  fecha: Date;
  tipoAccion: TipoAccion;
  descripcion: string;
  modulo: Modulo;
  usuario: Usuario;
}
