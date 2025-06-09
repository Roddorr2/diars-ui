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
import { map, debounceTime, switchMap, first } from "rxjs/operators";

import Swal from "sweetalert2";
import { Cargo } from "../../models/cargo.model";
import { CargoService } from "../../services/cargo.service";

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
          this.usuarioService.existePorCorreo(correo)
        ),
        map((existe: boolean) => (existe ? { correoExistente: true } : null)),
        first()
      );
    };
  }

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap((nombre: string) =>
          this.usuarioService.existePorNombre(nombre)
        ),
        map((existe: boolean) => (existe ? { nombreExistente: true } : null)),
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

  constructor(
    private usuarioService: UsuarioService,
    private cargoService: CargoService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
  }

  inicializarFormulario(): void {
    this.formularioUsuario = this.fb.group({
      nombre: ["", [Validators.required, this.nombreUnicoValidator()]],
      correo: [
        "",
        [Validators.required, this.dominioTailoyValidator],
        [this.correoUnicoValidator()],
      ],
      estado: [true],
    });
  }

  cargarCargos(): void {
    this.cargoService.listarCargos().subscribe((data) => (this.cargos = data));
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

    this.formularioUsuario.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      cargo: usuario.cargo?.id,
      estado: usuario.estado,
    });
  }

  actualizar(): void {
    if (this.formularioUsuario.invalid) return;

    const usuarioActualizado: Usuario = {
      ...this.formularioUsuario.value,
      cargo: {
        id: this.formularioUsuario.value.cargo,
      } as Cargo,
    };

    if (
      JSON.stringify(usuarioActualizado) ===
      JSON.stringify({
        ...this.usuarioOriginal,
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

    this.usuarioService
      .actualizarUsuario(this.usuarioSeleccionadoId!, usuarioActualizado)
      .subscribe(() => {
        this.cargarUsuarios();
        this.cancelar();
      });
    Swal.fire({
      title: "¡Actualizado!",
      text: "El usuario se actualizó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
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
    const nuevoEstado = !usuario.estado;
    const accion = nuevoEstado ? "activa" : "desactiva";

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion}r el Usuario ${usuario.nombre}`,
      icon: `warning`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}r`,
      cancelButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService
          .cambiarEstado(usuario.id!, nuevoEstado)
          .subscribe(() => {
            this.cargarUsuarios();
            Swal.fire({
              title: `Éxito`,
              text: `El usuario fue ${accion}do correctamente`,
              icon: `success`,
              timer: 2000,
              showConfirmButton: false,
            });
          });
      }
    });
  }

  filtrarUsuarios(): void {
    const termino = this.searchTerm.trim();

    if (termino === "") {
      this.cargarUsuarios();
      this.usuariosFiltrados = [...this.usuarios];
      return;
    } else {
      this.usuarioService.buscarPorNombreOCorreo(termino).subscribe({
        next: (usuarios) => {
          this.usuariosFiltrados = usuarios;
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

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
