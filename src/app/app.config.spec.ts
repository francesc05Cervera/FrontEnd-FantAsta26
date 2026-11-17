import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('Configurazione routing', () => {
  it('utilizza URL con hash per le pagine della SPA', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(LocationStrategy)).toBeInstanceOf(HashLocationStrategy);
    expect(TestBed.inject(LocationStrategy).prepareExternalUrl('/login')).toContain('#/login');
  });
});
