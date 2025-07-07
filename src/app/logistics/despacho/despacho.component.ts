import { DespachoSucursalService } from "./../../services/despacho.sucursal.service";
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
import { DespachoSucursalDetalle } from "../../models/despacho-sucursal-detalle.model";
import { DespachoSucursal } from "../../models/despachoSucursal.model";
import { productoDespacho } from "../../models/productoDespacho.model";
import { Producto } from "../../models/producto.model";
import { Router } from "@angular/router";
import { SucursalService } from "../../services/sucursal.service";
import { ProductoService } from "../../services/producto.service";
import { EstadoOperacion } from "../../models/estadoOperacion.enum";
import { Sucursal } from "../../models/sucursal.model";
import Swal from "sweetalert2";

@Component({
  selector: "app-despacho",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./despacho.component.html",
  styleUrl: "./despacho.component.css",
})
export class DespachoComponent implements OnInit {
  despachoDetalle: DespachoSucursalDetalle[] = [];
  despachoSucursalFiltrado: DespachoSucursalDetalle[] = [];
  despachoDetallePaginado: DespachoSucursalDetalle[] = [];

  despachoSucursal: DespachoSucursal[] = [];
  prodcutoDespacho: productoDespacho[] = [];
  producto: Producto[] = [];
  sucursales: Sucursal[] = [];

  formularioDespachoSucursal!: FormGroup;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;

  router = inject(Router);

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  sucursalSeleccionadaId: number | null = null;

  searchTerm: string = "";
  fechaInicio: string = "";
  fechaFin: string = "";
  estadoSeleccionado: number | null = null;
  listarProductos: any;

  despachoSeleccionadoId: number | undefined;
  despachoOriginal: DespachoSucursalDetalle | null = null;

  constructor(
    private despachoSucursalService: DespachoSucursalService,
    private sucursalService: SucursalService,
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
    this.cargarDespachosSucursal();
    this.cargarSucursales();
    this.cargarProductos();
  }

  cargarSucursales(): void {
    this.sucursalService.listarSucursales().subscribe({
      next: (data) => (this.sucursales = data),
      error: (err) => {
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar las sucursales.",
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
      },
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (data) => (this.producto = data),
      error: (err) => {
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los productos.",
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
      },
    });
  }

  inicializarFormulario(): void {
    this.formularioDespachoSucursal = this.fb.group({
      sucursal: [null, [Validators.required]],
      fecha: ["", [Validators.required]],
      estadoOperacion: [1, [Validators.required]],
      productos: this.fb.array([]),
    });
  }

