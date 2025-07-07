import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Proveedor } from "./../../models/proveedor.model";
import { ProveedorService } from "./../../services/proveedor.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { map, debounceTime, first } from "rxjs/operators";

import Swal from "sweetalert2";
import { of } from "rxjs";

@Component({
  selector: "app-proveedor",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./proveedor.component.html",
  styleUrl: "./proveedor.component.css",
})
export class ProveedorComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  formularioProveedor!: FormGroup;
  router = inject(Router);
  searchTerm: string = "";

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  paginasArray: number[] = [];
  proveedoresPaginados: Proveedor[] = [];

  modoEdicion: boolean = false;
  proveedorSeleccionadoId?: number;
  mostrarModal: boolean = false;

  proveedorOriginal: Proveedor | null = null;

  nombreUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value.trim() === "") {
        return of(null);
      }

      return this.proveedorService.existePorNombre(control.value.trim()).pipe(
        map((existe: boolean) => {
          if (
            this.modoEdicion &&
            this.proveedorOriginal?.nombre === control.value.trim()
          ) {
            return null;
          }
          return existe ? { nombreExistente: true } : null;
        }),
        debounceTime(300),
        first()
      );
    };
  }

  rucUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value.trim() === "") {
        return of(null);
      }

      return this.proveedorService.existePorRuc(control.value.trim()).pipe(
        map((existe: boolean) => {
          if (
            this.modoEdicion &&
            this.proveedorOriginal?.ruc === control.value.trim()
          ) {
            return null;
          }
          return existe ? { rucExistente: true } : null;
        }),
        debounceTime(300),
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

  telefonoValidator(control: AbstractControl): ValidationErrors | null {
    const telefono = control.value;
    if (!telefono) return null;

    const regex = /^\(?(\d{2,3})\)?[-\s]?(\d{3,4})[-\s]?(\d{3,4})$/;

    if (!regex.test(telefono)) {
      return { telefonoInvalido: true };
    }

    return null;
  }

  constructor(
    private proveedorService: ProveedorService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarProveedores();
  }

  inicializarFormulario(): void {
    this.formularioProveedor = this.fb.group({
      nombre: ["", [Validators.required], [this.nombreUnicoValidator()]],
      ruc: [
        "",
        [Validators.required, this.rucValidator],
        [this.rucUnicoValidator()],
      ],
      telefono: ["", [Validators.required, this.telefonoValidator]],
      direccion: ["", [Validators.required]],
      estado: [true],
    });
  }

  cargarProveedores(): void {
    this.proveedorService.listarProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.proveedoresFiltrados = proveedores;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los proveedores.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  registrar(): void {
    if (this.formularioProveedor.invalid) {
      this.formularioProveedor.markAllAsTouched();
      return;
    }

    const proveedor: Proveedor = {
      ...this.formularioProveedor.value,
    };

    this.proveedorService.registrarProveedor(proveedor).subscribe({
      next: () => {
        this.cargarProveedores();
        this.cancelar();
        Swal.fire({
          title: "¡Registrado!",
          text: "El proveedor se registró correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar el proveedor.",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });
      },
    });
  }

  editar(proveedor: Proveedor): void {
    this.modoEdicion = true;
    this.proveedorSeleccionadoId = proveedor.id;
    this.mostrarModal = true;

    this.proveedorOriginal = { ...proveedor };

    this.formularioProveedor.patchValue({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      telefono: proveedor.telefono,
      direccion: proveedor.direccion,
      estado: proveedor.estado,
    });
  }

  actualizar(): void {
    if (this.formularioProveedor.invalid) {
      this.formularioProveedor.markAllAsTouched();
      return;
    }

    const proveedorActualizado: Proveedor = {
      id: this.proveedorSeleccionadoId,
      ...this.formularioProveedor.value,
    };

    if (
      JSON.stringify(proveedorActualizado) ===
      JSON.stringify(this.proveedorOriginal)
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

    this.proveedorService
      .actualizarProveedor(this.proveedorSeleccionadoId!, proveedorActualizado)
      .subscribe({
        next: () => {
          this.cargarProveedores();
          this.cancelar();
          Swal.fire({
            title: "¡Actualizado!",
            text: "El proveedor se actualizó correctamente.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        },
        error: (err) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el proveedor.",
            toast: true,
            position: "top-end",
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.proveedorOriginal = null;
    this.proveedorSeleccionadoId = undefined;
    this.formularioProveedor.reset();
    this.formularioProveedor.patchValue({
      estado: true,
    });

    this.mostrarModal = true;
  }

  cancelar(): void {
    this.formularioProveedor.reset();
    this.modoEdicion = false;
    this.proveedorSeleccionadoId = undefined;
    this.proveedorOriginal = null;
    this.mostrarModal = false;
  }

  cambiarEstado(proveedor: Proveedor): void {
    const nuevoEstado = !proveedor.estado;
    const accion = nuevoEstado ? "activa" : "desactiva";

    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Estás a punto de ${accion}r el proveedor ${proveedor.nombre}`,
      icon: `warning`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}r`,
      cancelButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedorService
          .cambiarEstadoProveedor(proveedor.id!, nuevoEstado)
          .subscribe({
            next: () => {
              this.cargarProveedores();
              Swal.fire({
                title: `Éxito`,
                text: `El proveedor fue ${accion}do correctamente`,
                icon: `success`,
                timer: 2000,
                showConfirmButton: false,
              });
            },
            error: () => {
              Swal.fire({
                title: "Error",
                text: `No se pudo ${accion}r el proveedor`,
                icon: "error",
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

  filtrarProveedores(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    if (termino === "") {
      this.proveedoresFiltrados = [...this.proveedores];
      this.actualizarPaginacion();
      return;
    }

    this.proveedorService.buscarProveedores(termino).subscribe({
      next: (proveedores) => {
        this.proveedoresFiltrados = proveedores;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo realizar la búsqueda de proveedores.",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });

        this.proveedoresFiltrados = this.proveedores.filter(
          (p) =>
            p.nombre.toLowerCase().includes(termino) ||
            p.ruc.includes(termino) ||
            p.telefono.includes(termino)
        );
      },
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const base = this.proveedoresFiltrados;

    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginasArray = Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.proveedoresPaginados = base.slice(inicio, fin);
  }

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
