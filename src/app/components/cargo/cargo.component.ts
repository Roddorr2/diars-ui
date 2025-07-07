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
import { map, debounceTime, switchMap, first } from "rxjs/operators";
import { of } from "rxjs";
import { Router } from "@angular/router";
import Swal from "sweetalert2";

import { Cargo } from "../../models/cargo.model";
import { CargoService } from "../../services/cargo.service";

@Component({
  selector: "app-cargo",
  templateUrl: "./cargo.component.html",
  styleUrl: "./cargo.component.css",
  imports: [ReactiveFormsModule, FormsModule],
})
export class CargoComponent implements OnInit {
  cargos: Cargo[] = [];
  cargosFiltrados: Cargo[] = [];
  cargosPaginados: Cargo[] = [];

  formularioCargo!: FormGroup;

  searchTerm: string = "";
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion: boolean = false;
  cargoSeleccionadoId?: number;
  mostrarModal: boolean = false;
  cargoOriginal: Cargo | null = null;

  router = inject(Router);

  constructor(private cargoService: CargoService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCargos();
  }

  inicializarFormulario(): void {
    this.formularioCargo = this.fb.group({
      nombre: ["", [Validators.required], this.nombreUnicoValidator()],
    });
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (this.modoEdicion && this.cargoOriginal?.nombre === control.value) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((nombre: string) =>
          this.cargoService.existeCargoPorNombre(nombre)
        ),
        map((existe: boolean) => (existe ? { nombreExistente: true } : null)),
        first()
      );
    };
  }

  cargarCargos(): void {
    this.cargoService.listarCargos().subscribe({
      next: (cargos) => {
        this.cargos = cargos;
        this.cargosFiltrados = [...cargos];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar la lista de cargos",
        });
      },
    });
  }

  registrar(): void {
    if (this.formularioCargo.invalid) {
      this.formularioCargo.markAllAsTouched();
      return;
    }

    const cargo: Cargo = { ...this.formularioCargo.value };

    this.cargoService.registrarCargo(cargo).subscribe({
      next: () => {
        this.cargarCargos();
        this.cancelar();
        Swal.fire({
          title: "¡Registrado!",
          text: "El cargo se registró correctamente.",
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
          text: "No se pudo registrar el cargo",
        });
      },
    });
  }

  editar(cargo: Cargo): void {
    this.modoEdicion = true;
    this.cargoSeleccionadoId = cargo.id;
    this.mostrarModal = true;
    this.cargoOriginal = { ...cargo };
    this.formularioCargo.patchValue({ nombre: cargo.nombre });
  }

  actualizar(): void {
    if (this.formularioCargo.invalid) {
      this.formularioCargo.markAllAsTouched();
      return;
    }

    const cargoActualizado: Cargo = {
      id: this.cargoSeleccionadoId!,
      ...this.formularioCargo.value,
    };

    if (
      JSON.stringify(cargoActualizado) === JSON.stringify(this.cargoOriginal)
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

    this.cargoService
      .actualizarCargo(this.cargoSeleccionadoId!, cargoActualizado)
      .subscribe({
        next: () => {
          this.cargarCargos();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "El cargo se actualizó correctamente.",
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
            text: "No se pudo actualizar el cargo",
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioCargo.reset();
    this.mostrarModal = true;
    this.cargoSeleccionadoId = undefined;
  }

  cancelar(): void {
    this.formularioCargo.reset();
    this.modoEdicion = false;
    this.cargoSeleccionadoId = undefined;
    this.mostrarModal = false;
  }

  filtrarCargos(): void {
    const termino = this.searchTerm.trim();

    if (termino === "") {
      this.cargarCargos();
      return;
    }

    this.cargoService.buscarPorNombre(termino).subscribe({
      next: (cargos) => {
        this.cargosFiltrados = cargos;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo buscar por nombre",
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
    const base = this.cargosFiltrados;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.cargosPaginados = base.slice(inicio, fin);
  }

  onItemsPorPaginaChange(): void {
    this.cambiarPagina(1);
    this.actualizarPaginacion();
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }
}
