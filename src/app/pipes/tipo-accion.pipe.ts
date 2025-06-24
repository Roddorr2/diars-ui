import { Injectable, Pipe, PipeTransform } from "@angular/core";
import { TipoAccion } from "../models/tipoAccion.enum";

@Pipe({
  name: "tipoAccion",
  standalone: true,
})

export class TipoAccionPipe implements PipeTransform {
  transform(value: TipoAccion): string {
    switch (value) {
      case TipoAccion.REGISTRO:
        return "Registro";
      case TipoAccion.MODIFICACION:
        return "Modificación";
      case TipoAccion.CAMBIO_ESTADO:
        return "Cambio de estado";
      case TipoAccion.CONSULTA:
        return "Consulta";
      default:
        return "Desconocida";
    }
  }
}
