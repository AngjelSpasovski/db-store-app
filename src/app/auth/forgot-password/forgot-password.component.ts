import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; 
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule,
    FontAwesomeModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent  implements OnInit {
  
  faArrowLeft = faArrowLeft;              // font awesome icons

  public email: string = '';              // email
  public resetCode: string = '';          // reset code
  public newPassword: string = '';        // new password

  public codeSent: boolean = false;       // code sent
  public codeVerified: boolean = false;   // code verified
  public errorMessage: string = '';       // error message

  public isLoading: boolean = false;      // is loading

  constructor(private authService: AuthService, private router: Router, private translate: TranslateService) { 
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {}

  // Send Reset Code
  public sendResetCode() {
    if (this.authService.checkUserExists(this.email)) {
      
      this.isLoading = true;  // set isLoading to true
      
      setTimeout(() => {

        this.authService.generateResetCode(this.email);   // Generate reset code
        sessionStorage.setItem('resetEmail', this.email); // Store email temporarily

        this.codeSent = true;     // set codeSent to true
        this.errorMessage = '';   // clear error message 
        this.isLoading = false;   // set isLoading to false

      }, 1000); // Simulate email sending
    } 
    else {
      this.errorMessage = this.translate.instant('EMAIL_NOT_FOUND'); // set error message
    }
  }

  // Verify Reset Code
  public verifyCode() {
    // check if reset code is stored in session
    const storedEmail = sessionStorage.getItem('resetEmail');

    // check if stored email exists
    if (!storedEmail) {
      this.errorMessage = this.translate.instant('INVALID_RESET_CODE'); // set error message
      this.codeSent = false;
      return;
    }

    //  verify reset code
    if (this.authService.verifyResetCode(storedEmail, this.resetCode)) {
      this.codeVerified = true;   // set codeVerified to true
      this.resetCode = '';        // clear reset code
      this.errorMessage = '';     // clear error message
    } 
    else {
      this.errorMessage = this.translate.instant('INVALID_RESET_CODE'); // set error message
    }
  }

  // Reset Password
  public resetPassword() {
    // check if reset code is stored in session
    const storedEmail = sessionStorage.getItem('resetEmail');

    // check if stored email exists
    if (!storedEmail) {
      this.errorMessage = this.translate.instant('INVALID_RESET_CODE'); // set error message
      this.codeSent = false;
      return;
    }

    // check if new password is at least 6 characters
    if (this.newPassword.length < 6) {
      this.errorMessage = this.translate.instant('PASSWORD_MINLENGTH'); // set error message
      return;
    }

    // Before updating
    console.log('>>> Before updateUserPassword:', JSON.parse(sessionStorage.getItem('users') || '[]'));
    // update user password
    this.authService.updateUserPassword(storedEmail, this.newPassword);
    // After updating
    console.log('>>> After updateUserPassword: ', JSON.parse(sessionStorage.getItem('users') || '[]'));

    sessionStorage.removeItem('resetEmail'); // Clear session storage

    alert(this.translate.instant('PASSWORD_UPDATED')); // show alert
    console.log('Password successfully reset!');

    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

  // Go back to Login Page
  public goBackToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

  // Dynamic Headings
  public getHeading(): string {
    if (!this.codeSent) return this.translate.instant('FORGOT_PASSWORD_TITLE');
    if (this.codeSent && !this.codeVerified) return this.translate.instant('ENTER_CODE');
    return this.translate.instant('RESET_PASSWORD');
  }

  // Dynamic Descriptions
  public getDescription(): string {
    if (!this.codeSent) return this.translate.instant('FORGOT_PASSWORD_INFO');
    if (this.codeSent && !this.codeVerified) return this.translate.instant('ENTER_CODE_INFO');
    return this.translate.instant('RESET_PASSWORD_INFO');
  }

}
