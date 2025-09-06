import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  private units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  transform(bytes: number = 0, precision: number = 2): string {
    if (bytes === 0) return '0 B';

    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, exp);
    const shortSize = size.toFixed(precision);
    const unit = this.units[exp];

    // Loại bỏ số 0 thừa sau dấu thập phân
    return `${parseFloat(shortSize)} ${unit}`;
  }
}
