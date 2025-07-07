import { Pipe, PipeTransform } from "@angular/core";
import { TipoAlmacen } from "../models/tipoAlmacen.enum";

@Pipe({
  name: "tipoMovimientoAlmacen",
  standalone: true,
})
export class TipoMovimientoAlmacenPipe implements PipeTransform {
  transform(value: TipoAlmacen): string {
    switch (value) {
      case TipoAlmacen.SALIDA:
        return "Salida";
      case TipoAlmacen.INGRESO:
        return "Ingreso";
      default:
        return "Desconocido";
    }
  }
}
