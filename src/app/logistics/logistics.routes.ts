import { Route } from "@angular/router";
import { OrdenCompraComponent } from "./orden.compra/orden.compra.component";
import { DespachoComponent } from "./despacho/despacho.component";

export const LOGISTICS_ROUTES: Route[] = [
  { path: "orden-compra", component: OrdenCompraComponent },
  { path: "despacho", component: DespachoComponent },
];
