import { Producto } from "./../../models/producto.model";
import { ProductoService } from "./../../services/producto.service";
import { Proveedor } from "./../../models/proveedor.model";
import { productoOrden } from "./../../models/productoOrden.model";
import { OrdenCompra } from "./../../models/ordenCompra.model";
import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EstadoOperacion } from "../../models/estadoOperacion.enum";
import { Router } from "@angular/router";
import { OrdenCompraService } from "../../services/orden.compra.service";
import { ProveedorService } from "../../services/proveedor.service";
import { OrdenCompraDetalle } from "../../models/orden-compra-detalle.model";

@Component({
  selector: "app-orden.compra",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./orden.compra.component.html",
  styleUrl: "./orden.compra.component.css",
})
export class OrdenCompraComponent implements OnInit {
  ordenDetalle: OrdenCompraDetalle[] = [];
  ordenesCompraFiltrada: OrdenCompraDetalle[] = [];
  ordenDetallePaginada: OrdenCompraDetalle[] = [];

  ordenCompra: OrdenCompra[] = [];
  productoOrden: productoOrden[] = [];
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];

  formularioOrdenCompra!: FormGroup;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;

  router = inject(Router);

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  proveedorSeleccionadoId: number | null = null;

  searchTerm: string = "";
  fechaInicio: string = "";
  fechaFin: string = "";
  estadoSeleccionado: number | null = null;

  constructor(
    private ordenCompraService: OrdenCompraService,
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
    private fb: FormBuilder
  ) {}

  get estadosOperacion(): { label: string; value: number }[] {
    return Object.values(EstadoOperacion)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        label: this.getNombreEstado(v as number),
        value: v as number,
      }));
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarOrdenesCompra();
    this.cargarProveedores();
    this.cargarProductos();
  }

  cargarProveedores(): void {
    this.proveedorService
      .listarProveedores()
      .subscribe((data) => (this.proveedores = data));
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe((data) => (this.productos = data));
  }

  inicializarFormulario(): void {
    this.formularioOrdenCompra = this.fb.group({
      proveedor: [null, [Validators.required]],
      fecha: ["", [Validators.required]],
      estadoOperacion: [null, [Validators.required]],
      producto: [null, [Validators.required]],
      cantidad: [null, [Validators.required, Validators.min(0)]],
      precioUnitario: [null, [Validators.required, Validators.min(0)]],
      observaciones: ["", [Validators.required]],
    });
  }

  registrar(): void {
    
  }

  actualizar(): void {

  }

  cargarOrdenesCompra(): void {
    this.ordenCompraService.listar().subscribe({
      next: (detalles) => {
        this.ordenDetalle = detalles;
        this.ordenesCompraFiltrada = detalles;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.ordenesCompraFiltrada;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.ordenDetallePaginada = base.slice(inicio, fin);
  }

  filtrarOrdenes(): void {
    this.ordenesCompraFiltrada = this.ordenDetalle.filter((od) => {
      const coincideObservacion = od.observaciones
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());

      const coincideFecha =
        (!this.fechaInicio ||
          new Date(od.fecha) >= new Date(this.fechaInicio)) &&
        (!this.fechaFin || new Date(od.fecha) <= new Date(this.fechaFin));

      const coincideEstado =
        this.estadoSeleccionado === null ||
        od.estadoOperacion.toLowerCase() ===
          this.getNombreEstado(this.estadoSeleccionado).toLowerCase();

      return coincideObservacion && coincideFecha && coincideEstado;
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioOrdenCompra.reset();
    this.formularioOrdenCompra.patchValue({
      estadosOperacion: this.estadosOperacion,
    });
    this.mostrarModal = true;
    this.cargarProveedores();
  }

  cancelar(): void {
    this.formularioOrdenCompra.reset();
    this.formularioOrdenCompra.patchValue({
      estadoOperacion: this.estadosOperacion,
    });
    this.modoEdicion = false;
    this.mostrarModal = false;
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.fechaInicio = "";
    this.fechaFin = "";
    this.proveedorSeleccionadoId = null;
    this.estadoSeleccionado = null;
    this.ordenesCompraFiltrada = [...this.ordenDetalle];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }

  private getNombreEstado(valor: number): string {
    const labels: Record<number, string> = {
      0: "Cancelado",
      1: "Pendiente",
      2: "Aprobado",
      3: "Rechazado",
    };
    return labels[valor] || "Desconocido";
  }
}
