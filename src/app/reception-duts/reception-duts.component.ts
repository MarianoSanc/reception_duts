import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api/api.service';
import { UrlClass } from '../shared/models/url.model';
import { forkJoin, Observable } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import Swal from 'sweetalert2';
import { platformBrowser } from '@angular/platform-browser';

@Component({
  selector: 'app-reception-duts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    NgMultiSelectDropDownModule,
  ],
  templateUrl: './reception-duts.component.html',
  styleUrl: './reception-duts.component.css',
})
export class ReceptionDutsComponent {
  selectedItems: any[] = [];
  dropdownSettings: any = {
    singleSelection: true,
    idField: 'id',
    textField: 'name',
    allowSearchFilter: true,
  };

  componentId: any = undefined;
  componentName: any = '';
  componentManufacturer: any = '';
  componentModel: any = '';
  componentNoSerial: any = '';
  componentAccessories: any = '';
  componentComments: any = '';

  accessGranted: any = false;

  duts: any[] = [];

  ph_pc: any[] = [];
  client_name: any = '';
  id_ph_pc: any;
  usuario_creador: string = '';
  quotation: any = '';

  constructor(private backend: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.usuario_creador = params['id'];
      //setTimeout(()=>this.checkAuth(),1000);
    });

    const info_ensayos = {
      action: 'get',
      bd: 'hvtest2',
      table: 'opportunity',
      opts: {
        customSelect: 'opportunity.*,account.name as client_name',
        customRelationship:
          'left join account on account.id = opportunity.account_id ',
      },
    };

    const info_calibraciones = {
      action: 'get',
      bd: 'hvtest2',
      table: 'opportunity_calpro',
      opts: {
        customSelect: 'opportunity_calpro.*,account.name as client_name',
        customRelationship:
          'left join account on account.id = opportunity_calpro.account_id ',
      },
    };

    this.backend
      .post(info_ensayos, UrlClass.URLNuevo)
      .subscribe((response: any) => {
        this.ph_pc = response['result'];

        this.backend
          .post(info_calibraciones, UrlClass.URLNuevo)
          .subscribe((response: any) => {
            this.ph_pc = [...this.ph_pc, ...response['result']];
          });
      });
  }

  onProjectSelect(project: any) {
    let selected = this.ph_pc.find((element: any) => element.id == project.id);

    this.client_name = selected.client_name;
    this.id_ph_pc = selected.id;

    this.loadDuts();
  }

  onProjectDeSelect(project: any) {
    this.client_name = '';
    this.id_ph_pc = undefined;
    this.quotation = '';
    this.duts = [];
  }

  addDUT() {
    let date = new Date();
    let month = date.getMonth() + 1;

    let dataDut = {
      bd: 'factibilidad',
      action: 'create',
      table: 'reception_duts',
      opts: {
        attributes: {
          id_proyect: this.id_ph_pc,
          quotation: this.quotation,
          name: this.componentName,
          manufacturer: this.componentManufacturer,
          model: this.componentModel,
          serial_number: this.componentNoSerial,
          accessories: this.componentAccessories,
          comments: this.componentComments,
          created_at:
            date.getFullYear() +
            '-' +
            month +
            '-' +
            date.getDate() +
            ' ' +
            date.getHours() +
            ':' +
            date.getMinutes() +
            ':' +
            date.getSeconds(),
          created_by_id: this.usuario_creador,
        },
      },
    };

    Swal.fire({
      showConfirmButton: false,
      title: 'Cargando datos',
      text: 'Espera un momento',
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    this.backend.post(dataDut, UrlClass.URLNuevo).subscribe((response: any) => {
      if (response.result) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Tu registro se realizo',
          showConfirmButton: false,
          timer: 1500,
        });
        this.componentNoSerial = '';
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'No se realizo el registro',
        });
      }
      this.loadDuts();
    });
  }

  checkAuth() {
    if (this.usuario_creador == undefined) this.auth();
    let finishadmin = false;
    let finishalmacen = false;
    let authAdmin = {
      bd: 'hvtest2',
      action: 'count',
      table: 'user',
      opts: {
        where: {
          id: this.usuario_creador,
          is_admin: 1,
          is_active: 1,
        },
      },
    };
    let authAlmacen = {
      bd: 'hvtest2',
      action: 'count',
      table: 'user',
      opts: {
        relationship: {
          team_user: ['team_user.user_id', 'user.id'],
        },
        whereRelationship: {
          'user.id': this.usuario_creador,
          'user.is_active': 1,
          'team_user.team_id': '63cf1a6f5e33405c9',
        },
      },
    };
    this.backend
      .post(authAdmin, UrlClass.URLNuevo)
      .subscribe((response: any) => {
        try {
          if (response.result[0].count > 0) this.accessGranted = true;
        } catch {}
        finishadmin = true;
        if (finishadmin && finishalmacen) this.auth();
      });
    this.backend
      .post(authAlmacen, UrlClass.URLNuevo)
      .subscribe((response: any) => {
        try {
          if (response.result[0].count > 0) this.accessGranted = true;
        } catch {}
        finishalmacen = true;
        if (finishadmin && finishalmacen) this.auth();
      });
  }

  auth() {
    if (!this.accessGranted) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes acceso a este modulo',
      });
      setTimeout(
        () => location.replace('http://192.168.1.200:81/menu-sagep'),
        3000
      );
    }
  }

  loadDuts() {
    let duts = {
      bd: 'factibilidad',
      action: 'get',
      table: 'reception_duts',
      opts: {
        where: {
          id_proyect: this.id_ph_pc,
        },
      },
    };
    this.backend.post(duts, UrlClass.URLNuevo).subscribe((response: any) => {
      let aux = response.result;
      for (let i = 0; i < aux.length; i++) {
        aux.class = 'none';
      }
      this.duts = aux;
      this.quotation = this.duts[0].quotation;
      this.comparison();
    });
  }

  comparison() {
    let duts = {
      bd: 'orden',
      action: 'get',
      table: 'dut_service',
      opts: {
        relationship: {
          service: ['service.id', 'dut_service.id_service'],
        },
        whereRelationship: {
          'service.id_project': this.id_ph_pc,
        },
      },
    };
    let dutsOld = {
      bd: 'orden',
      action: 'get',
      table: 'dut_service',
      opts: {
        customRelationship:
          'inner join service on service.id = dut_service.id_service',
        whereRelationship: {
          'service.id_project': this.id_ph_pc,
          'service.deleted': 1,
        },
      },
    };
    forkJoin({
      duts: this.backend.post(duts, UrlClass.URLNuevo),
      dutsOld: this.backend.post(dutsOld, UrlClass.URLNuevo),
    }).subscribe({
      next: (data: any) => {
        let aux = [];
        for (let i = 0; i < this.duts.length; i++) {
          let find = data.duts['result'].find(
            (element: any) =>
              element.serial_number == this.duts[i].serial_number
          );
          aux.push(this.duts[i]);
          if (find == undefined) {
            aux[i].class = 'danger';
            find = data.dutsOld['result'].find(
              (element: any) =>
                element.serial_number == this.duts[i].serial_number
            );
            if (find != undefined) {
              aux[i].class = 'success';
            }
          }
        }
        this.duts = aux.filter((el: any) => el.class != 'success');
      },
    });
  }

  selectDUT(dut: any) {
    this.componentId = dut.id;
    this.componentName = dut.name;
    this.componentManufacturer = dut.manufacturer;
    this.componentModel = dut.model;
    this.componentNoSerial = dut.serial_number;
    this.componentAccessories = dut.accessories;
    this.componentComments = dut.comments;
  }

  editDUT() {
    if (this.componentId == undefined) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al modificar DUT',
      });
      return;
    }
    let date = new Date();
    let month = date.getMonth() + 1;
    let dataDut = {
      bd: 'factibilidad',
      action: 'update',
      table: 'reception_duts',
      opts: {
        attributes: {
          quotation: this.quotation,
          name: this.componentName,
          manufacturer: this.componentManufacturer,
          model: this.componentModel,
          serial_number: this.componentNoSerial,
          accessories: this.componentAccessories,
          comments: this.componentComments,
          modified_at:
            date.getFullYear() +
            '-' +
            month +
            '-' +
            date.getDate() +
            ' ' +
            date.getHours() +
            ':' +
            date.getMinutes() +
            ':' +
            date.getSeconds(),
          modified_by_id: this.usuario_creador,
        },
        where: {
          id: this.componentId,
        },
      },
    };

    Swal.fire({
      showConfirmButton: false,
      title: 'Cargando datos',
      text: 'Espera un momento',
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    this.backend.post(dataDut, UrlClass.URLNuevo).subscribe((response: any) => {
      if (response.result) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Tu registro se realizo',
          showConfirmButton: false,
          timer: 1500,
        });
        this.componentNoSerial = '';
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'No se realizo el registro',
        });
      }
      this.loadDuts();
    });
  }

  generate() {
    if (this.id_ph_pc == undefined) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al generar pdf',
      });
      return;
    }
    let update = {
      bd: 'factibilidad',
      action: 'update',
      table: 'reception_duts',
      opts: {
        attributes: {
          quotation: this.quotation,
        },
        where: {
          id_proyect: this.id_ph_pc,
        },
      },
    };
    Swal.fire({
      showConfirmButton: false,
      title: 'Generando pdf',
      text: 'Espera un momento',
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.backend.post(update, UrlClass.URLNuevo).subscribe((result: any) => {
      if (result.result) {
        let data = { ph: this.id_ph_pc };

        this.backend.generate(data, UrlClass.URL).subscribe((response: any) => {
          if (response.file) {
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Pdf generado',
              showConfirmButton: false,
              timer: 1500,
            });
            const link: any = document.createElement('a');
            link.href = UrlClass.URL + response.file;
            link.download = response.file;
            link.click();
            link.remove();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'No se genero pdf',
            });
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'No se genero pdf',
        });
      }
    });
  }
}
