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
  categorias: Categoria[] = [];
  formularioSubcategoria!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  paginasArray: number[] = [];
  subcategoriasPaginados: Subcategoria[] = [];

  modoEdicion: boolean = false;
  subcategoriaSeleccionadaId?: number;
  mostrarModal: boolean = false;

  subcategoriaOriginal: Subcategoria | null = null;

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
      subcategoria: {
        id: this.formularioSubcategoria.value.subcategoria,
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

  actualizarPaginacion() {
    // TODO: implementar paginacion
  }

  cancelar() {
    // TODO: implementar cancelar
  }
  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
