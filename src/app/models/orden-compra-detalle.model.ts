export interface OrdenCompraDetalle {
  proveedor: string;
  fecha: Date;
  estadoOperacion: string;
  producto: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
  observaciones: string;
}
