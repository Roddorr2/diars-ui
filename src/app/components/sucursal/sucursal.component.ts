import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Sucursal } from "../../models/sucursal.model";
import { SucursalService } from "../../services/sucursal.service";
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

@Component({
  selector: "app-sucursal",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./sucursal.component.html",
  styleUrl: "./sucursal.component.css",
})
export class SucursalComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalesFiltradas: Sucursal[] = [];
  formularioSucursal!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];
  sucursalesPaginadas: Sucursal[] = [];

  modoEdicion: boolean = false;
  sucursalSeleccionadaId?: number;
  mostrarModal: boolean = false;

  sucursalOriginal: Sucursal | null = null;

  dominioTailoyValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const dominioRequerido = "@tailoy.com.pe";
    if (!email.endsWith(dominioRequerido)) {
      return { dominioInvalido: true };
    }
    return null;
  }

  correoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((correo: string) =>
          this.sucursalService.existePorCorreo(correo)
        ),
        map((existe: boolean) => (existe ? { correoExistente: true } : null)),
        first()
      );
    };
  }

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

  cargarSucursales(): void {
    this.sucursalService.listarSucursales().subscribe({
      next: (sucursales) => {
        this.sucursales = sucursales;
        this.sucursalesFiltradas = [...sucursales];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  registrar(): void {
    if (this.formularioSucursal.invalid) return;

    const sucursal: Sucursal = {
      ...this.formularioSucursal.value,
    };
    this.sucursalService.registrarSucursal(sucursal).subscribe(() => {
      this.cargarSucursales();
      this.cancelar();
    });

    Swal.fire({
      title: "¡Registrada",
      text: "La sucursal se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(sucursal: Sucursal): void {
    this.modoEdicion = true;
    this.sucursalSeleccionadaId = sucursal.id;
    this.mostrarModal = true;

    this.sucursalOriginal = { ...sucursal };

    this.formularioSucursal.patchValue({
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      correo: sucursal.correo,
    });
  }

  actualizar(): void {
    if (this.formularioSucursal.invalid) return;

    const sucursalActualizada: Sucursal = {
      ...this.formularioSucursal.value,
      sucursal: {
        id: this.formularioSucursal.value.sucursal,
      },
    };

    if (
      JSON.stringify(sucursalActualizada) ===
      JSON.stringify({
        ...this.sucursalOriginal,
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

    this.sucursalService
      .actualizarSucursal(this.sucursalSeleccionadaId!, sucursalActualizada)
      .subscribe(() => {
        this.cargarSucursales();
        this.cancelar();
      });
    Swal.fire({
      title: "¡Actualizada!",
      text: "La sucursal se actualizó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioSucursal.reset();
    this.mostrarModal = true;
    this.sucursalSeleccionadaId = undefined;
  }

  cancelar(): void {
    this.formularioSucursal.reset();
    this.modoEdicion = false;
    this.sucursalSeleccionadaId = undefined;
    this.mostrarModal = false;
  }

  filtrarSucursales(): void {
    const termino = this.searchTerm.trim();

    if (termino === "") {
      this.cargarSucursales();
      this.sucursalesFiltradas = [...this.sucursales];
      return;
    } else {
      this.sucursalService.buscarPorDireccionOCorreo(termino).subscribe({
        next: (sucursales) => {
          this.sucursalesFiltradas = sucursales;
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

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
