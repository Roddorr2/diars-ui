import { ProductoAlmacen } from "./productoAlmacen.model";
import { TipoAlmacen } from "./tipoAlmacen.enum";

export interface MovimientoAlmacen {
    id?: number;
    tipoAlmacen: TipoAlmacen;
    productos: ProductoAlmacen[];
}