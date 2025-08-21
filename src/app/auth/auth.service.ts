import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from './auth.environment';

/** === API types === */
export type AuthRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  companyName: string;
  role:        AuthRole;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface SignInReq { email: string; password: string; }
export interface SignInRes { accessToken: string; user: AuthUser; }

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
    email:          string;
    company:        string;
    address1:       string;
    address2?:      string;
    buildingNumber?:string;
    zipCode:        string;
    city:           string;
    stateCode:      string;
    nation:         string;
    vatNumber:      string;
  };
}

/** === storage keys === */
const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.baseApiUrl?.replace(/\/+$/, '') ?? '/api';

  /** Emits the current user (or null) */
  public currentUser$ = new BehaviorSubject<AuthUser | null>(this.readUser());
  /** Emits whether we have a token present */
  public isAuthed$    = new BehaviorSubject<boolean>(!!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)));

  constructor(private router: Router, private http: HttpClient) {}

  /** Convenience getter for token */
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  /** === API calls === */
  signIn(body: SignInReq, remember = false): Observable<SignInRes> {
    return this.http.post<SignInRes>(`${this.base}/auth/sign-in`, body).pipe(
      tap(res => {
        this.storeToken(res.accessToken, remember);
        this.storeUser(res.user, remember);
        this.currentUser$.next(res.user);
        this.isAuthed$.next(true);
      })
    );
  }

  signUp(body: SignUpReq) {
    return this.http.post<{ status: true }>(`${this.base}/auth/sign-up`, body);
  }

  confirmEmailSend(email: string) {
    return this.http.post<{ status: boolean }>(`${this.base}/auth/confirm-email/send`, { email });
  }

  confirmEmail(token: string) {
    return this.http.post<{ status: boolean }>(`${this.base}/auth/confirm-email`, { token });
  }

  /** Reset password API group */
  resetPasswordSend(email: string) {
    return this.http.post(this.api('reset-password/send'), { email });
  }
  resetPasswordVerify(token: string) {
    return this.http.post<{ status: true }>(this.api('reset-password/verify'), { token });
  }
  resetPasswordSet(token: string, password: string) {
    return this.http.post<{ status: true }>(this.api('reset-password'), { token, password });
  }

  /** === session helpers === */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    this.currentUser$.next(null);
    this.isAuthed$.next(false);

    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

  /** Returns the current user object (or null) */
  getCurrentUser(): AuthUser | null {
    return this.readUser();
  }

  /** Returns current email if logged in */
  getLoggedInUserEmail(): string | null {
    return this.readUser()?.email ?? null;
  }

  /** Credits helpers (kept as-is) */
  getCredits(): number {
    const user = this.readUser();
    if (!user) return 0;
    const key = `credits_${user.email}`;
    const stored = sessionStorage.getItem(key);
    return stored ? +stored : 0;
    }
  deductCredits(amount: number): void {
    const user = this.readUser();
    if (!user) return;
    const key = `credits_${user.email}`;
    const updated = Math.max(0, this.getCredits() - amount);
    sessionStorage.setItem(key, updated.toString());
  }

  /** === internals === */
  private api(path: string) {
    const base = environment.baseApiUrl ?? '/api';
    return `${String(base).replace(/\/+$/, '')}/auth/${path}`;
  }

  private storeToken(token: string, remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    store.setItem(TOKEN_KEY, token);
  }

  private storeUser(user: AuthUser, remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    store.setItem(USER_KEY, JSON.stringify(user));
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    try { return raw ? (JSON.parse(raw) as AuthUser) : null; } catch { return null; }
  }

  /* =======================
   * LEGACY (deprecated) MOCK CODE — keep commented until UI миграцијата е завршена
   * =======================
   *
   * interface User { id:number; name:string; email:string; password:string; role:string; }
   * private usersKey = 'users';
   *
   * private getUsers(): User[] { ... }
   * private saveUsers(users: User[]): void { ... }
   * register(name: string, email: string, password: string) { ... }
   * login(email: string, password: string, rememberMe: boolean) { ... }
   * generateResetCode(email: string) { ... }
   * verifyResetCode(email: string, code: string) { ... }
   * updateUserPassword(email: string, newPassword: string) { ... }
   */
}
