import { Categoria } from "./categoria.model";

export interface Subcategoria {
  id: number;
  nombre: string;
  categoria: Categoria;
}
