import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Proveedor } from "../models/proveedor.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProveedorService {
  private apiUrl = "http://localhost:8080/api/proveedores";

  constructor(private http: HttpClient) {}

  registrarProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  listarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  obtenerProveedorPorId(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/id/${id}`);
  }

  obtenerProveedorPorRuc(ruc: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/ruc/${ruc}`);
  }

  actualizarProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  cambiarEstadoProveedor(id: number, estado: boolean): Observable<void> {
    const params = new HttpParams().set("estado", estado.toString());
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, null, {
      params,
    });
  }

  buscarProveedores(q: string): Observable<Proveedor[]> {
    const params = new HttpParams().set("q", q);
    return this.http.get<Proveedor[]>(`${this.apiUrl}/buscar`, { params });
  }

  existePorNombre(nombre: string): Observable<boolean> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<boolean>(`${this.apiUrl}/existe-nombre`, { params });
  }

  existePorRuc(ruc: string): Observable<boolean> {
    const params = new HttpParams().set("ruc", ruc);
    return this.http.get<boolean>(`${this.apiUrl}/existe-ruc`, { params });
  }
}
