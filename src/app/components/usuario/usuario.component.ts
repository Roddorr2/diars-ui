import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Usuario } from "./../../models/usuario.model";
import { UsuarioService } from "./../../services/usuario.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import {
  map,
  debounceTime,
  switchMap,
  first,
  catchError,
} from "rxjs/operators";

import Swal from "sweetalert2";
import { Cargo } from "../../models/cargo.model";
import { CargoService } from "../../services/cargo.service";
import { EMPTY, Observable, of } from "rxjs";

@Component({
  selector: "app-usuario",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./usuario.component.html",
  styleUrl: "./usuario.component.css",
})
export class UsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  cargos: Cargo[] = [];
  formularioUsuario!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];
  usuariosPaginados: Usuario[] = [];

  modoEdicion: boolean = false;
  usuarioSeleccionadoId?: number;
  mostrarModal: boolean = false;

  usuarioOriginal: Usuario | null = null;

  usuarioActualLogueado: Usuario | null = null;

  cargoSeleccionadoId: number | null = null;

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
      if (!control.value || control.value === 0) return of(null);
      return this.usuarioService.existePorCorreo(control.value).pipe(
        debounceTime(300),
        map((existe: boolean) => {
          if (
            this.modoEdicion &&
            this.usuarioOriginal?.correo === control.value
          ) {
            return null;
          }
          return existe ? { correoExistente: true } : null;
        }),
        first()
      );
    };
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value === 0) return of(null);
      return this.usuarioService.existePorNombre(control.value).pipe(
        debounceTime(300),
        map((existe: boolean) => {
          if (
            this.modoEdicion &&
            this.usuarioOriginal?.nombre === control.value
          ) {
            return null;
          }
          return existe ? { nombreExistente: true } : null;
        }),
        first()
      );
    };
  }

  rucValidator(control: AbstractControl): ValidationErrors | null {
    const ruc = control.value;
    if (!ruc) return null;

    const rucRegex = /^20[0-9]{9}$/;
    if (!rucRegex.test(ruc)) {
      return { rucInvalido: true };
    }

    return null;
  }

  soloLetrasValidator(control: AbstractControl): ValidationErrors | null {
    const nombre = control.value;
    if (!nombre) return null;

    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
      return { soloLetras: true };
    }
    return null;
  }

  constructor(
    private usuarioService: UsuarioService,
    private cargoService: CargoService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
    this.cargarCargos();
    this.obtenerUsuarioActual();
  }

  obtenerUsuarioActual(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe({
      next: (usuario) => {
        this.usuarioActualLogueado = usuario;
      },
      error: (err) => {
        console.error("Error al obtener usuario actual:", err);
      },
    });
  }

  inicializarFormulario(): void {
    this.formularioUsuario = this.fb.group({
      nombre: [
        "",
        [Validators.required, this.soloLetrasValidator],
        [this.nombreUnicoValidator()],
      ],
      correo: [
        "",
        [Validators.required, Validators.email, this.dominioTailoyValidator],
        [this.correoUnicoValidator()],
      ],
      cargo: [null, Validators.required],
      estado: [true],
    });
  }

  cargarCargos(): void {
    this.cargoService.listarCargos().subscribe({
      next: (data) => {
        this.cargos = data;
      },
      error: (err) => {
        console.error("Error al cargar cargos:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los cargos",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      },
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => console.error(err),
    });
  }

  registrar(): void {
    if (this.formularioUsuario.invalid) return;

    const Usuario: Usuario = {
      ...this.formularioUsuario.value,
      cargo: {
        id: this.formularioUsuario.value.cargo,
      } as Cargo,
    };
    this.usuarioService.registrarUsuario(Usuario).subscribe(() => {
      this.cargarUsuarios();
      this.cancelar();
    });

    Swal.fire({
      title: "¡Registrado",
      text: "El usuario se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioSeleccionadoId = usuario.id;
    this.mostrarModal = true;
    this.usuarioOriginal = { ...usuario };
    this.inicializarFormulario();
    this.formularioUsuario.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      cargo: usuario.cargo?.id,
      estado: usuario.estado,
    });

    this.cargarCargos();
  }

  actualizar(): void {
    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const usuarioActualizado: Usuario = {
      id: this.usuarioSeleccionadoId,
      ...this.formularioUsuario.value,
      cargo: {
        id: this.formularioUsuario.value.cargo,
      } as Cargo,
    };
    const usuarioOriginalComparable = {
      ...this.usuarioOriginal,
      cargo: { id: this.usuarioOriginal?.cargo?.id },
    };

    const usuarioActualizadoComparable = {
      ...usuarioActualizado,
      cargo: { id: usuarioActualizado.cargo.id },
    };

    if (
      JSON.stringify(usuarioActualizadoComparable) ===
      JSON.stringify(usuarioOriginalComparable)
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

    this.usuarioService
      .actualizarUsuario(this.usuarioSeleccionadoId!, usuarioActualizado)
      .subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "El usuario se actualizó correctamente.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        },
        error: (err) => {
          console.error("Error al actualizar usuario:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el usuario",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioUsuario.reset();
    this.formularioUsuario.patchValue({ estado: true });
    this.mostrarModal = true;
    this.cargarCargos();
    this.usuarioSeleccionadoId = undefined;
  }

  cancelar(): void {
    this.formularioUsuario.reset();
    this.modoEdicion = false;
    this.usuarioSeleccionadoId = undefined;
    this.mostrarModal = false;
  }

  cambiarEstado(usuario: Usuario): void {
    if (
      !usuario.estado === false &&
      this.usuarioActualLogueado &&
      usuario.id === this.usuarioActualLogueado.id
    ) {
      Swal.fire({
        icon: "warning",
        title: "¡Acción no permitida!",
        text: "No puedes desactivar tu propio usuario mientras estás logueado.",
        showConfirmButton: true,
        confirmButtonText: "Entendido",
      });
      return;
    }

    const nuevoEstado = !usuario.estado;
    const accion = nuevoEstado ? "activar" : "desactivar";

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion} el usuario ${usuario.nombre}`,
      icon: `warning`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.cambiarEstado(usuario.id!, nuevoEstado).subscribe({
          next: () => {
            this.cargarUsuarios();
            Swal.fire({
              title: `¡Éxito!`,
              text: `El usuario fue ${accion}do correctamente`,
              icon: `success`,
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
            });
          },
          error: (err) => {
            console.error(`Error al ${accion} usuario:`, err);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `No se pudo ${accion} el usuario`,
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

  aplicarFiltros(): void {
    let resultado = [...this.usuarios];

    if (this.cargoSeleccionadoId !== null) {
      resultado = resultado.filter(
        (usu) => usu.cargo?.id === this.cargoSeleccionadoId
      );
    }

    const termino = this.searchTerm.trim().toLowerCase();
    if (termino !== "") {
      resultado = resultado.filter((sub) =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }

    this.usuariosFiltrados = resultado;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  filtrarUsuarios(): void {
    this.aplicarFiltros();
  }

  filtrarPorCargo(id: number | null): void {
    console.log("ID de cargo seleccionado:", id);
    this.cargoSeleccionadoId = id;
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.usuariosFiltrados;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.usuariosPaginados = base.slice(inicio, fin);
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.cargoSeleccionadoId = null;
    this.usuariosFiltrados = [...this.usuarios];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
