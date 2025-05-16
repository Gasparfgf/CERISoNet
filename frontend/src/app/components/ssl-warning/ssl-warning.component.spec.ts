import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SslWarningComponent } from './ssl-warning.component';

describe('SslWarningComponent', () => {
  let component: SslWarningComponent;
  let fixture: ComponentFixture<SslWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SslWarningComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SslWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
