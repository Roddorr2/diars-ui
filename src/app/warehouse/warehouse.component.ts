import { ProductoService } from "./../services/producto.service";
import { AlmacenMovimientoService } from "./../services/almacen.movimiento.service";
import { Component, inject, OnInit } from "@angular/core";
import { AlmacenDetalle } from "../models/almacen-detalle.model";
import { Producto } from "../models/producto.model";
import { Router } from "@angular/router";
import { TipoAlmacen } from "../models/tipoAlmacen.enum";
import Swal from "sweetalert2";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-warehouse",
  imports: [FormsModule, CommonModule],
  templateUrl: "./warehouse.component.html",
  styleUrl: "./warehouse.component.css",
})
export class WarehouseComponent implements OnInit {
  almacenDetalle: AlmacenDetalle[] = [];
  almacenDetalleFiltrado: AlmacenDetalle[] = [];
  almacenDetallePaginado: AlmacenDetalle[] = [];

  producto: Producto[] = [];

  router = inject(Router);

  paginasActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  searchTerm: string = "";
  tipoAlmacenSeleccionado: number | null = null;

  almacenSeleccionadoId: number | undefined;

  constructor(
    private almacenMovimientoService: AlmacenMovimientoService,
    private productoService: ProductoService
  ) {}

  get tiposAlmacen(): { label: string; value: number }[] {
    return Object.values(TipoAlmacen)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        label: this.getNombreTipoAlmacen(v as number),
        value: v as number,
      }));
  }

  ngOnInit(): void {
    this.cargarAlmacenes();
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe((data) => (this.producto = data));
  }

  cargarAlmacenes(): void {
    this.almacenMovimientoService.listarMovimientos().subscribe({
      next: (almacenes) => {
        this.almacenDetalle = almacenes.map((almacenes, index) => ({
          ...almacenes,
          id: almacenes.id ?? index + 1,
        }));
        this.almacenDetalleFiltrado = [...this.almacenDetalle];
        this.paginasActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los almacenes",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      },
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginasActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.almacenDetalleFiltrado;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginasActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.almacenDetallePaginado = base.slice(inicio, fin);
  }

  filtrarAlmacenes(): void {
    this.almacenDetalleFiltrado = this.almacenDetalle.filter((ad) => {
      const coincideTipo =
        this.tipoAlmacenSeleccionado === null ||
        ad.tipoAlmacen.toLowerCase() ===
          this.getNombreTipoAlmacen(this.tipoAlmacenSeleccionado).toLowerCase();
      return coincideTipo;
    });
    this.paginasActual = 1;
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.tipoAlmacenSeleccionado = null;
    this.almacenDetalleFiltrado = [...this.almacenDetalle];
    this.paginasActual = 1;
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }

  private getNombreTipoAlmacen(valor: number): string {
    const labels: Record<number, string> = {
      0: "Salida",
      1: "Entrada",
    };
    return labels[valor] || "Desconocido";
  }
}
