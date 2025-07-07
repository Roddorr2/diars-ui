import { HistoryComponent } from "./history/history.component";
import { Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { DashboardComponent } from "./dashboard.component";
import { WarehouseComponent } from "./warehouse/warehouse.component";
import { InventoryComponent } from "./inventory/inventory.component";
export const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "dashboard",
    component: DashboardComponent,
  },
  {
    path: "components",
    loadChildren: () =>
      import("./components/components.routes").then((m) => m.COMPONENTS_ROUTES),
  },
  {
    path: "logistics",
    loadChildren: () =>
      import("./logistics/logistics.routes").then((m) => m.LOGISTICS_ROUTES),
  },
  {
    path: "history",
    component: HistoryComponent,
  },
  {
    path: "warehouse",
    component: WarehouseComponent,
  },
  {
    path: "inventory",
    component: InventoryComponent,
  },
  { path: "**", redirectTo: "dashboard" },
];
