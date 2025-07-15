import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CookiesPolicyComponent } from './cookies-policy.component';

describe('CookiesPolicyComponent', () => {
  let component: CookiesPolicyComponent;
  let fixture: ComponentFixture<CookiesPolicyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CookiesPolicyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CookiesPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