  get productos(): FormArray {
    return this.formularioDespachoSucursal.get("productos") as FormArray;
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
      observaciones: ["", [Validators.required]],
    });
  }

  agregarProducto(): void {
    this.productos.push(this.nuevoProducto());
  }

  eliminarProducto(index: number): void {
    if (index < 0 || index >= this.productos.length) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Índice inválido al eliminar producto",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    this.productos.removeAt(index);
  }

  registrar(): void {
    if (this.productos.length === 0) {
      return;
    }
    if (this.formularioDespachoSucursal.invalid) {
      this.formularioDespachoSucursal.markAllAsTouched();
      return;
    }
    const formValue = this.formularioDespachoSucursal.value;

    const despachoNuevo: DespachoSucursal = {
      sucursal: {
        id: formValue.sucursal,
      } as Sucursal,
      fecha: formValue.fecha,
      estadoOperacion: formValue.estadoOperacion,
      productos: formValue.productos.map((p: any) => ({
        id: p.producto,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        observaciones: p.observaciones,
      })),
    };

    this.despachoSucursalService.registrarDespacho(despachoNuevo).subscribe({
      next: () => {
        this.cargarDespachosSucursal();
        this.cancelar();
        Swal.fire({
          title: "Registrado",
          text: "Despacho registrado con éxito",
          icon: "success",
          timer: 2000,
          showCloseButton: false,
          toast: true,
          position: "top-end",
        });
      },
      error: (err) => {
        Swal.fire({
          title: "Error",
          text: "No se pudo registrar el despacho",
          icon: "error",
          timer: 2000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      },
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cancelar();
  }

  cargarDespachosSucursal(): void {
    this.despachoSucursalService.listarDespachos().subscribe({
      next: (detalles) => {
        this.despachoDetalle = detalles.map((detalle, index) => ({
          ...detalle,
          id: detalle.id ?? index + 1,
        }));
        this.despachoSucursalFiltrado = [...this.despachoDetalle];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => {
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los despachos a sucursal.",
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
      },
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.despachoSucursalFiltrado;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.despachoDetallePaginado = base.slice(inicio, fin);
  }

  filtrarDespachos(): void {
    this.despachoSucursalFiltrado = this.despachoDetalle.filter((dd) => {
      const coincideObservacion = dd.observaciones
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());

      const coincideFecha =
        (!this.fechaInicio ||
          new Date(dd.fecha) >= new Date(this.fechaInicio)) &&
        (!this.fechaFin || new Date(dd.fecha) <= new Date(this.fechaFin));

      const coincideEstado =
        this.estadoSeleccionado === null ||
        dd.estadoOperacion.toLowerCase() ===
          this.getNombreEstado(this.estadoSeleccionado).toLowerCase();

      return coincideObservacion && coincideFecha && coincideEstado;
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioDespachoSucursal.reset();

    while (this.productos.length > 0) {
      this.productos.removeAt(0);
    }

    this.agregarProducto();

    this.formularioDespachoSucursal.patchValue({
      estadoOperacion: 1,
    });
    this.mostrarModal = true;
    this.cargarSucursales();
  }

  cambiarEstado(
    despacho: DespachoSucursalDetalle,
    nuevoEstado: EstadoOperacion
  ): void {
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
      text: `Estás a punto de ${accion} la el despacho`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: "#adb5bd",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.despachoSucursalService
          .actualizarEstado(despacho.id, nuevoEstado)
          .subscribe({
            next: () => {
              this.cargarDespachosSucursal();
              Swal.fire({
                title: `Orden ${texto}`,
                text: `El despacho fue fue ${texto.toLowerCase()} correctamente`,
                icon: "success",
                toast: true,
                timer: 2500,
                position: "top-end",
                showConfirmButton: false,
              });
            },
            error: (err) => {
              Swal.fire({
                title: "Error",
                text: `No se pudo ${accion} el despacho a sucursal`,
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
    if (!this.modoEdicion || !this.despachoSeleccionadoId) {
      Swal.fire({
        title: "Error",
        text: "No hay despacho seleccionado para actualizar",
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

    if (this.formularioDespachoSucursal.invalid) {
      this.formularioDespachoSucursal.markAllAsTouched();
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

    const formValue = this.formularioDespachoSucursal.value;

    const despachoActualizado: DespachoSucursal = {
      id: this.despachoSeleccionadoId,
      sucursal: {
        id: formValue.sucursal,
      } as Sucursal,
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

    this.despachoSucursalService
      .actualizarDespacho(this.despachoSeleccionadoId, despachoActualizado)
      .subscribe({
        next: (response) => {
          this.cargarDespachosSucursal();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "El despacho a sucursal se actualizó correctamente.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        },
        error: (err) => {
          let mensajeError = "No se pudo actualizar el despacho";

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

  editar(dd: DespachoSucursalDetalle): void {
    if (!dd.id || dd.id === 0) {
      Swal.fire({
        title: "Error",
        text: "ID de despacho inválido",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    this.despachoSucursalService.obtenerPorId(dd.id).subscribe({
      next: (despacho: DespachoSucursal) => {
        this.modoEdicion = true;
        this.despachoSeleccionadoId = despacho.id;
        this.formularioDespachoSucursal.reset();

        while (this.productos.length > 0) {
          this.productos.removeAt(0);
        }

        this.formularioDespachoSucursal.patchValue({
          sucursal: despacho.sucursal.id,
          fecha: this.formatoFechaInput(despacho.fecha),
          estadoOperacion: despacho.estadoOperacion,
        });

        despacho.productos.forEach((detalle) => {
          const grupo = this.fb.group({
            id: [detalle.id],
            producto: [detalle.producto.id, Validators.required],
            cantidad: [
              detalle.cantidad,
              [Validators.required, Validators.min(1)],
            ],
            precioUnitario: [
              detalle.precioUnitario,
              [Validators.required, Validators.min(0.1)],
            ],
            observaciones: [detalle.observaciones, Validators.required],
          });
          this.productos.push(grupo);
        });

        this.mostrarModal = true;
      },
      error: (err) => {
        let mensajeError = "No se pudo cargar el despacho para editar";

        if (err.status === 403) {
          mensajeError = "No tiene permisos para editar este despacho";
        } else if (err.status === 404) {
          mensajeError = "El despacho no fue encontrada";
        }

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
    this.formularioDespachoSucursal.reset();
    this.formularioDespachoSucursal.patchValue({
      estadoOperacion: 1,
    });
    this.modoEdicion = false;
    this.mostrarModal = false;
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.fechaInicio = "";
    this.fechaFin = "";
    this.sucursalSeleccionadaId = null;
    this.estadoSeleccionado = null;
    this.despachoSucursalFiltrado = [...this.despachoDetalle];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  exportarDespachoSucursal(id: number): void {
    this.despachoSucursalService.exportarDespacho(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `despacho_a_sucursal_${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo exportar el despacho.",
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
