import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Sucursal } from "../models/sucursal.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SucursalService {
  private readonly apiUrl = "http://localhost:8080/api/sucursales";

  constructor(private http: HttpClient) {}

  registrarSucursal(sucursal: Sucursal): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.apiUrl, sucursal);
  }

  listarSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.apiUrl);
  }

  obtenerSucursalPorId(id: number): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }

  obtenerSucursalPorCorreo(correo: string): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.apiUrl}/correo?correo=${correo}`);
  }

  actualizarSucursal(id: number, sucursal: Sucursal): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.apiUrl}/${id}`, sucursal);
  }

  buscarPorDireccionOCorreo(q: string): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.apiUrl}/buscar?q=${q}`);
  }

  existePorCorreo(correo: string): Observable<boolean> {
    const params = new HttpParams().set("correo", correo);
    return this.http.get<boolean>(`${this.apiUrl}/existe`, { params });
  }
}
