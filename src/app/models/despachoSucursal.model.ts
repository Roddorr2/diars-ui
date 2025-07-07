import { EstadoOperacion } from "./estadoOperacion.enum";
import { productoDespacho } from "./productoDespacho.model";
import { Sucursal } from "./sucursal.model";

export interface DespachoSucursal {
  id?: number;
  sucursal: Sucursal;
  fecha: Date;
  estadoOperacion: EstadoOperacion;
  productos: productoDespacho[];
}
