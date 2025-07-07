import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AlmacenDetalle } from "../models/almacen-detalle.model";
import { Observable } from "rxjs";
import { MovimientoAlmacen } from "../models/movimiento.almacen.model";

@Injectable({
  providedIn: "root",
})
export class AlmacenMovimientoService {
  private baseUrl = "http://localhost:8080/api/almacenes";

  constructor(private http: HttpClient) {}

  listarMovimientos(): Observable<AlmacenDetalle[]> {
    return this.http.get<AlmacenDetalle[]>(`${this.baseUrl}/movimientos`);
  }

  filtrarPorTipo(tipoAlmacen: number): Observable<MovimientoAlmacen[]> {
    return this.http.get<MovimientoAlmacen[]>(
      `${this.baseUrl}/tipo/${tipoAlmacen}`
    );
  }
}
