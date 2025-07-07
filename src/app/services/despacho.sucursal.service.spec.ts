import { TestBed } from '@angular/core/testing';

import { DespachoSucursalService } from './despacho.sucursal.service';

describe('DespachoSucursalService', () => {
  let service: DespachoSucursalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DespachoSucursalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
