import { Injectable, Pipe, PipeTransform } from "@angular/core";
import { Modulo } from "../models/modulo.enum";

@Pipe({
  name: "modulo",
  standalone: true,
})
// @Injectable({ providedIn: "root" })
export class ModuloPipe implements PipeTransform {
  transform(value: Modulo): string {
    switch (value) {
      case Modulo.PRODUCTO:
        return "Producto";
      case Modulo.USUARIO:
        return "Usuario";
      case Modulo.PROVEEDOR:
        return "Proveedor";
      case Modulo.SUCURSAL:
        return "Sucursal";
      case Modulo.CARGO:
        return "Cargo";
      case Modulo.CATEGORIA:
        return "Categoría";
      case Modulo.SUBCATEGORIA:
        return "Subcategoría";
      default:
        return "Desconocido";
    }
  }
}
