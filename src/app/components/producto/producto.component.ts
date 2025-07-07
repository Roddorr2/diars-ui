import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { map, debounceTime, switchMap, first } from "rxjs/operators";
import { of } from "rxjs";
import Swal from "sweetalert2";

import { ProductoService } from "../../services/producto.service";
import { SubcategoriaService } from "../../services/subcategoria.service";

import { Producto } from "../../models/producto.model";
import { Subcategoria } from "../../models/subcategoria.model";

@Component({
  selector: "app-producto",
  templateUrl: "./producto.component.html",
  styleUrls: ["./producto.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe, CommonModule],
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosPaginados: Producto[] = [];
  subcategorias: Subcategoria[] = [];

  formularioProducto!: FormGroup;
  router = inject(Router);

  searchTerm: string = "";
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion: boolean = false;
  productoSeleccionadoId?: number;
  mostrarModal: boolean = false;
  productoOriginal: Producto | null = null;

  constructor(
    private productoService: ProductoService,
    private subcategoriaService: SubcategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarProductos();
    this.cargarSubcategorias();
  }

  inicializarFormulario(): void {
    this.formularioProducto = this.fb.group({
      codigo: [0, [Validators.required], [this.codigoUnicoValidator()]],
      nombre: ["", [Validators.required]],
      marca: ["", [Validators.required]],
      descripcion: [""],
      subcategoria: [null, [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.1)]],
      unidadMedida: ["", [Validators.required]],
      estado: [true],
    });
  }

  codigoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value === 0) return of(null);
      return this.productoService.existePorCodigo(control.value).pipe(
        debounceTime(300),
        map((existe: boolean) => {
          if (
            this.modoEdicion &&
            this.productoOriginal?.codigo === control.value
          ) {
            return null;
          }
          return existe ? { codigoExistente: true } : null;
        }),
        first()
      );
    };
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = [...productos];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los productos",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      },
    });
  }

  cargarSubcategorias(): void {
    this.subcategoriaService.listar().subscribe({
      next: (data) => (this.subcategorias = data),
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las subcategorías",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      },
    });
  }

  registrar(): void {
    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      return;
    }

    const producto: Producto = {
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };

    this.productoService.registrar(producto).subscribe({
      next: () => {
        this.cargarProductos();
        this.cancelar();
        Swal.fire({
          title: "¡Registrado!",
          text: "El producto se registró correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar el producto",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      },
    });
  }

  editar(producto: Producto): void {
    this.modoEdicion = true;
    this.productoSeleccionadoId = producto.id;
    this.productoOriginal = { ...producto };

    this.formularioProducto.reset();
    this.formularioProducto.patchValue({
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      descripcion: producto.descripcion,
      subcategoria: producto.subcategoria?.id,
      stock: producto.stock,
      precioUnitario: producto.precioUnitario,
      unidadMedida: producto.unidadMedida,
      estado: producto.estado,
    });

    this.formularioProducto.get("codigo")?.disable();
    this.mostrarModal = true;
  }

  actualizar(): void {
    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      return;
    }

    const productoActualizado: Producto = {
      id: this.productoSeleccionadoId,
      ...this.formularioProducto.getRawValue(),
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };

    const originalComparable = {
      ...this.productoOriginal,
      subcategoria: { id: this.productoOriginal?.subcategoria?.id },
    };
    const actualizadoComparable = {
      ...productoActualizado,
      subcategoria: { id: productoActualizado.subcategoria.id },
    };

    if (
      JSON.stringify(actualizadoComparable) ===
      JSON.stringify(originalComparable)
    ) {
      Swal.fire({
        icon: "info",
        title: "Sin cambios",
        text: "No se ha realizado ninguna modificación.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    this.productoService
      .modificar(this.productoSeleccionadoId!, productoActualizado)
      .subscribe({
        next: () => {
          this.cargarProductos();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "El producto se actualizó correctamente.",
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
            text: "No se pudo actualizar el producto",
            icon: "error",
            toast: true,
            position: "top-end",
            timer: 3000,
            showConfirmButton: false,
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.productoOriginal = null;
    this.productoSeleccionadoId = undefined;
    this.formularioProducto.reset();

    this.formularioProducto.patchValue({
      estado: true,
      codigo: "",
      stock: "",
      precioUnitario: "",
    });
    this.formularioProducto.get("codigo")?.enable();
    this.mostrarModal = true;
    this.cargarSubcategorias();
  }

  cancelar(): void {
    this.formularioProducto.reset();
    this.formularioProducto.patchValue({
      estado: true,
      codigo: 0,
      stock: 0,
      precioUnitario: 0,
    });
    this.modoEdicion = false;
    this.productoSeleccionadoId = undefined;
    this.productoOriginal = null;
    this.mostrarModal = false;
  }

  cambiarEstado(producto: Producto): void {
    const nuevoEstado = !producto.estado;
    const accion = nuevoEstado ? "activa" : "desactiva";

    Swal.fire({
      title: "¿Estás seguro?",
      text: `Estás a punto de ${accion}r el producto ${producto.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}r`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .cambiarEstado(producto.id!, nuevoEstado)
          .subscribe({
            next: () => {
              this.cargarProductos();
              Swal.fire({
                title: "Éxito",
                text: `El producto fue ${accion}do correctamente`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
            },
            error: () => {
              Swal.fire({
                title: "Error",
                text: `No se pudo ${accion}r el producto`,
                icon: "error",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
              });
            },
          });
      }
    });
  }

  filtrarProductos(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    if (termino === "") {
      this.productosFiltrados = [...this.productos];
    } else {
      this.productoService.buscarGeneral(termino).subscribe({
        next: (productos) => {
          this.productosFiltrados = productos;
          this.paginaActual = 1;
          this.actualizarPaginacion();
        },
        error: () => {
          this.productosFiltrados = this.productos.filter((p) =>
            [p.nombre, p.marca, p.codigo.toString()].some((val) =>
              val.toLowerCase().includes(termino)
            )
          );
        },
      });
    }

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.productosFiltrados;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.productosPaginados = base.slice(inicio, fin);
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.productosFiltrados = [...this.productos];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  onItemsPorPaginaChange(): void {
    this.cambiarPagina(1);
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }
}
