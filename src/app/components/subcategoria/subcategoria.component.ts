import { Component, inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { map, debounceTime, switchMap, first, of } from "rxjs";

import Swal from "sweetalert2";

import { Subcategoria } from "../../models/subcategoria.model";
import { Categoria } from "../../models/categoria.model";
import { SubcategoriaService } from "../../services/subcategoria.service";
import { CategoriaService } from "../../services/categoria.service";

@Component({
  selector: "app-subcategoria",
  templateUrl: "./subcategoria.component.html",
  styleUrls: ["./subcategoria.component.css"],
  imports: [ReactiveFormsModule, FormsModule],
})
export class SubcategoriaComponent implements OnInit {
  subcategorias: Subcategoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  subcategoriasPaginadas: Subcategoria[] = [];

  categorias: Categoria[] = [];
  categoriaSeleccionadaId: number | null = null;

  formularioSubcategoria!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion: boolean = false;
  subcategoriaSeleccionadaId?: number;
  mostrarModal: boolean = false;
  subcategoriaOriginal: Subcategoria | null = null;

  constructor(
    private subcategoriaService: SubcategoriaService,
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarSubcategorias();
    this.cargarCategorias();
  }

  inicializarFormulario(): void {
    this.formularioSubcategoria = this.fb.group({
      nombre: ["", [Validators.required], [this.nombreUnicoValidator()]],
      categoria: [null, [Validators.required]],
    });
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const nombre = control.value?.trim();
      if (!nombre) return of(null);

      return this.subcategoriaService.existePorNombre(nombre).pipe(
        debounceTime(300),
        map((existe) => {
          if (
            this.modoEdicion &&
            this.subcategoriaOriginal?.nombre === nombre
          ) {
            return null;
          }
          return existe ? { nombreExistente: true } : null;
        }),
        first()
      );
    };
  }

  cargarSubcategorias(): void {
    this.subcategoriaService.listar().subscribe({
      next: (data) => {
        this.subcategorias = data;
        this.subcategoriasFiltradas = [...data];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las subcategorías.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => (this.categorias = data),
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las categorías.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  registrar(): void {
    if (this.formularioSubcategoria.invalid) {
      this.formularioSubcategoria.markAllAsTouched();
      return;
    }

    const subcategoria: Subcategoria = {
      ...this.formularioSubcategoria.value,
      categoria: {
        id: this.formularioSubcategoria.value.categoria,
      } as Categoria,
    };

    this.subcategoriaService.registrarSubcategoria(subcategoria).subscribe({
      next: () => {
        this.cargarSubcategorias();
        this.cancelar();
        Swal.fire({
          title: "¡Registrado!",
          text: "La subcategoría se registró correctamente.",
          icon: "success",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar la subcategoría.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  editar(sub: Subcategoria): void {
    this.modoEdicion = true;
    this.subcategoriaSeleccionadaId = sub.id;
    this.subcategoriaOriginal = { ...sub };

    this.formularioSubcategoria.patchValue({
      nombre: sub.nombre,
      categoria: sub.categoria?.id,
    });

    this.mostrarModal = true;
  }

  actualizar(): void {
    if (this.formularioSubcategoria.invalid) {
      this.formularioSubcategoria.markAllAsTouched();
      return;
    }

    const subcategoriaActualizada: Subcategoria = {
      ...this.formularioSubcategoria.value,
      categoria: { id: this.formularioSubcategoria.value.categoria },
    };

    const subcategoriaOriginalSimple = {
      nombre: this.subcategoriaOriginal?.nombre,
      categoria: { id: this.subcategoriaOriginal?.categoria?.id },
    };

    if (
      JSON.stringify(subcategoriaActualizada) ===
      JSON.stringify(subcategoriaOriginalSimple)
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

    this.subcategoriaService
      .actualizar(this.subcategoriaSeleccionadaId!, subcategoriaActualizada)
      .subscribe({
        next: () => {
          this.cargarSubcategorias();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "La subcategoría se actualizó correctamente.",
            icon: "success",
            toast: true,
            position: "top-end",
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la subcategoría.",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioSubcategoria.reset();
    this.formularioSubcategoria.patchValue({ categoria: null });
    this.subcategoriaSeleccionadaId = undefined;
    this.mostrarModal = true;
  }

  cancelar(): void {
    this.formularioSubcategoria.reset();
    this.modoEdicion = false;
    this.subcategoriaSeleccionadaId = undefined;
    this.mostrarModal = false;
  }

  aplicarFiltros(): void {
    let resultado = [...this.subcategorias];

    if (this.categoriaSeleccionadaId !== null) {
      resultado = resultado.filter(
        (sub) => sub.categoria?.id === this.categoriaSeleccionadaId
      );
    }

    const termino = this.searchTerm.trim().toLowerCase();
    if (termino) {
      resultado = resultado.filter((sub) =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }

    this.subcategoriasFiltradas = resultado;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  filtrarSubcategorias(): void {
    this.aplicarFiltros();
  }

  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionadaId = id;
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.subcategoriasFiltradas;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.subcategoriasPaginadas = base.slice(inicio, fin);
  }

  onItemsPorPaginaChange(): void {
    this.cambiarPagina(1);
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.categoriaSeleccionadaId = null;
    this.subcategoriasFiltradas = [...this.subcategorias];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }
}
