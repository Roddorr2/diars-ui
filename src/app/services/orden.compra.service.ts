import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { OrdenCompra } from "../models/ordenCompra.model";
import { OrdenCompraDetalle } from "../models/orden-compra-detalle.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class OrdenCompraService {
  private baseUrl = `http://localhost:8080/api/ordenes`;

  constructor(private http: HttpClient) {}

  registrar(orden: OrdenCompra): Observable<OrdenCompra> {
    return this.http.post<OrdenCompra>(this.baseUrl, orden);
  }

  actualizar(id: number, orden: OrdenCompra): Observable<OrdenCompra> {
    return this.http.put<OrdenCompra>(`${this.baseUrl}/${id}`, orden);
  }

  listar(): Observable<OrdenCompraDetalle[]> {
    return this.http.get<OrdenCompraDetalle[]>(`${this.baseUrl}/todas`);
  }

  obtenerPorId(id: number): Observable<OrdenCompra> {
    return this.http.get<OrdenCompra>(`${this.baseUrl}/${id}`);
  }

  listarPorEstado(estado: number): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(`${this.baseUrl}/estado/${estado}`);
  }

  buscarPorFechas(desde: string, hasta: string): Observable<OrdenCompra[]> {
    const params = new HttpParams().set("desde", desde).set("hasta", hasta);
    return this.http.get<OrdenCompra[]>(`${this.baseUrl}/buscar`, { params });
  }

  actualizarEstado(id: number, estado: number): Observable<void> {
    const params = new HttpParams().set("estado", estado.toString());
    return this.http.put<void>(`${this.baseUrl}/${id}/estado`, null, {
      params,
    });
  }
}
