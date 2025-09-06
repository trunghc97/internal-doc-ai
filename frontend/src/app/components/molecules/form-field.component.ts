import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  template: `
    <div class="space-y-2 {{ className }}">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
  standalone: true,
})
export class FormFieldComponent {
  @Input() className = '';
}

@Component({
  selector: 'app-form-label',
  template: `
    <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {{ className }}">
      <ng-content></ng-content>
    </label>
  `,
  styles: [],
  standalone: true,
})
export class FormLabelComponent {
  @Input() className = '';
}

@Component({
  selector: 'app-form-description',
  template: `
    <p class="text-[0.8rem] text-gray-500 {{ className }}">
      <ng-content></ng-content>
    </p>
  `,
  styles: [],
  standalone: true,
})
export class FormDescriptionComponent {
  @Input() className = '';
}

@Component({
  selector: 'app-form-message',
  template: `
    <p class="text-[0.8rem] font-medium text-red-500 {{ className }}">
      <ng-content></ng-content>
    </p>
  `,
  styles: [],
  standalone: true,
})
export class FormMessageComponent {
  @Input() className = '';
}
