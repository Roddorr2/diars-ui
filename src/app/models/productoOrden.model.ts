import { Producto } from "./producto.model";

export interface productoOrden {
  id: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  observaciones: string;
}
