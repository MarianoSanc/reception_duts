import { Routes } from '@angular/router';
import { ReceptionDutsComponent } from './reception-duts/reception-duts.component';

export const routes: Routes = [
    { path: 'reception', component: ReceptionDutsComponent },
    { path: '**', redirectTo: '/reception', pathMatch: 'full' },
];
