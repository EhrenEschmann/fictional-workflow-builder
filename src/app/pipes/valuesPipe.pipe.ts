import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'values' })
export class ValuesPipe implements PipeTransform {

  transform(dictionary: Object): Array<any> {
    const a = [];
    for (const key in dictionary) {
      if (dictionary.hasOwnProperty(key)) {
        a.push({key: key, value: dictionary[key]});
      }
    }
    return a;
  }

    // transform(value: any, args: any[] = null): any {
    //     return Object.keys(value).map(key => value[key]);
    // }
    // transform(value: any, args?: any[]): Object[] {
    //     let keyArr: any[] = Object.keys(value);
    //     let dataArr: Array<any> = [];
    //     let keyName = args[0];

    //     keyArr.forEach((key: any) => {
    //         value[key][keyName] = key;
    //         dataArr.push(value[key])
    //     });

    //     if (args[1]) {
    //         dataArr.sort((a: Object, b: Object): number => {
    //             return a[keyName] > b[keyName] ? 1 : -1;
    //         });
    //     }

    //     return dataArr;
    // }
}