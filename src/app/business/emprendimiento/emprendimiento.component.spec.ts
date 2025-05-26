import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmprendimientoService } from '../../core/services/emprendimiento.service';
import { EmprendimientoComponent } from './emprendimiento.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('EmprendimientoComponent', () => {
  let component: EmprendimientoComponent;
  let fixture: ComponentFixture<EmprendimientoComponent>;
  let service: EmprendimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [EmprendimientoComponent],
      providers: [EmprendimientoService]
    });

    fixture = TestBed.createComponent(EmprendimientoComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(EmprendimientoService);
  });

  it('debería cargar emprendimientos al iniciar', () => {
    const mockData = [{ id: 1, nombre: 'E1' }];
    spyOn(service, 'listarEmprendimientos').and.returnValue(of(mockData));

    fixture.detectChanges(); // Ejecuta ngOnInit()

    expect(component.emprendimientos).toEqual(mockData);
  });
});
