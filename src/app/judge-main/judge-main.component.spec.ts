import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeMainComponent } from './judge-main.component';

describe('JudgeMainComponent', () => {
  let component: JudgeMainComponent;
  let fixture: ComponentFixture<JudgeMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudgeMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JudgeMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
