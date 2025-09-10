import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionDutsComponent } from './reception-duts.component';

describe('ReceptionDutsComponent', () => {
  let component: ReceptionDutsComponent;
  let fixture: ComponentFixture<ReceptionDutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionDutsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceptionDutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
