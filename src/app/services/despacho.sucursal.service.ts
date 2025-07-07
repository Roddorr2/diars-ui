import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DespachoSucursal } from "../models/despachoSucursal.model";
import { Observable } from "rxjs";
import { DespachoSucursalDetalle } from "../models/despacho-sucursal-detalle.model";

@Injectable({
  providedIn: "root",
})
export class DespachoSucursalService {
  private baseUrl = `http://localhost:8080/api/despachos`;

  constructor(private http: HttpClient) {}

  registrarDespacho(despacho: DespachoSucursal): Observable<DespachoSucursal> {
    return this.http.post<DespachoSucursal>(this.baseUrl, despacho);
  }

  actualizarDespacho(
    id: number,
    despacho: DespachoSucursal
  ): Observable<DespachoSucursal> {
    return this.http.put<DespachoSucursal>(`${this.baseUrl}/${id}`, despacho);
  }

  listarDespachos(): Observable<DespachoSucursalDetalle[]> {
    return this.http.get<DespachoSucursalDetalle[]>(`${this.baseUrl}/todos`);
  }

  listarPorEstado(estado: number): Observable<DespachoSucursal[]> {
    return this.http.get<DespachoSucursal[]>(
      `${this.baseUrl}/estado/${estado}`
    );
  }

  obtenerPorId(id: number): Observable<DespachoSucursal> {
    return this.http.get<DespachoSucursal>(`${this.baseUrl}/${id}`);
  }

  buscarPorFechas(
    desde: string,
    hasta: string
  ): Observable<DespachoSucursal[]> {
    const params = new HttpParams().set("desde", desde).set("hasta", hasta);
    return this.http.get<DespachoSucursal[]>(`${this.baseUrl}/buscar`, {
      params,
    });
  }

  actualizarEstado(id: number, estado: number): Observable<void> {
    const params = new HttpParams().set("estado", estado.toString());
    return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, null, {
      params,
    });
  }

  exportarDespacho(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/exportar/${id}`, {
      responseType: "blob",
    });
  }
}
