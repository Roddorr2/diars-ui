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
import { map, debounceTime, first, of } from "rxjs";

import Swal from "sweetalert2";

import { Sucursal } from "../../models/sucursal.model";
import { SucursalService } from "../../services/sucursal.service";

@Component({
  selector: "app-sucursal",
  templateUrl: "./sucursal.component.html",
  styleUrls: ["./sucursal.component.css"],
  imports: [ReactiveFormsModule, FormsModule],
})
export class SucursalComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalesFiltradas: Sucursal[] = [];
  sucursalesPaginadas: Sucursal[] = [];

  formularioSucursal!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion = false;
  sucursalSeleccionadaId?: number;
  mostrarModal = false;
  sucursalOriginal: Sucursal | null = null;

  constructor(
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarSucursales();
  }

  inicializarFormulario(): void {
    this.formularioSucursal = this.fb.group({
      ciudad: ["", [Validators.required]],
      direccion: ["", [Validators.required]],
      correo: [
        "",
        [Validators.required, this.dominioTailoyValidator],
        [this.correoUnicoValidator()],
      ],
    });
  }

  dominioTailoyValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const dominio = "@tailoy.com.pe";
    return email.endsWith(dominio) ? null : { dominioInvalido: true };
  }

  correoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const correo = control.value?.trim();
      if (!correo) return of(null);

      return this.sucursalService.existePorCorreo(correo).pipe(
        debounceTime(300),
        map((existe) => {
          if (this.modoEdicion && this.sucursalOriginal?.correo === correo) {
            return null;
          }
          return existe ? { correoExistente: true } : null;
        }),
        first()
      );
    };
  }

  cargarSucursales(): void {
    this.sucursalService.listarSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
        this.sucursalesFiltradas = [...data];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        this.alertaError("No se pudieron cargar las sucursales.");
      },
    });
  }

  registrar(): void {
    if (this.formularioSucursal.invalid) {
      this.formularioSucursal.markAllAsTouched();
      return;
    }

    const sucursal: Sucursal = { ...this.formularioSucursal.value };

    this.sucursalService.registrarSucursal(sucursal).subscribe({
      next: () => {
        this.cargarSucursales();
        this.cancelar();
        this.alertaExito(
          "¡Registrada!",
          "La sucursal se registró correctamente."
        );
      },
      error: () => {
        this.alertaError("No se pudo registrar la sucursal.");
      },
    });
  }

  editar(sucursal: Sucursal): void {
    this.modoEdicion = true;
    this.sucursalSeleccionadaId = sucursal.id;
    this.sucursalOriginal = { ...sucursal };

    this.formularioSucursal.patchValue({
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      correo: sucursal.correo,
    });

    this.mostrarModal = true;
  }

  actualizar(): void {
    if (this.formularioSucursal.invalid) {
      this.formularioSucursal.markAllAsTouched();
      return;
    }

    const sucursalActualizada: Sucursal = { ...this.formularioSucursal.value };

    const originalSimple = {
      ciudad: this.sucursalOriginal?.ciudad,
      direccion: this.sucursalOriginal?.direccion,
      correo: this.sucursalOriginal?.correo,
    };

    if (
      JSON.stringify(sucursalActualizada) === JSON.stringify(originalSimple)
    ) {
      this.alertaInfo(
        "Sin cambios",
        "No se ha realizado ninguna modificación."
      );
      return;
    }

    this.sucursalService
      .actualizarSucursal(this.sucursalSeleccionadaId!, sucursalActualizada)
      .subscribe({
        next: () => {
          this.cargarSucursales();
          this.cancelar();
          this.alertaExito(
            "¡Actualizada!",
            "La sucursal se actualizó correctamente."
          );
        },
        error: () => {
          this.alertaError("No se pudo actualizar la sucursal.");
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.sucursalSeleccionadaId = undefined;
    this.sucursalOriginal = null;
    this.formularioSucursal.reset();
    this.mostrarModal = true;
  }

  cancelar(): void {
    this.formularioSucursal.reset();
    this.modoEdicion = false;
    this.sucursalSeleccionadaId = undefined;
    this.sucursalOriginal = null;
    this.mostrarModal = false;
  }

  filtrarSucursales(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    if (termino === "") {
      this.sucursalesFiltradas = [...this.sucursales];
      this.actualizarPaginacion();
      return;
    }

    this.sucursalService.buscarPorDireccionOCorreo(termino).subscribe({
      next: (data) => {
        this.sucursalesFiltradas = data;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => {
        this.alertaError("No se pudieron filtrar las sucursales.");
      },
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.sucursalesFiltradas;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.sucursalesPaginadas = base.slice(inicio, fin);
  }

  volver(): void {
    this.router.navigate(["/dashboard"]);
  }

  private alertaExito(titulo: string, texto: string): void {
    Swal.fire({
      title: titulo,
      text: texto,
      icon: "success",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private alertaError(texto: string): void {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: texto,
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private alertaInfo(titulo: string, texto: string): void {
    Swal.fire({
      icon: "info",
      title: titulo,
      text: texto,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  }
}
