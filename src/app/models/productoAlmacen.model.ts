import { Producto } from "./producto.model";

export interface ProductoAlmacen {
  id: number;
  producto: Producto;
  cantidad: number;
}
