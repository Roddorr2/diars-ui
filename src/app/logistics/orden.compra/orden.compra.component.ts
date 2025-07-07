import { Producto } from "./../../models/producto.model";
import { ProductoService } from "./../../services/producto.service";
import { Proveedor } from "./../../models/proveedor.model";
import { productoOrden } from "./../../models/productoOrden.model";
import { OrdenCompra } from "./../../models/ordenCompra.model";
import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CurrencyPipe } from "@angular/common";
import { EstadoOperacion } from "../../models/estadoOperacion.enum";
import { Router } from "@angular/router";
import { OrdenCompraService } from "../../services/orden.compra.service";
import { ProveedorService } from "../../services/proveedor.service";
import { OrdenCompraDetalle } from "../../models/orden-compra-detalle.model";
import Swal from "sweetalert2";

@Component({
  selector: "app-orden.compra",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: "./orden.compra.component.html",
  styleUrl: "./orden.compra.component.css",
})
export class OrdenCompraComponent implements OnInit {
  ordenDetalle: OrdenCompraDetalle[] = [];
  ordenesCompraFiltrada: OrdenCompraDetalle[] = [];
  ordenDetallePaginada: OrdenCompraDetalle[] = [];

  ordenCompra: OrdenCompra[] = [];
  productoOrden: productoOrden[] = [];
  producto: Producto[] = [];
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
  listaProductos: any;

