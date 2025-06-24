import { Pipe, PipeTransform } from "@angular/core";
import { EstadoOperacion } from "../models/estadoOperacion.enum";

@Pipe({
  name: "estadoOperacion",
  standalone: true,
})
export class EstadoOperacionPipe implements PipeTransform {
  transform(value: EstadoOperacion): string {
    switch (value) {
      case 0:
        return "Cancelado";
      case 1:
        return "Pendiente";
      case 2:
        return "Aprobado";
      case 3:
        return "Rechazado";
      default:
        return "Desconocido";
    }
  }
}
