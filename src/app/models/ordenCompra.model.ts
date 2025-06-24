import { EstadoOperacion } from "./estadoOperacion.enum";
import { productoOrden } from "./productoOrden.model";
import { Proveedor } from "./proveedor.model";

export interface OrdenCompra {
  id?: number;
  proveedor: Proveedor;
  fecha: Date;
  estadoOperacion: EstadoOperacion;
  productos: productoOrden[];
}
