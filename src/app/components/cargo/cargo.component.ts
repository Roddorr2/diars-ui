import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Cargo } from "./../../models/cargo.model";
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
import { CargoService } from "../../services/cargo.service";

@Component({
  selector: "app-cargo",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./cargo.component.html",
  styleUrl: "./cargo.component.css",
})
export class CargoComponent implements OnInit {
  cargos: Cargo[] = [];
  cargosFiltrados: Cargo[] = [];
  formularioCargo!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  paginasArray: number[] = [];
  cargosPaginados: Cargo[] = [];

  modoEdicion: boolean = false;
  cargoSeleccionadoId?: number;
  mostrarModal: boolean = false;

  cargoOriginal: Cargo | null = null;

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
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

  cargarCargos(): void {
    this.cargoService.listarCargos().subscribe({
      next: (cargos) => {
        this.cargos = cargos;
        this.cargosFiltrados = [...cargos];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  registrar(): void {
    if (this.formularioCargo.invalid) return;

    const cargo: Cargo = {
      ...this.formularioCargo.value,
    };
    this.cargoService.registrarCargo(cargo).subscribe(() => {
      this.cargarCargos();
      this.cancelar();
    });

    Swal.fire({
      title: "¡Registrado!",
      text: "El cargo se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(cargo: Cargo): void {
    this.modoEdicion = true;
    this.cargoSeleccionadoId = cargo.id;
    this.mostrarModal = true;

    this.cargoOriginal = { ...cargo };

    this.formularioCargo.patchValue({
      nombre: cargo.nombre,
    });
  }

  actualizar(): void {
    if (this.formularioCargo.invalid) return;

    const cargoActualizado: Cargo = {
      ...this.formularioCargo.value,
      cargo: {
        id: this.formularioCargo.value.cargo,
      },
    };

    if (
      JSON.stringify(cargoActualizado) ===
      JSON.stringify({
        ...this.cargoOriginal,
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

    this.cargoService
      .actualizarCargo(this.cargoSeleccionadoId!, cargoActualizado)
      .subscribe(() => {
        this.cargarCargos();
        this.cancelar();
      });
    Swal.fire({
      title: "¡Actualizado!",
      text: "El cargo se actualizó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
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
      this.cargosFiltrados = [...this.cargos];
      return;
    } else {
      this.cargoService.buscarPorNombre(termino).subscribe({
        next: (cargos) => {
          this.cargosFiltrados = cargos;
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

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
