import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Categoria } from "../models/categoria.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CategoriaService {
  private apiUrl = "http://localhost:8080/api/categorias";

  constructor(private http: HttpClient) {}

  registrar(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoria);
  }

  existePorNombre(nombre: string): Observable<boolean> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<boolean>(`${this.apiUrl}/existe`, { params });
  }
}
