import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ProductoService } from "./../../services/producto.service";
import { Producto } from "../../models/producto.model";
import { Subcategoria } from "./../../models/subcategoria.model";
import { SubcategoriaService } from "./../../services/subcategoria.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { map, debounceTime, switchMap, first } from "rxjs/operators";

import Swal from "sweetalert2";

@Component({
  selector: "app-producto",
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe, CommonModule],
  templateUrl: "./producto.component.html",
  styleUrls: ["./producto.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  subcategorias: Subcategoria[] = [];
  formularioProducto!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  paginasArray: number[] = [];
  productosPaginados: Producto[] = [];

  modoEdicion: boolean = false;
  productoSeleccionadoId?: number;
  mostrarModal: boolean = false;

  productoOriginal: Producto | null = null;

  codigoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((codigo: number) =>
          this.productoService.existePorCodigo(codigo)
        ),
        map((existe: boolean) => (existe ? { codigoExistente: true } : null)),
        first()
      );
    };
  }

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
      codigo: [0, Validators.required, this.codigoUnicoValidator()],
      nombre: ["", Validators.required],
      marca: ["", Validators.required],
      descripcion: [""],
      subcategoria: [null, Validators.required],
      stock: [0, Validators.required],
      precioUnitario: [0, Validators.required],
      unidadMedida: ["", Validators.required],
      estado: [true],
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  cargarSubcategorias(): void {
    this.subcategoriaService
      .listar()
      .subscribe((data) => (this.subcategorias = data));
  }

  registrar(): void {
    if (this.formularioProducto.invalid) return;

    const producto: Producto = {
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };
    this.productoService.registrar(producto).subscribe(() => {
      this.cargarProductos();
      this.cancelar();
    });

    Swal.fire({
      title: "¡Registrado!",
      text: "El producto se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(producto: Producto): void {
    this.modoEdicion = true;
    this.productoSeleccionadoId = producto.id;
    this.mostrarModal = true;

    this.productoOriginal = { ...producto };

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
  }

  actualizar(): void {
    if (this.formularioProducto.invalid) return;

    const productoActualizado: Producto = {
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      },
    };

    if (
      JSON.stringify(productoActualizado) ===
      JSON.stringify({
        ...this.productoOriginal,
        subcategoria: { id: this.productoOriginal?.subcategoria?.id },
      })
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
      .subscribe(() => {
        this.cargarProductos();
        this.cancelar();
      });

    Swal.fire({
      title: "¡Actualizado!",
      text: "El producto se actualizó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioProducto.reset();
    this.formularioProducto.patchValue({ estado: true });
    this.mostrarModal = true;
    this.cargarSubcategorias();
    this.productoSeleccionadoId = undefined;
  }

  cancelar(): void {
    this.formularioProducto.reset();
    this.formularioProducto.patchValue({ estado: true });
    this.modoEdicion = false;
    this.productoSeleccionadoId = undefined;
    this.mostrarModal = false;
  }

  cambiarEstado(producto: Producto): void {
    const nuevoEstado = !producto.estado;
    const accion = nuevoEstado ? "activa" : "desactiva";

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion}r el producto ${producto.nombre}`,
      icon: `warning`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}r`,
      cancelButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .cambiarEstado(producto.id!, nuevoEstado)
          .subscribe(() => {
            this.cargarProductos();
            Swal.fire({
              title: `Éxito`,
              text: `El producto fue ${accion}do correctamente`,
              icon: `success`,
              timer: 2000,
              showConfirmButton: false,
            });
          });
      }
    });
  }

  filtrarProductos(): void {
    const termino = this.searchTerm.trim();

    if (termino === "") {
      this.cargarProductos();
      this.productosFiltrados = [...this.productos];
      return;
    } else {
      this.productoService.buscarGeneral(termino).subscribe({
        next: (productos) => {
          this.productosFiltrados = productos;
          this.paginaActual = 1;
          this.actualizarPaginacion();
        },
        error: (err) => console.error(err),
      });
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    const inicio = (pagina - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.productosPaginados = this.productosFiltrados.slice(inicio, fin);
  }

  actualizarPaginacion(): void {
    const base = this.searchTerm ? this.productosFiltrados : this.productos;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.productosPaginados = base.slice(inicio, fin);
  }

  onItemsPorPaginaChange(): void {
    this.cambiarPagina(1);
    this.actualizarPaginacion();
  }

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
