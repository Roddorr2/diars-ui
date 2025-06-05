import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subcategoria } from "../../models/subcategoria.model";
import { Categoria } from "./../../models/categoria.model";
import { SubcategoriaService } from "./../../services/subcategoria.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { map, debounceTime, switchMap, first } from "rxjs/operators";

import Swal from "sweetalert2";
import { CategoriaService } from "../../services/categoria.service";

@Component({
  selector: "app-subcategoria",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./subcategoria.component.html",
  styleUrls: ["./subcategoria.component.css"],
})
export class SubcategoriaComponent implements OnInit {
  subcategorias: Subcategoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  categorias: Categoria[] = [];
  formularioSubcategoria!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];
  subcategoriasPaginadas: Subcategoria[] = [];

  modoEdicion: boolean = false;
  subcategoriaSeleccionadaId?: number;
  mostrarModal: boolean = false;

  subcategoriaOriginal: Subcategoria | null = null;

  categoriaSeleccionadaId: number | null = null;

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((nombre: string) =>
          this.subcategoriaService.existePorNombre(nombre)
        ),
        map((existe: boolean) => (existe ? { nombreExistente: true } : null)),
        first()
      );
    };
  }

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
      nombre: ["", [Validators.required], this.nombreUnicoValidator()],
      categoria: [null, [Validators.required]],
    });
  }

  cargarSubcategorias(): void {
    this.subcategoriaService.listar().subscribe({
      next: (subcategorias) => {
        this.subcategorias = subcategorias;
        this.subcategoriasFiltradas = [...subcategorias];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  cargarCategorias(): void {
    this.categoriaService
      .listar()
      .subscribe((data) => (this.categorias = data));
  }

  registrar(): void {
    if (this.formularioSubcategoria.invalid) return;

    const subcategoria: Subcategoria = {
      ...this.formularioSubcategoria.value,
      categoria: {
        id: this.formularioSubcategoria.value.categoria,
      } as Categoria,
    };
    this.subcategoriaService
      .registrarSubcategoria(subcategoria)
      .subscribe(() => {
        this.cargarSubcategorias();
        this.cancelar();
      });

    Swal.fire({
      title: "¡Registrado",
      text: "La subcategoría se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(subcategoria: Subcategoria): void {
    this.modoEdicion = true;
    this.subcategoriaSeleccionadaId = subcategoria.id;
    this.mostrarModal = true;

    this.subcategoriaOriginal = { ...subcategoria };

    this.formularioSubcategoria.patchValue({
      nombre: subcategoria.nombre,
      categoria: subcategoria.categoria?.id,
    });
  }

  actualizar(): void {
    if (this.formularioSubcategoria.invalid) return;

    const subcategoriaActualizada: Subcategoria = {
      ...this.formularioSubcategoria.value,
      categoria: {
        id: this.formularioSubcategoria.value.categoria,
      },
    };

    if (
      JSON.stringify(subcategoriaActualizada) ===
      JSON.stringify({
        ...this.subcategoriaOriginal,
        categoria: { id: this.subcategoriaOriginal?.categoria?.id },
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

    this.subcategoriaService
      .actualizar(this.subcategoriaSeleccionadaId!, subcategoriaActualizada)
      .subscribe(() => {
        this.cargarSubcategorias();
        this.cancelar();
      });
    Swal.fire({
      title: "¡Actualizado!",
      text: "La subcategoría se actualizó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioSubcategoria.reset();
    this.mostrarModal = true;
    this.cargarCategorias();
    this.subcategoriaSeleccionadaId = undefined;
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
    if (termino !== "") {
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
    console.log("ID de categoría seleccionada:", id);
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

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
