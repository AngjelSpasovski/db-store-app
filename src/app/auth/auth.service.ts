// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from './auth.environment';

/** === API types === */
export type AuthRole = 'user' | 'adminUser' | 'superadmin';

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

  private normalizeRole(role: string | undefined, email?: string): AuthRole {
    const r = (role || 'user').toLowerCase();

    // whitelist по е-мејл → секогаш superadmin
    if ((email || '').toLowerCase() === 'angjel.spasovski@gmail.com') return 'superadmin';

    // map backend варијанти кон нашата шема
    if (r === 'admin_user' || r === 'adminuser' || r === 'admin') return 'adminUser';
    if (r === 'superadmin') return 'superadmin';
    return 'user';
  }

  /** === API calls === */
  signIn(body: SignInReq, remember = false): Observable<SignInRes> {
    return this.http.post<SignInRes>(`${this.base}/auth/sign-in`, body).pipe(
      tap(res => {
        const userNorm = { ...res.user, role: this.normalizeRole(res.user.role, res.user.email) };
        this.storeToken(res.accessToken, remember);
        this.storeUser(userNorm, remember);
        this.currentUser$.next(userNorm);
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
    const u = this.readUser();
    if (!u) return null;

    const norm = { ...u, role: this.normalizeRole(u.role, u.email) };
    if (norm.role !== u.role) this.storeUser(norm, !!localStorage.getItem('auth_token')); // resave

    console.log('getCurrentUser', norm);
    return norm;
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

    console.log('deductCredits', key, updated);
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
}
