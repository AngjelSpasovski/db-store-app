import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServiceDeliveryPolicyComponent } from './service-delivery-policy.component';

describe('ServiceDeliveryPolicyComponent', () => {
  let component: ServiceDeliveryPolicyComponent;
  let fixture: ComponentFixture<ServiceDeliveryPolicyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ServiceDeliveryPolicyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceDeliveryPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
