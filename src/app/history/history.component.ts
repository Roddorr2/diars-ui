import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import Swal from "sweetalert2";

import { Usuario } from "../models/usuario.model";
import { Historial } from "../models/historial.model";
import { HistorialService } from "../services/historial.service";
import { UsuarioService } from "../services/usuario.service";
import { ModuloPipe } from "../pipes/modulo.pipe";
import { TipoAccionPipe } from "../pipes/tipo-accion.pipe";
import { TipoAccion } from "../models/tipoAccion.enum";
import { Modulo } from "../models/modulo.enum";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.css"],
  imports: [ModuloPipe, TipoAccionPipe, CommonModule, FormsModule],
})
export class HistoryComponent implements OnInit {
  historial: Historial[] = [];
  historialFiltrado: Historial[] = [];
  historialesPaginados: Historial[] = [];

  usuarios: Usuario[] = [];

  searchTerm = "";
  fechaInicio = "";
  fechaFin = "";
  usuarioSeleccionadoId: number | null = null;
  tipoAccionSeleccionada: number | null = null;
  moduloSeleccionado: number | null = null;

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  router = inject(Router);

  constructor(
    private historialService: HistorialService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
    this.cargarUsuarios();
  }

  get tipoAcciones(): { label: string; value: number }[] {
    return Object.values(TipoAccion)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        label: new TipoAccionPipe().transform(v as TipoAccion),
        value: v as number,
      }));
  }

  get modulos(): { label: string; value: number }[] {
    return Object.values(Modulo)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        label: new ModuloPipe().transform(v as Modulo),
        value: v as number,
      }));
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => (this.usuarios = data),
    });
  }

  cargarHistorial(): void {
    this.historialService.obtenerTodos().subscribe({
      next: (historial) => {
        this.historial = historial;
        this.historialFiltrado = [...historial];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => this.alertaError("No se pudo cargar el historial."),
    });
  }

  filtrarHistorial(): void {
    this.historialFiltrado = this.historial.filter((h) => {
      const usuarioNombre = h.usuario.nombre?.toLowerCase() ?? "";
      const termino = this.searchTerm.toLowerCase();

      const coincideUsuario = termino === "" || usuarioNombre.includes(termino);

      const coincideUsuarioId =
        this.usuarioSeleccionadoId === null ||
        h.usuario.id === this.usuarioSeleccionadoId;

      const fechaAccion = new Date(h.fecha);
      const desde = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const hasta = this.fechaFin ? new Date(this.fechaFin) : null;

      const coincideFecha =
        (!desde || fechaAccion >= desde) && (!hasta || fechaAccion <= hasta);

      const coincideTipoAccion =
        this.tipoAccionSeleccionada === null ||
        h.tipoAccion === this.tipoAccionSeleccionada;

      const coincideModulo =
        this.moduloSeleccionado === null ||
        h.modulo === this.moduloSeleccionado;

      return (
        coincideUsuario &&
        coincideUsuarioId &&
        coincideFecha &&
        coincideModulo &&
        coincideTipoAccion
      );
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.fechaInicio = "";
    this.fechaFin = "";
    this.usuarioSeleccionadoId = null;
    this.tipoAccionSeleccionada = null;
    this.moduloSeleccionado = null;

    this.historialFiltrado = [...this.historial];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.historialFiltrado;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.historialesPaginados = base.slice(inicio, fin);
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }

  private alertaError(texto: string): void {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: texto,
      toast: true,
      position: "top-end",
      timer: 3000,
      showConfirmButton: false,
    });
  }
}
