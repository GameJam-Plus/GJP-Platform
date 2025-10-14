import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from '../messages/messages.component';
import { environment } from '../../environments/environment.prod';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MessagesComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit{
  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) { }

  successMessage: string = '';
  errorMessage: string = '';
  email: string = '';

  @ViewChild(MessagesComponent) message!: MessagesComponent;

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.route.params.subscribe(params => {
        if (params['error']) {
          console.log(params['error']);
          this.message.showMessage(
            "Error",
            "Login link has expired, please login again",
            () => {
              this.router.navigate(['/login']);
            }
          );
        }
      });
    }, 100);

  }

  sendEmail(): void {
    console.log(this.email);
    if(this.email?.toLowerCase())
    {
      this.userService.loginUser(this.email).subscribe({
        next: (data) =>{
          this.message.showMessage(
            "Success",
            `Login link sent to: ${data.email}`,
            () => {}
          );
        },
        error: (error) => {
          console.log(error);
          this.message.showMessage(
            "Error",
            "An error has ocurred processing your request, please refresh the page and try again.<br>If the error persists, send an email to support@"
          );
        }
      });
    }
  }

  closePopup(): void {
    this.successMessage = '';
  }

  openErrorModal()
  {

  }

  redirectToRegister(): void {
    this.router.navigate(['/register']);
  }
}
