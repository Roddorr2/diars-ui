import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Cargo } from "../models/cargo.model";

@Injectable({
  providedIn: "root",
})
export class CargoService {
  private apiUrl = "http://localhost:8080/api/cargos";

  constructor(private http: HttpClient) {}

  listarCargos(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(this.apiUrl);
  }

  buscarPorNombre(nombre: string): Observable<Cargo[]> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<Cargo[]>(`${this.apiUrl}/buscar`, { params });
  }

  existeCargoPorNombre(nombre: string): Observable<boolean> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<boolean>(`${this.apiUrl}/existe`, { params });
  }

  registrarCargo(cargo: Cargo): Observable<Cargo> {
    return this.http.post<Cargo>(this.apiUrl, cargo);
  }

  actualizarCargo(id: number, cargo: Cargo): Observable<Cargo> {
    return this.http.get<Cargo>(`${this.apiUrl}/${id}`);
  }

  obtenerCargoPorId(id: number): Observable<Cargo> {
    return this.http.get<Cargo>(`${this.apiUrl}/${id}`);
  }
}
