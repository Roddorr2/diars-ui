import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Subcategoria } from "../models/subcategoria.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SubcategoriaService {
  private apiUrl = "http://localhost:8080/api/subcategorias";

  constructor(private http: HttpClient) {}

  registrarSubcategoria(subcategoria: Subcategoria): Observable<Subcategoria> {
    return this.http.post<Subcategoria>(this.apiUrl, subcategoria);
  }

  actualizar(id: number, subcategoria: Subcategoria): Observable<Subcategoria> {
    return this.http.put<Subcategoria>(`${this.apiUrl}/${id}`, subcategoria);
  }

  listar(): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(this.apiUrl);
  }

  existePorNombre(nombre: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/existe`, {
      params: { nombre },
    });
  }

  listarPorCategoria(idCategoria: number): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(
      `${this.apiUrl}/por-categoria/${idCategoria}`
    );
  }

  buscarPorNombre(nombre: string): Observable<Subcategoria[]> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<Subcategoria[]>(`${this.apiUrl}/buscar`, { params });
  }
}
