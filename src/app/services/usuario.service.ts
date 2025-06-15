import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Usuario } from "../models/usuario.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UsuarioService {
  private apiUrl = "http://localhost:8080/api/usuarios";

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const params = new HttpParams().set("estado", estado);
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, null, {
      params,
    });
  }

  buscarPorNombreOCorreo(query: string): Observable<Usuario[]> {
    const params = new HttpParams().set("q", query);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  existePorNombre(nombre: string): Observable<boolean> {
    const params = new HttpParams().set("nombre", nombre);
    return this.http.get<boolean>(`${this.apiUrl}/existe/nombre`, { params });
  }

  existePorCorreo(correo: string): Observable<boolean> {
    const params = new HttpParams().set("correo", correo);
    return this.http.get<boolean>(`${this.apiUrl}/existe/correo`, { params });
  }

  listarPorCargo(idCargo: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/cargo/${idCargo}`);
  }

  obtenerUsuarioActual(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/actual`);
  }
}
