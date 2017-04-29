import { Observable } from 'rxjs';
import { Component } from '@angular/core';

@Component({
    selector: 'fwb-command-simulator',
    templateUrl: './app/command-simulator.component.html'
})
export class CommandSimulatorComponent {


    constructor() {

    }

    ngOnInit() {
        var subscription = Observable.interval(5000).subscribe(res => {

        });
        subscription.unsubscribe();
    }

}