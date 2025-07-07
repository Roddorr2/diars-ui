import { Producto } from "./producto.model";

export interface productoDespacho {
  id: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  observaciones: string;
}
