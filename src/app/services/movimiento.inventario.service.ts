import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { InventarioDetalle } from "../models/inventario-detalle.model";
import { MovimientoInventario } from "../models/movimiento.inventario.model";

@Injectable({
  providedIn: "root",
})
export class MovimientoInventarioService {
  private baseUrl = "http://localhost:8080/api/inventario";

  constructor(private http: HttpClient) {}

  listarMovimientos(): Observable<InventarioDetalle[]> {
    return this.http.get<InventarioDetalle[]>(`${this.baseUrl}/movimientos`);
  }

  filtrarPorFechas(
    inicio: string,
    fin: string
  ): Observable<MovimientoInventario[]> {
    const params = new HttpParams().set("inicio", inicio).set("fin", fin);
    return this.http.get<MovimientoInventario[]>(`${this.baseUrl}/fecha`, {
      params,
    });
  }

  filtrarPorUsuario(usuarioId: number): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(
      `${this.baseUrl}/usuario/${usuarioId}`
    );
  }

  filtrarPorProducto(productoId: number): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(
      `${this.baseUrl}/producto/${productoId}`
    );
  }

  obtenerDetalle(id: number): Observable<MovimientoInventario> {
    return this.http.get<MovimientoInventario>(`${this.baseUrl}/${id}`);
  }

  exportarMovimiento(id: number) {
    return this.http.get(`${this.baseUrl}/exportar/${id}`, {
      responseType: "blob",
    });
  }
}
