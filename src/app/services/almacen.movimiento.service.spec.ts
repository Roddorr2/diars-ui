import { TestBed } from '@angular/core/testing';

import { AlmacenMovimientoService } from './almacen.movimiento.service';

describe('AlmacenMovimientoService', () => {
  let service: AlmacenMovimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlmacenMovimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
