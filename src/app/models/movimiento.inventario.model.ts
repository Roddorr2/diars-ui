import { Producto } from "./producto.model";
import { TipoMovimiento } from "./tipoMovimiento.enum";
import { Usuario } from "./usuario.model";

export interface MovimientoInventario {
    id: number;
    fecha: Date;
    tipoMovimiento: TipoMovimiento;
    cantidad: number;
    usuario: Usuario;
    producto: Producto;
}