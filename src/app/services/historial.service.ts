import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Historial } from '../models/historial.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = 'http://localhost:8080/api/historial';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Historial[]> {
    return this.http.get<Historial[]>(`${this.apiUrl}/todos`);
  }

  buscarPorUsuarioYTipo(nombreUsuario: string, tipoAccion: number): Observable<Historial[]> {
    const params = new HttpParams()
      .set('nombreUsuario', nombreUsuario)
      .set('tipoAccion', tipoAccion.toString());
    return this.http.get<Historial[]>(`${this.apiUrl}/buscar`, { params });
  }

  buscarAvanzado(nombreUsuario: string, tipoAccion: number, fechaInicio: string, fechaFin: string, modulo: number): Observable<Historial[]> {
    const params = new HttpParams()
      .set('nombreUsuario', nombreUsuario)
      .set('tipoAccion', tipoAccion.toString())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('modulo', modulo.toString());
    return this.http.get<Historial[]>(`${this.apiUrl}/buscar/avanzado`, { params });
  }

  obtenerPorId(id: number): Observable<Historial> {
    return this.http.get<Historial>(`${this.apiUrl}/${id}`);
  }

  registrarAccion(nombreUsuario: string, tipoAccion: number, descripcion: string, modulo: number): Observable<string> {
    const params = new HttpParams()
      .set('nombreUsuario', nombreUsuario)
      .set('tipoAccion', tipoAccion.toString())
      .set('descripcion', descripcion)
      .set('modulo', modulo.toString());
    return this.http.post(`${this.apiUrl}/registrar`, null, { params, responseType: 'text' });
  }
}
