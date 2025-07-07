import { Component, inject, OnInit } from "@angular/core";
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
import { map, debounceTime, switchMap, first } from "rxjs/operators";
import Swal from "sweetalert2";

import { Categoria } from "./../../models/categoria.model";
import { CategoriaService } from "../../services/categoria.service";

@Component({
  selector: "app-categoria",
  templateUrl: "./categoria.component.html",
  styleUrl: "./categoria.component.css",
  imports: [ReactiveFormsModule, FormsModule],
})
export class CategoriaComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriasFiltradas: Categoria[] = [];
  categoriasPaginadas: Categoria[] = [];

  formularioCategoria!: FormGroup;

  searchTerm: string = "";
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion: boolean = false;
  categoriaSeleccionadaId?: number;
  mostrarModal: boolean = false;
  categoriaOriginal: Categoria | null = null;

  router = inject(Router);

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCategorias();
  }

  inicializarFormulario(): void {
    this.formularioCategoria = this.fb.group({
      nombre: ["", [Validators.required], this.nombreUnicoValidator()],
    });
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((nombre: string) =>
          this.categoriaService.existePorNombre(nombre)
        ),
        map((existe: boolean) => (existe ? { nombreExistente: true } : null)),
        first()
      );
    };
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.categoriasFiltradas = [...categorias];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las categorías",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  registrar(): void {
    if (this.formularioCategoria.invalid) {
      this.formularioCategoria.markAllAsTouched();
      return;
    }

    const categoria: Categoria = { ...this.formularioCategoria.value };

    this.categoriaService.registrar(categoria).subscribe({
      next: () => {
        this.cargarCategorias();
        this.cancelar();
        Swal.fire({
          title: "¡Registrada!",
          text: "La categoría se registró correctamente.",
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
          text: "No se pudo registrar la categoría.",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });
      },
    });
  }

  editar(categoria: Categoria): void {
    this.modoEdicion = true;
    this.categoriaSeleccionadaId = categoria.id;
    this.mostrarModal = true;
    this.categoriaOriginal = { ...categoria };
    this.formularioCategoria.patchValue({ nombre: categoria.nombre });
  }

  actualizar(): void {
    if (this.formularioCategoria.invalid) {
      this.formularioCategoria.markAllAsTouched();
      return;
    }

    const categoriaActualizada: Categoria = {
      ...this.formularioCategoria.value,
    };

    if (
      JSON.stringify(categoriaActualizada) ===
      JSON.stringify(this.categoriaOriginal)
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

    this.categoriaService
      .actualizar(this.categoriaSeleccionadaId!, categoriaActualizada)
      .subscribe({
        next: () => {
          this.cargarCategorias();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "La categoría se actualizó correctamente.",
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
            text: "No se pudo actualizar la categoría.",
            toast: true,
            position: "top-end",
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioCategoria.reset();
    this.mostrarModal = true;
    this.categoriaSeleccionadaId = undefined;
  }

  cancelar(): void {
    this.formularioCategoria.reset();
    this.modoEdicion = false;
    this.categoriaSeleccionadaId = undefined;
    this.mostrarModal = false;
  }

  filtrarCategorias(): void {
    const termino = this.searchTerm.trim();

    if (termino === "") {
      this.cargarCategorias();
      this.categoriasFiltradas = [...this.categorias];
      return;
    }

    this.categoriaService.buscarPorNombre(termino).subscribe({
      next: (categorias) => {
        this.categoriasFiltradas = categorias;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo buscar categorías",
          toast: true,
          position: "top-end",
          timer: 2000,
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
    const base = this.categoriasFiltradas;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.categoriasPaginadas = base.slice(inicio, fin);
  }

  onItemsPorPaginaChange(): void {
    this.cambiarPagina(1);
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }
}
