import { UsuarioService } from "./../services/usuario.service";
import { ProductoService } from "./../services/producto.service";
import { Component, inject, OnInit } from "@angular/core";
import { MovimientoInventario } from "../models/movimiento.inventario.model";
import { MovimientoInventarioService } from "../services/movimiento.inventario.service";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { InventarioDetalle } from "../models/inventario-detalle.model";
import { Producto } from "../models/producto.model";
import { Usuario } from "../models/usuario.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TipoMovimiento } from "../models/tipoMovimiento.enum";

@Component({
  selector: "app-inventory",
  imports: [CommonModule, FormsModule],
  templateUrl: "./inventory.component.html",
  styleUrl: "./inventory.component.css",
})
export class InventoryComponent implements OnInit {
  movimientos: MovimientoInventario[] = [];
  movimientosFiltrados: MovimientoInventario[] = [];
  movimientosDetalleFiltrados: InventarioDetalle[] = [];
  movimientosDetallePaginados: InventarioDetalle[] = [];
  usuarios: Usuario[] = [];
  productos: Producto[] = [];

  movimientosDetalle: InventarioDetalle[] = [];

  tipoSeleccionado: number | null = null;

  searchTermProducto: string = "";
  searchTermUsuario: string = "";
  fechaInicio: string = "";
  fechaFin: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  router = inject(Router);

  constructor(
    private movimientoService: MovimientoInventarioService,
    private productoService: ProductoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarMovimientos();
    this.cargarProductos();
    this.cargarUsuarios();
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => {
        console.error("Error al cargar productos", err);
        Swal.fire("Error", "No se pudieron cargar los productos", "error");
      },
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        console.error("Error al cargar usuarios", err);
        Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
      },
    });
  }

  cargarMovimientos(): void {
    this.movimientoService.listarMovimientos().subscribe({
      next: (data) => {
        this.movimientosDetalle = data;
        this.movimientosDetalleFiltrados = [...data];
        this.actualizarPaginacion();
      },
      error: (err) => {
        console.error("Error al cargar movimientos", err);
        Swal.fire("Error", "No se pudieron cargar los movimientos", "error");
      },
    });
  }

  filtrarMovimientos(): void {
    const termProducto = this.searchTermProducto.toLowerCase().trim();
    const termUsuario = this.searchTermUsuario.toLowerCase().trim();

    this.movimientosDetalleFiltrados = this.movimientosDetalle.filter((mov) => {
      const fecha = new Date(mov.fecha);
      const desde = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const hasta = this.fechaFin ? new Date(this.fechaFin) : null;

      const coincideFecha =
        (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

      const coincideProducto =
        !termProducto || mov.producto.toLowerCase().includes(termProducto);

      const coincideUsuario =
        !termUsuario || mov.usuario.toLowerCase().includes(termUsuario);

      const coincideTipoMovimiento =
        this.tipoSeleccionado === null ||
        mov.tipoMovimiento.toLowerCase() ===
          this.nombreTipoMovimiento(this.tipoSeleccionado).toLowerCase();

      return (
        coincideFecha &&
        coincideProducto &&
        coincideUsuario &&
        coincideTipoMovimiento
      );
    });
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  get tiposMovimiento(): {
    label: string;
    value: number;
  }[] {
    return Object.values(TipoMovimiento)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        label: this.nombreTipoMovimiento(v as number),
        value: v as number,
      }));
  }

  private nombreTipoMovimiento(tipo: number): string {
    const labels: Record<number, string> = {
      0: "Cancelación de Orden",
      1: "Registro de Orden",
      2: "Aprobación de Orden",
      3: "Rechazo de Orden",
      4: "Actualización de Orden",
      5: "Cancelación de Despacho",
      6: "Registro de Despacho",
      7: "Aprobación de Despacho",
      8: "Rechazo de Despacho",
      9: "Actualización de Despacho",
    };
    return labels[tipo] || "Tipo desconocido";
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.totalPaginas = Math.ceil(
      this.movimientosDetalleFiltrados.length / this.itemsPorPagina
    );
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );
    this.movimientosDetallePaginados = this.movimientosDetalleFiltrados.slice(
      inicio,
      fin
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.searchTermProducto = "";
    this.searchTermUsuario = "";
    this.fechaInicio = "";
    this.fechaFin = "";
    this.tipoSeleccionado = null;
    this.movimientosDetalleFiltrados = [...this.movimientosDetalle];
    this.paginaActual = 1;
    this.filtrarMovimientos();
  }

  exportarMovimiento(id: number): void {
    this.movimientoService.exportarMovimiento(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `movimiento_${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Error al exportar el movimiento:", err);
        Swal.fire("Error", "No se pudo exportar el movimiento", "error");
      },
    });
  }
  

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
