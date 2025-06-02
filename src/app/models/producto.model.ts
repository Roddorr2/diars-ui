import { Subcategoria } from "./subcategoria.model";

export interface Producto {
  id?: number;
  codigo: number;
  nombre: string;
  marca: string;
  descripcion?: string;
  subcategoria: Subcategoria;
  stock: number;
  precioUnitario: number;
  unidadMedida: string;
  estado: boolean;
}
