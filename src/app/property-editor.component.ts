import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Property } from './models/domain/property';

@Component({
    selector: 'fwb-property-editor',
    templateUrl: './app/property-editor.component.html'
})
export class PropertyEditorComponent {
    @Input() key: string; 
    @Input() property: Property;
    @Output() valueChanged: EventEmitter<string>;

    private updatedValue: Subject<string>;

    constructor() {
        this.updatedValue = new Subject<string>();
        this.valueChanged = new EventEmitter<string>();
        this.updatedValue
            .debounceTime(700)
            .distinctUntilChanged()
            .subscribe((value: string) => this.valueChanged.emit(value));
    }

    onUpdate = (value: string): void => {
        console.log(`current value = '${value}' now need to broadcast`);
        this.updatedValue.next(value);
    }
}