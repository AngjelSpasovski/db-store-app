import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Define the User interface
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

@Injectable({providedIn: 'root'})

export class AuthService {
  private usersKey = 'users';                                     // key for sessionStorage
  private loggedInUserKey = 'loggedInUser';                       // key for loggedInUser in sessionStorage
  private resetCodesKey = 'resetCodes';                           // key for resetCodes in sessionStorage
  
  private inactivityTimeout: any;                                 // timeout for inactivity
  private logoutWarningTimeout: any;                              // timeout for logout warning
  public isLoggedIn: any;                                         // is logged in

  private readonly INACTIVITY_TIME = 1800000;                     // 30 minutes in milliseconds
  private readonly WARNING_TIME = 600000;                         // 10 minutes in milliseconds

  public logoutEvent = new BehaviorSubject<boolean>(false);       // BehaviorSubject event emitter for logout
  public showLogoutModal$ = new BehaviorSubject<boolean>(false);  // BehaviorSubject event emitter for logout modal

  // subscription to route events for reset on navigation
  //private routeSub?: Subscription;  // <-- add Subscription if needed

  constructor(private router: Router) {
    this.initializeUsers();

     // On init, check if user already in session or local storage
    const existing = this.getCurrentUser();
    if (existing) {
      this.isLoggedIn = true;
      this.startInactivityTimer();  // start timer if returning user
    }
  }

  ngOnInit(): void {
    this.isLoggedIn = false;
  }

    ngOnDestroy(): void {
      // clean up any subscriptions and event listeners
      clearTimeout(this.inactivityTimeout);
      clearTimeout(this.logoutWarningTimeout);
      window.removeEventListener('mousemove', this.resetInactivityTimer.bind(this));
      window.removeEventListener('keydown', this.resetInactivityTimer.bind(this));
      this.logoutEvent.complete();
      this.showLogoutModal$.complete();
      //this.routeSub?.unsubscribe();
    }

  // initialize users in sessionStorage
  private initializeUsers(): void {
    if (!sessionStorage.getItem(this.usersKey)) {
      const defaultUsers: User[] = [
        { id: 1, name: 'Admin Admin', email: 'admin@admin.com',         password: 'admin123',     role: 'admin' },
        { id: 2, name: 'John Doe',    email: 'john.doe@example.com',    password: 'Password123!', role: 'user' },
        { id: 3, name: 'Jane Smith',  email: 'jane.smith@example.com',  password: 'Secret456!',   role: 'user' },
        { id: 3, name: 'eee',         email: 'eee@eee.com',             password: 'eeeeeeee',     role: 'user' },
      ];
      const stored = sessionStorage.getItem(this.usersKey);
      if (!stored) {
        // nothing there → seed
        sessionStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
      } else {
        // if it’s there but empty array → re-seed
        try {
          const arr = JSON.parse(stored) as User[];
          if (!arr || arr.length === 0) {
            sessionStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
          }
        } catch {
          // parse error → overwrite
          sessionStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
        }
      }
    }
  }

  /**
   * 
   * @returns 
   * Returns the logged-in user's email address or null if not logged in.
   * 
   * @description 
   * This method retrieves the logged-in user's email address from sessionStorage.
   * If the user is not logged in, it returns null.
   * 
   */
  // get users from sessionStorage
  private getUsers(): User[] {
    return JSON.parse(sessionStorage.getItem(this.usersKey) || '[]');
  }


  /**
   * 
   * @returns 
   * Returns the logged-in user's email address or null if not logged in.
   * 
   * @description
   * This method retrieves the logged-in user's email address from sessionStorage.
   * If the user is not logged in, it returns null.
   */
  // get current user from sessionStorage
  public getCurrentUser(): User | null {
    const sessionUser = sessionStorage.getItem(this.loggedInUserKey);   // get user from session storage
    const localUser   = localStorage.getItem(this.loggedInUserKey);     // get user from local storage

    // return user
    return sessionUser ? JSON.parse(sessionUser) : localUser ? JSON.parse(localUser) : null;
  }

  public getLoggedInUserEmail(): string | null {
    const user = this.getCurrentUser();                             // get current user
    return user ? user.email : null;                                // return email if user exists
  }

  // save users to sessionStorage
  private saveUsers(users: User[]): void {
    sessionStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // register method
  public register(name: string, email: string, password: string): Observable<User> {
    return of(this.getUsers()).pipe(
      delay(1000),
      map(users => {
        // check if email already in use
        if (users.some(u => u.email === email)) {
          throw new Error('Email already in use');
        }

        // create new user
        const newUser: User = {
          id: users.length + 1,
          name,
          email,
          password,
          role: 'user'
        };

        users.push(newUser);    // add new user to users array
        this.saveUsers(users);  // save users to session storage

        return newUser;
      })
    );
  }

  // login method
  public login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return of(this.getUsers()).pipe(
      delay(1000),
      tap(() => console.log('Attempting login for:', email)),
      map(users => {
        const user = users.find(u => u.email === email && u.password === password);
        
        // user found
        if (user) {
          const storage = rememberMe ? localStorage : sessionStorage;         // check if rememberMe is true or false
          storage.setItem(this.loggedInUserKey, JSON.stringify(user));       // save logged in user to local or session storage
          
          this.isLoggedIn = true;                                             // set isLoggedIn to true

          console.log('✅ User logged in:', user.email);
          console.log('isLoggedIn:', this.isLoggedIn);
          
          this.startInactivityTimer();                                        // start inactivity timer

          return user;
        } 
        else {
          throw new Error('Invalid email or password');
        }
      })
    );
  }

