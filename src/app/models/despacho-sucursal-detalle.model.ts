export interface DespachoSucursalDetalle {
  id: number;
  correoSucursal: string;
  fecha: Date;
  estadoOperacion: string;
  producto: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
  observaciones: string;
}
