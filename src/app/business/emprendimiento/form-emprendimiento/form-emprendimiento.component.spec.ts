import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormEmprendimientoComponent } from './form-emprendimiento.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { of } from 'rxjs';

// Servicios
import { EmprendimientoService } from '../../../core/services/emprendimiento.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LugaresService } from '../../../core/services/lugar.service';

describe('FormEmprendimientoComponent', () => {
  let component: FormEmprendimientoComponent;
  let fixture: ComponentFixture<FormEmprendimientoComponent>;
  let router: Router;

  // Mocks
  class EmprendimientoServiceMock {
    verEmprendimiento(id: number) {
      return of({
        nombre: 'Test',
        lugarTuristicoId: 1,
        descripcion: 'Desc',
        tipo: 'Turismo',
        direccion: 'Dirección',
        estado: 'Activo',
        fechaAprobacion: new Date(),
        usuarioId: 1,
        contactoTelefono: '123456',
        contactoEmail: 'test@test.com',
        sitioWeb: '',
        imagenes: [{ url: 'http://test.com/image.jpg' }]
      });
    }
    crearEmprendimiento(datos: any) {
      return of({ success: true });
    }
    actualizarEmprendimiento(id: number, datos: any) {
      return of({ success: true });
    }
  }

  class AuthServiceMock {
    getUsuarios() {
      return of([{ id: 1, nombre: 'Usuario 1' }]);
    }
  }

  class SupabaseServiceMock {
    getClient() {
      return {
        storage: {
          from: (bucket: string) => ({
            upload: async (path: string, file: File) => ({ error: null }),
            getPublicUrl: (path: string) => ({ data: { publicUrl: 'http://public.url/' + path } })
          })
        }
      };
    }
  }

  class LugaresServiceMock {
    getLugares() {
      return of([{ id: 1, nombre: 'Lugar 1' }]);
    }
  }

  class RouterMock {
    navigate = jasmine.createSpy('navigate');
  }

  const createActivatedRouteMock = (id: string | null = null) => ({
    snapshot: {
      paramMap: {
        get: () => id
      }
    },
    routeConfig: { path: 'crear' }
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormEmprendimientoComponent],
      providers: [
        FormBuilder,
        { provide: EmprendimientoService, useClass: EmprendimientoServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: SupabaseService, useClass: SupabaseServiceMock },
        { provide: LugaresService, useClass: LugaresServiceMock },
        { provide: Router, useClass: RouterMock },
        { provide: ActivatedRoute, useValue: createActivatedRouteMock() }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormEmprendimientoComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false }));
    spyOn(Swal, 'showLoading').and.callFake(() => {});
    spyOn(Swal, 'close').and.callFake(() => {});

    fixture.detectChanges();
  });

  it('should create component and initialize form', () => {
    expect(component).toBeTruthy();
    expect(component.emprendimientoForm).toBeDefined();
    expect(component.tipos).toContain('Turismo');
  });

  it('should load usuarios and lugaresTuristicos on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.usuarios.length).toBeGreaterThan(0);
    expect(component.lugaresTuristicos.length).toBeGreaterThan(0);
  });

  it('should detect isEdit as false if no id in route', () => {
    expect(component.isEdit).toBeFalse();
  });

  it('should handle onFileChange and add previewUrls', async () => {
    // Simular FileReader con espía funcional
    const mockFileReader = {
      readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function (this: any, file: File) {
        this.onload({ target: { result: 'data:image/png;base64,xxx' } });
      }),
      onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null,
      result: 'data:image/png;base64,xxx'
    };
  
    spyOn(window as any, 'FileReader').and.returnValue(mockFileReader);
  
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } };
  
    component.onFileChange(event);
    fixture.detectChanges();
    await fixture.whenStable();
  
    expect(component.selectedFiles.length).toBe(1);
    expect(component.previewUrls.length).toBe(1);
  });
  

  it('should remove image from selectedFiles and previewUrls', () => {
    component.selectedFiles = [new File([''], 'f1.jpg')];
    component.previewUrls = ['url1'];
    component.removeImage(0);
    expect(component.selectedFiles.length).toBe(0);
    expect(component.previewUrls.length).toBe(0);
  });

  it('should show error if form is invalid on guardarEmprendimiento', async () => {
    component.emprendimientoForm.controls['nombre'].setValue('');
    await component.guardarEmprendimiento();

    expect(Swal.fire).toHaveBeenCalledWith(
      jasmine.objectContaining({ icon: 'error', title: 'Formulario incompleto' })
    );
  });

  it('should upload images and create emprendimiento successfully', async () => {
    component.emprendimientoForm.patchValue({
      nombre: 'Nombre',
      lugarTuristicoId: 1,
      descripcion: 'Desc',
      tipo: 'Turismo',
      direccion: 'Dir',
      estado: 'Activo',
      usuarioId: 1,
      contactoTelefono: '123',
      contactoEmail: 'a@b.com',
    });

    const file = new File([''], 'f1.jpg');
    component.selectedFiles = [file];

    await component.guardarEmprendimiento();

    expect(Swal.fire).toHaveBeenCalledWith('¡Éxito!', 'Emprendimiento guardado correctamente', 'success');
    expect(router.navigate).toHaveBeenCalledWith(['/emprendimiento']);
  });

  it('should navigate back on cancelar()', () => {
    component.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/emprendimiento']);
  });
});
