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
import { debounceTime, map, switchMap, first } from "rxjs/operators";
import { of } from "rxjs";

import Swal from "sweetalert2";

import { Usuario } from "../../models/usuario.model";
import { UsuarioService } from "../../services/usuario.service";
import { Cargo } from "../../models/cargo.model";
import { CargoService } from "../../services/cargo.service";

@Component({
  selector: "app-usuario",
  templateUrl: "./usuario.component.html",
  styleUrls: ["./usuario.component.css"],
  imports: [ReactiveFormsModule, FormsModule],
})
export class UsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuariosPaginados: Usuario[] = [];

  cargos: Cargo[] = [];
  formularioUsuario!: FormGroup;

  router = inject(Router);

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];

  modoEdicion = false;
  mostrarModal = false;

  usuarioSeleccionadoId?: number;
  usuarioOriginal: Usuario | null = null;
  usuarioActualLogueado: Usuario | null = null;

  searchTerm = "";
  cargoSeleccionadoId: number | null = null;

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
      contrasena: ["", Validators.required],
      estado: [true],
    });
  }

  dominioTailoyValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    return email.endsWith("@tailoy.com.pe") ? null : { dominioInvalido: true };
  }

  soloLetrasValidator(control: AbstractControl): ValidationErrors | null {
    const nombre = control.value;
    if (!nombre) return null;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/.test(nombre)
      ? null
      : { soloLetras: true };
  }

  correoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const correo = control.value?.trim();
      if (!correo) return of(null);
      return this.usuarioService.existePorCorreo(correo).pipe(
        debounceTime(300),
        map((existe) =>
          this.modoEdicion && this.usuarioOriginal?.correo === correo
            ? null
            : existe
            ? { correoExistente: true }
            : null
        ),
        first()
      );
    };
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const nombre = control.value?.trim();
      if (!nombre) return of(null);
      return this.usuarioService.existePorNombre(nombre).pipe(
        debounceTime(300),
        map((existe) =>
          this.modoEdicion && this.usuarioOriginal?.nombre === nombre
            ? null
            : existe
            ? { nombreExistente: true }
            : null
        ),
        first()
      );
    };
  }

  obtenerUsuarioActual(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe({
      next: (usuario) => (this.usuarioActualLogueado = usuario),
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = [...usuarios];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: () => this.alertaError("No se pudieron cargar los usuarios."),
    });
  }

  cargarCargos(): void {
    this.cargoService.listarCargos().subscribe({
      next: (data) => (this.cargos = data),
      error: () => this.alertaError("No se pudieron cargar los cargos."),
    });
  }

  registrar(): void {
    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const nuevoUsuario: Usuario = {
      ...this.formularioUsuario.value,
      cargo: { id: this.formularioUsuario.value.cargo } as Cargo,
    };

    this.usuarioService.registrarUsuario(nuevoUsuario).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cancelar();
        this.alertaExito(
          "¡Registrado!",
          "El usuario se registró correctamente."
        );
      },
      error: () => this.alertaError("No se pudo registrar el usuario."),
    });
  }

  editar(usuario: Usuario): void {
    if (this.usuarioActualLogueado?.id === usuario.id) {
      this.alertaInfo(
        "Acción no permitida",
        "No puedes editar tu propio usuario."
      );
      return;
    }

    this.modoEdicion = true;
    this.usuarioSeleccionadoId = usuario.id;
    this.usuarioOriginal = { ...usuario };
    this.formularioUsuario.reset();

    this.formularioUsuario.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      cargo: usuario.cargo?.id,
      contrasena: "",
      estado: usuario.estado,
    });

    this.mostrarModal = true;
    this.cargarCargos();
  }

  actualizar(): void {
    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const actualizado: Usuario = {
      id: this.usuarioSeleccionadoId,
      ...this.formularioUsuario.value,
      cargo: { id: this.formularioUsuario.value.cargo } as Cargo,
    };

    const originalComparable = {
      ...this.usuarioOriginal,
      cargo: { id: this.usuarioOriginal?.cargo?.id },
    };

    const actualizadoComparable = {
      ...actualizado,
      cargo: { id: actualizado.cargo.id },
    };

    if (
      JSON.stringify(actualizadoComparable) ===
      JSON.stringify(originalComparable)
    ) {
      this.alertaInfo(
        "Sin cambios",
        "No se ha realizado ninguna modificación."
      );
      return;
    }

    this.usuarioService
      .actualizarUsuario(actualizado.id!, actualizado)
      .subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cancelar();
          this.alertaExito(
            "¡Actualizado!",
            "El usuario se actualizó correctamente."
          );
        },
        error: () => this.alertaError("No se pudo actualizar el usuario."),
      });
  }

  cambiarEstado(usuario: Usuario): void {
    if (this.usuarioActualLogueado?.id === usuario.id && usuario.estado) {
      this.alertaInfo(
        "¡Acción no permitida!",
        "No puedes desactivar tu propio usuario mientras estás logueado."
      );
      return;
    }

    const nuevoEstado = !usuario.estado;
    const accion = nuevoEstado ? "activar" : "desactivar";

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion} el usuario ${usuario.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.cambiarEstado(usuario.id!, nuevoEstado).subscribe({
          next: () => {
            this.cargarUsuarios();
            this.alertaExito(
              "¡Éxito!",
              `El usuario fue ${accion}do correctamente`
            );
          },
          error: () => this.alertaError(`No se pudo ${accion} el usuario.`),
        });
      }
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionadoId = undefined;
    this.usuarioOriginal = null;
    this.formularioUsuario.reset();
    this.formularioUsuario.patchValue({ estado: true });
    this.mostrarModal = true;
    this.cargarCargos();
  }

  cancelar(): void {
    this.formularioUsuario.reset();
    this.modoEdicion = false;
    this.mostrarModal = false;
    this.usuarioSeleccionadoId = undefined;
    this.usuarioOriginal = null;
  }

  aplicarFiltros(): void {
    let resultado = [...this.usuarios];

    if (this.cargoSeleccionadoId !== null) {
      resultado = resultado.filter(
        (u) => u.cargo?.id === this.cargoSeleccionadoId
      );
    }

    const termino = this.searchTerm.trim().toLowerCase();
    if (termino) {
      resultado = resultado.filter((u) =>
        u.nombre.toLowerCase().includes(termino)
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
    this.cargoSeleccionadoId = id;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchTerm = "";
    this.cargoSeleccionadoId = null;
    this.usuariosFiltrados = [...this.usuarios];
    this.paginaActual = 1;
    this.actualizarPaginacion();
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
      timer: 3000,
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
      timer: 3000,
      showConfirmButton: false,
    });
  }
}
