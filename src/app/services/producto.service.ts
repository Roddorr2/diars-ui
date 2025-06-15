import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Producto } from "../models/producto.model";

@Injectable({
  providedIn: "root",
})
export class ProductoService {
  private apiUrl = "http://localhost:8080/api/productos";

  constructor(private http: HttpClient) {}

  registrar(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }

  modificar(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const params = new HttpParams().set("estado", estado.toString());
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, null, {
      params,
    });
  }

  buscarGeneral(termino: string): Observable<Producto[]> {
    const params = new HttpParams().set("q", termino);
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar`, { params });
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}`);
  }

  listarActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
  }

  existePorCodigo(codigo: number): Observable<boolean> {
    const params = new HttpParams().set("codigo", codigo.toString());
    return this.http.get<boolean>(`${this.apiUrl}/existe`, { params });
  }
}
