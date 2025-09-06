import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionsComponent } from './transactions.component';

// Import atoms components
import {
  ButtonComponent,
  BadgeComponent
} from '../../components/atoms';

@NgModule({
  declarations: [
    TransactionsComponent
  ],
  imports: [
    CommonModule,
    // Atoms components
    ButtonComponent,
    BadgeComponent
  ]
})
export class TransactionsModule { }
