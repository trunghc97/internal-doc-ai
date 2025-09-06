import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { RegisterComponent } from './register.component';

// Import atoms components
import {
  ButtonComponent,
  InputComponent
} from '../../components/atoms';

@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // Atoms components
    ButtonComponent,
    InputComponent
  ]
})
export class RegisterModule { }
