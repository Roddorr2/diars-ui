import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subcategoria } from "../models/subcategoria.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SubcategoriaService {
  private apiUrl = "http://localhost:8080/api/subcategorias";

  constructor(private http: HttpClient) {}

  listar(): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(this.apiUrl);
  }

  
}
