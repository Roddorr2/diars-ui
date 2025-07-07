import { Pipe, PipeTransform } from "@angular/core";
import { TipoMovimiento } from "../models/tipoMovimiento.enum";

@Pipe({
  name: "tipoMovimientoInventario",
  standalone: true,
})
export class TipoMovimientoInventarioPipe implements PipeTransform {
  transform(value: TipoMovimiento): string {
    switch (value) {
      case TipoMovimiento.CANCELACION_OC:
        return "Cancelación de Orden";
      case TipoMovimiento.REGISTRO_OC:
        return "Registro de Orden";
      case TipoMovimiento.APROBACION_OC:
        return "Aprobación de Orden";
      case TipoMovimiento.RECHAZO_OC:
        return "Rechazo de Orden";
      case TipoMovimiento.ACTUALIZACION_OC:
        return "Actualización de Orden";

      case TipoMovimiento.CANCELACION_DS:
        return "Cancelación de Despacho";
      case TipoMovimiento.REGISTRO_DS:
        return "Registro de Despacho";
      case TipoMovimiento.APROBACION_DS:
        return "Aprobación de Despacho";
      case TipoMovimiento.RECHAZO_DS:
        return "Rechazo de Despacho";
      case TipoMovimiento.ACTUALIZACION_DS:
        return "Actualización de Despacho";

      default:
        return "Tipo desconocido";
    }
  }
}