  ordenSeleccionadaId: number | undefined;
  ordenOriginal: OrdenCompraDetalle | null = null;

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
    this.productoService.listar().subscribe((data) => (this.producto = data));
  }

  inicializarFormulario(): void {
    this.formularioOrdenCompra = this.fb.group({
      proveedor: [null, [Validators.required]],
      fecha: ["", [Validators.required]],
      estadoOperacion: [1, [Validators.required]],
      productos: this.fb.array([]),
    });
  }

  get productos(): FormArray {
    return this.formularioOrdenCompra.get("productos") as FormArray;
  }

  obtenerEstadoTexto(valorEstado: number): string {
    const estado = this.estadosOperacion.find((e) => e.value === valorEstado);
    return estado ? estado.label : "Pendiente";
  }

  nuevoProducto(): FormGroup {
    return this.fb.group({
      producto: [null, [Validators.required]],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      precioUnitario: [null, [Validators.required, Validators.min(0.1)]],
      observaciones: ["", Validators.required],
    });
  }

  agregarProducto(): void {
    this.productos.push(this.nuevoProducto());
  }

  eliminarProducto(index: number): void {
    this.productos.removeAt(index);
  }

  registrar(): void {
    if (this.productos.length === 0) {
      alert("Ingrese al menos un producto");
      return;
    }
    if (this.formularioOrdenCompra.invalid) {
      this.formularioOrdenCompra.markAllAsTouched();
      return;
    }
    const formValue = this.formularioOrdenCompra.value;

    const ordenNueva: OrdenCompra = {
      proveedor: {
        id: formValue.proveedor,
      } as Proveedor,
      fecha: formValue.fecha,
      estadoOperacion: formValue.estadoOperacion,
      productos: formValue.productos.map((p: any) => ({
        id: p.producto,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        observaciones: p.observaciones,
      })),
    };

    this.ordenCompraService.registrar(ordenNueva).subscribe({
      next: () => {
        this.cargarOrdenesCompra();
        this.cancelar();
        Swal.fire({
          title: "¡Registrado!",
          text: "La orden de compra se registró correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      },
      error: () => {
        Swal.fire({
          title: "Error",
          text: "No se pudo registrar la orden de compra",
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
      },
    });
  }

  cancelarOrden(orden: OrdenCompra): void {
    Swal.fire({
      title: "¿Estás seguro?",
      text: `Estás a punto de cancelar la orden de compra del proveedor ${orden.proveedor.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const ordenCancelada: OrdenCompra = {
          ...orden,
          estadoOperacion: 0,
        };

        this.ordenCompraService
          .actualizar(orden.id!, ordenCancelada)
          .subscribe({
            next: () => {
              this.cargarOrdenesCompra();
              Swal.fire({
                title: "Orden Cancelada",
                text: "La orden de compra fue cancelada correctamente.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: "top-end",
              });
            },
            error: () => {
              Swal.fire({
                title: "Error",
                text: "No se pudo cancelar la orden de compra.",
                icon: "error",
                toast: true,
                position: "top-end",
                timer: 3000,
                showConfirmButton: false,
              });
            },
          });
      }
    });
  }

  private getEstadoNumerico(estadoNombre: string): number {
    const estados: Record<string, number> = {
      cancelado: 0,
      pendiente: 1,
      aprobado: 2,
      rechazado: 3,
    };
    return estados[estadoNombre.toLowerCase()] || 1;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cancelar();
  }

  cargarOrdenesCompra(): void {
    this.ordenCompraService.listar().subscribe({
      next: (detalles) => {
        this.ordenDetalle = detalles.map((detalle, index) => ({
          ...detalle,
          id: detalle.id ?? index + 1,
        }));
        this.ordenesCompraFiltrada = [...this.ordenDetalle];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
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

    while (this.productos.length > 0) {
      this.productos.removeAt(0);
    }

    this.agregarProducto();

    this.formularioOrdenCompra.patchValue({
      estadoOperacion: 1,
    });
    this.mostrarModal = true;
    this.cargarProveedores();
  }

  cambiarEstado(orden: OrdenCompraDetalle, nuevoEstado: EstadoOperacion): void {
    let accion = "";
    let texto = "";
    let color = "";

    switch (nuevoEstado) {
      case 0:
        accion = "cancelar";
        texto = "CANCELADA";
        color = "#6c757d";
        break;
      case 2:
        accion = "aprobar";
        texto = "APROBADA";
        color = "#28a745";
        break;
      case 3:
        accion = "rechazar";
        texto = "RECHAZADA";
        color = "#dc3545";
        break;
    }

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion} la orden de compra`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: "#adb5bd",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.ordenCompraService
          .actualizarEstado(orden.id, nuevoEstado)
          .subscribe({
            next: () => {
              this.cargarOrdenesCompra();
              Swal.fire({
                title: `Orden ${texto}`,
                text: `La orden fue ${texto.toLowerCase()} correctamente`,
                icon: "success",
                toast: true,
                timer: 2500,
                position: "top-end",
                showConfirmButton: false,
              });
            },
            error: () => {
              Swal.fire({
                title: "Error",
                text: `No se pudo ${accion} la orden de compra`,
                icon: "error",
                timer: 3000,
                showConfirmButton: false,
              });
            },
          });
      }
    });
  }

  actualizar(): void {
    if (!this.modoEdicion || !this.ordenSeleccionadaId) {
      Swal.fire({
        title: "Error",
        text: "No hay orden seleccionada para actualizar",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    if (this.productos.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Debe agregar al menos un producto",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    if (this.formularioOrdenCompra.invalid) {
      this.formularioOrdenCompra.markAllAsTouched();
      Swal.fire({
        title: "Error",
        text: "Por favor complete todos los campos requeridos",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    const formValue = this.formularioOrdenCompra.value;

    const ordenActualizada: OrdenCompra = {
      id: this.ordenSeleccionadaId,
      proveedor: {
        id: formValue.proveedor,
      } as Proveedor,
      fecha: formValue.fecha,
      estadoOperacion: formValue.estadoOperacion,
      productos: formValue.productos.map((p: any) => ({
        id: p.id || 0,
        producto: { id: p.producto } as Producto,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        observaciones: p.observaciones,
      })),
    };

    this.ordenCompraService
      .actualizar(this.ordenSeleccionadaId, ordenActualizada)
      .subscribe({
        next: () => {
          this.cargarOrdenesCompra();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "La orden de compra se actualizó correctamente.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        },
        error: () => {
          Swal.fire({
            title: "Error",
            text: "No se pudo actualizar la orden de compra",
            icon: "error",
            toast: true,
            position: "top-end",
            timer: 3000,
            showConfirmButton: false,
          });
        },
      });
  }

  editar(od: OrdenCompraDetalle): void {
    if (!od.id || od.id === 0) {
      Swal.fire({
        title: "Error",
        text: "ID de orden inválido",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    this.ordenCompraService.obtenerPorId(od.id).subscribe({
      next: (orden: OrdenCompra) => {
        this.modoEdicion = true;
        this.ordenSeleccionadaId = orden.id;
        this.formularioOrdenCompra.reset();

        while (this.productos.length > 0) {
          this.productos.removeAt(0);
        }

        this.formularioOrdenCompra.patchValue({
          proveedor: orden.proveedor.id,
          fecha: this.formatoFechaInput(orden.fecha),
          estadoOperacion: orden.estadoOperacion,
        });

        orden.productos.forEach((detalle) => {
          const grupo = this.fb.group({
            id: [detalle.id],
            producto: [detalle.producto.id, Validators.required],
            cantidad: [
              detalle.cantidad,
              [Validators.required, Validators.min(1)],
            ],
            precioUnitario: [
              detalle.precioUnitario,
              [Validators.required, Validators.min(0.01)],
            ],
            observaciones: [detalle.observaciones, Validators.required],
          });
          this.productos.push(grupo);
        });

        this.mostrarModal = true;
      },
      error: () => {
        let mensajeError = "No se pudo cargar la orden para editar";

        Swal.fire({
          title: "Error",
          text: mensajeError,
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
      },
    });
  }

  private formatoFechaInput(fecha: Date): string {
    return new Date(fecha).toISOString().split("T")[0];
  }

  cancelar(): void {
    this.formularioOrdenCompra.reset();
    this.formularioOrdenCompra.patchValue({
      estadoOperacion: 1,
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

  exportarOrdenCompra(id: number): void {
    this.ordenCompraService.exportarOrden(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orden_compra_${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo exportar la orden de compra.",
        });
      },
    });
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
