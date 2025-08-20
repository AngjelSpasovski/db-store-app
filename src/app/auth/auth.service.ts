// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from './auth.environment';

// --- UPDATE: legacy-compat User interface (опционални полиња) ---
export interface User {
  id: string | number;
  email: string;
  role: string;                // user | admin | superadmin
  // опционални (за стар код што сè уште ги чита)
  name?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


export interface SignInReq {
  email: string;
  password: string;
}

export interface SignInRes {
  accessToken: string;
  user: {
    id:          string;
    firstName:   string;
    lastName:    string;
    email:       string;
    companyName: string;
    role:        string;   // user | admin | superadmin
    isActive:    boolean;
    createdAt:   string;
    updatedAt:   string;
  };
}

export interface SignUpReq {
  user: {
    email:        string;
    companyName:  string;
    firstName:    string;
    lastName:     string;
    password:     string;
    consent1:     boolean;
    consent2:     boolean;
    consent3?:    boolean;
    consent4?:    boolean;
    consent5?:    boolean;
  };
  billingDetails: {
    email:           string;
    company:         string;
    address1:        string;
    address2?:       string;
    buildingNumber?: string;
    zipCode:         string;
    city:            string;
    stateCode:       string;
    nation:          string;
    vatNumber:       string;
  };
}

type ApiOk = { status: true };

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = (environment as any).baseApiUrl ?? '/api';

  public isAuthed$    = new BehaviorSubject<boolean>(!!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)));
  public currentUser$ = new BehaviorSubject<SignInRes['user'] | null>(this.readUser());

  // --- NEW: keep old flags so постоечкиот код компајлира ---
  public isLoggedIn = !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
  public logoutEvent = new BehaviorSubject<boolean>(false);
  public showLogoutModal$ = new BehaviorSubject<boolean>(false); // ако не се користи, не смета

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  /** Build /auth/* URL */
  private api(path: string): string {
    const base = String(this.base).replace(/\/+$/, '');
    return `${base}/auth/${path}`;
  }

  // === REAL BACKEND METHODS ===================================================

  signIn(body: SignInReq, remember = false): Observable<SignInRes> {
    return this.http.post<SignInRes>(this.api('sign-in'), body).pipe(
      tap(res => {
        const user = { ...res.user, role: (res.user.role || 'user').toLowerCase() };
        this.storeToken(res.accessToken, remember);
        this.storeUser(user, remember);
        this.currentUser$.next(user);
        this.isAuthed$.next(true);
      })
    );
  }

  signUp(body: SignUpReq): Observable<ApiOk> {
    return this.http.post<ApiOk>(this.api('sign-up'), body);
  }

  confirmEmailSend(email: string): Observable<ApiOk> {
    return this.http.post<ApiOk>(this.api('confirm-email/send'), { email });
  }

  confirmEmail(token: string): Observable<ApiOk> {
    return this.http.post<ApiOk>(this.api('confirm-email'), { token });
  }

  resetPasswordSend(email: string) {
    return this.http.post<ApiOk>(this.api('reset-password/send'), { email });
  }

  resetPasswordVerify(token: string) {
    return this.http.post<ApiOk>(this.api('reset-password/verify'), { token });
  }

  resetPasswordSet(token: string, password: string) {
    return this.http.post<ApiOk>(this.api('reset-password'), { token, password });
  }

  // === TOKEN/USER STORAGE =====================================================

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  private storeToken(token: string, remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    store.setItem(TOKEN_KEY, token);
  }

  private storeUser(user: SignInRes['user'], remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    store.setItem(USER_KEY, JSON.stringify(user));
  }

  private readUser(): SignInRes['user'] | null {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    this.logoutEvent.next(true);        // <-- избриши го, кога не е потребно
    this.currentUser$.next(null);
    this.isAuthed$.next(false);
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

  // === COMPAT LAYER (задржани потписи за стар код) ============================

  /** @deprecated – користи signIn(); wrapper за старите повици */
  public login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return this.signIn({ email, password }, !!rememberMe).pipe(
      map(res => ({
        id: 0,
        name: `${res.user.firstName ?? ''} ${res.user.lastName ?? ''}`.trim(),
        email: res.user.email,
        password: '',              // никогаш не враќаме password
        role: (res.user.role || 'user').toLowerCase(),
      }))
    );
  }

  /** @deprecated – користи signUp(); го задржуваме само за компилација */
  public register(name: string, email: string, password: string): Observable<User> {
    console.warn('[AuthService.register] Deprecated API used. Please migrate to signUp().');
    return throwError(() => new Error('Deprecated: use signUp() with full payload.'));
  }

  /** Погодно за стар код што чита „тековен корисник“ */
  public getCurrentUser(): SignInRes['user'] | null {
    return this.readUser();
  }

  public getLoggedInUserEmail(): string | null {
    return this.getCurrentUser()?.email ?? null;
  }

  /** Credits helper-и – ги оставаме како што се (ако не се користат, ќе ги тргнеме подоцна) */
  public getCredits(): number {
    const email = this.getLoggedInUserEmail();
    if (!email) return 0;
    const key = `credits_${email}`;
    const stored = sessionStorage.getItem(key);
    return stored ? +stored : 0;
    // NOTE: ако имате бекенд endpoint за кредити, тука заменете со API call.
  }

  public deductCredits(amount: number): void {
    const email = this.getLoggedInUserEmail();
    if (!email) return;
    const key = `credits_${email}`;
    const current = this.getCredits();
    const updated = Math.max(0, current - amount);
    sessionStorage.setItem(key, updated.toString());
  }

  /** @deprecated – стар mock, оставен како no-op за компатибилност */
  public updateUserPassword(_email: string, _newPassword: string) {
    console.warn('[AuthService.updateUserPassword] Deprecated mock used. Use resetPasswordSet().');
    // no-op
  }

  // === СТАР МOCK КОД – КОМЕНТИРАН ЗА РЕФЕРЕНЦА =================================
  /*
  private usersKey  = 'users';
  private loggedInUserKey = 'loggedInUser';
  private resetCodesKey   = 'resetCodes';

  // private getUsers(): User[] { ... }
  // private saveUsers(users: User[]): void { ... }
  // public register(name: string, email: string, password: string): Observable<User> { ... }
  // public login(email: string, password: string, rememberMe: boolean): Observable<User> { ... }
  // public generateResetCode(email: string) { ... }
  // public verifyResetCode(email: string, code: string): boolean { ... }
  // public updateUserPassword(email: string, newPassword: string) { ... }
  // public getCredits(): number { ... }
  // public deductCredits(amount: number): void { ... }
  */
}