  // logout method
  public logout(): void {
    console.log('🚪 Logging out user due to inactivity...');

    sessionStorage.removeItem(this.loggedInUserKey);  // remove user from sessionStorage
    localStorage.removeItem(this.loggedInUserKey);    // remove user from localStorage

    this.logoutEvent.next(true);                      // emit logout event
    this.isLoggedIn = false;                           // set isLoggedIn to false

    clearTimeout(this.inactivityTimeout);             // clear inactivity timeout
    clearTimeout(this.logoutWarningTimeout);          // clear logout warning timeout

    window.removeEventListener('mousemove', this.resetInactivityTimer); // remove event listeners
    window.removeEventListener('keydown',   this.resetInactivityTimer); // remove event listeners

    this.router.navigate(['/login'], { queryParams: { tab: 'login' } }); // navigate to login page
    console.log('🔄 User logged out and redirected to login page.');
  }

  // strt inactivity timer
  public startInactivityTimer(): void {
    if (!this.isLoggedIn) return;
    setTimeout(() => {
      if (this.router.url === '/login') return; // avoid starting on login page
      this.resetInactivityTimer();
      window.addEventListener('mousemove', this.resetInactivityTimer.bind(this)); // 📌 add listener
      window.addEventListener('keydown', this.resetInactivityTimer.bind(this)); // 📌 add listener
    }, 100);
  }

  // reset inactivity timer
  public resetInactivityTimer(): void {
    if (!this.isLoggedIn) return;
    clearTimeout(this.inactivityTimeout);
    clearTimeout(this.logoutWarningTimeout);
    this.logoutWarningTimeout = setTimeout(() => this.showLogoutWarning(), this.INACTIVITY_TIME - this.WARNING_TIME); // 📌 show warning first
    this.inactivityTimeout = setTimeout(() => this.logout(), this.INACTIVITY_TIME); // 📌 auto logout
  }

  // show logout warning - changes: customizable modal
  public showLogoutWarning(): void {
    //this.showLogoutModal$.next(true); // 📌 trigger modal
  }

  // utility: check if email exists
  public checkUserExists(email: string): boolean {
    return this.getUsers().some(user => user.email === email);
  }

  // Generate a reset code for a given email
  public generateResetCode(email: string) {
    const users = this.getUsers();                    // get users from sessionStorage
    const user = users.find(u => u.email === email);  // find user by email

    if (user) {
      // generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      sessionStorage.setItem('resetCode_' + email, resetCode);        // store reset code in sessionStorage
      console.log(`Generated reset code for ${email}: ${resetCode}`); // log reset code
      alert(`${email}: ${resetCode}`);
    }
  }

  // Verify the reset code
  public verifyResetCode(email: string, code: string): boolean {
    // get stored reset code
    const storedCode = sessionStorage.getItem('resetCode_' + email);

    // return true if stored code matches the code entered by the user
    return storedCode === code;
  }

  // Update user password
  public updateUserPassword(email: string, newPassword: string) {
    const users = this.getUsers();                              // вчитува ја низата од 'users'
    const userIndex = users.findIndex(u => u.email === email);  // наоѓа го корисникот по е-мејл

    console.log('>>> AuthService.updateUserPassword: looking for', email, 'found index:', userIndex);

    // update password if user exists
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;          // сетира нова лозинка
      this.saveUsers(users);                            // повторно ја чува целата низа во sessionStorage

      console.log(`>>> AuthService.updateUserPassword: password now set to "${newPassword}" for`, users[userIndex]);
      console.log(`Password updated for ${email}`);     // debug лог

      sessionStorage.removeItem('resetCode_' + email);  // (мена) се брише reset кодот
    }
    else {
      console.warn('>>> AuthService.updateUserPassword: could not find user with email', email);
    }
  }

  /**
  * Returns the current user’s stored credit balance (default 0)
  */
  public getCredits(): number {
    const user = this.getCurrentUser();
    if (!user) return 0;
    const key = `credits_${user.email}`;
    const stored = sessionStorage.getItem(key);
    return stored ? +stored : 0;
  }

  public deductCredits(amount: number): void {
    const user = this.getCurrentUser();
    if (!user) return;
    const key = `credits_${user.email}`;
    const current = this.getCredits();
    const updated = Math.max(0, current - amount);
    sessionStorage.setItem(key, updated.toString());
  }

}
