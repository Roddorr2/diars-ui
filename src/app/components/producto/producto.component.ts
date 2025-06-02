import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ProductoService } from "./../../services/producto.service";
import { Producto } from "../../models/producto.model";
import { Subcategoria } from "./../../models/subcategoria.model";
import { SubcategoriaService } from "./../../services/subcategoria.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { CurrencyPipe } from "@angular/common";
import { ViewEncapsulation } from "@angular/core";

import Swal from "sweetalert2";

@Component({
  selector: "app-producto",
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: "./producto.component.html",
  styleUrl: "./producto.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  subcategorias: Subcategoria[] = [];
  formularioProducto!: FormGroup;
  router = inject(Router);

  modoEdicion: boolean = false;
  productoSeleccionadoId?: number;
  mostrarModal: boolean = false;

  constructor(
    private productoService: ProductoService,
    private subcategoriaService: SubcategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarProductos();
    this.cargarSubcategorias();
  }

  inicializarFormulario(): void {
    this.formularioProducto = this.fb.group({
      codigo: [0, Validators.required],
      nombre: ["", Validators.required],
      marca: ["", Validators.required],
      descripcion: [""],
      subcategoria: [null, Validators.required],
      stock: [0, Validators.required],
      precioUnitario: [0, Validators.required],
      unidadMedida: ["UND", Validators.required],
      estado: [true],
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe((data) => {
      this.productos = data;
    });
  }

  cargarSubcategorias(): void {
    this.subcategoriaService
      .listar()
      .subscribe((data) => (this.subcategorias = data));
  }

  registrar(): void {
    if (this.formularioProducto.invalid) return;

    const producto: Producto = {
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };
    this.productoService.registrar(producto).subscribe(() => {
      this.cargarProductos();
      this.cancelar();
    });

    Swal.fire({
      title: "¡Registrado!",
      text: "El producto se registró correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  editar(producto: Producto): void {
    this.modoEdicion = true;
    this.productoSeleccionadoId = producto.id;
    this.mostrarModal = true;

    this.formularioProducto.patchValue({
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      descripcion: producto.descripcion,
      subcategoria: producto.subcategoria?.id,
      stock: producto.stock,
      precioUnitario: producto.precioUnitario,
      unidadMedida: producto.unidadMedida,
      estado: producto.estado,
    });
  }

  actualizar(): void {
    if (this.formularioProducto.invalid || this.productoSeleccionadoId == null)
      return;

    const producto: Producto = {
      id: this.productoSeleccionadoId,
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };

    this.productoService
      .modificar(this.productoSeleccionadoId, producto)
      .subscribe(() => {
        this.cargarProductos();
        this.cancelar();
      });

    Swal.fire({
      title: "¡Modificado!",
      text: "El producto se modificó correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.formularioProducto.reset();
    this.formularioProducto.patchValue({ estado: true });
    this.mostrarModal = true;
    this.productoSeleccionadoId = undefined;
  }

  cancelar(): void {
    this.formularioProducto.reset();
    this.formularioProducto.patchValue({ estado: true });
    this.modoEdicion = false;
    this.productoSeleccionadoId = undefined;
    this.mostrarModal = false;
  }

  cambiarEstado(producto: Producto): void {
    const nuevoEstado = !producto.estado;
    const accion = nuevoEstado ? "activa" : "desactiva";

    Swal.fire({
      title: `Estás seguro`,
      text: `Estas a punto de ${accion}r el producto ${producto.nombre}`,
      icon: `warning`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .cambiarEstado(producto.id!, nuevoEstado)
          .subscribe(() => {
            this.cargarProductos();
            Swal.fire({
              title: `Éxito`,
              text: `El producto fue ${accion}do correctamente`,
              icon: `success`,
              timer: 2000,
              showConfirmButton: false,
            });
          });
      }
    });
  }

  volver() {
    this.router.navigate(["/dashboard"]);
  }
}
