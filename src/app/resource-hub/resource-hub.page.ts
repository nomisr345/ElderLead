import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-resource-hub',
  templateUrl: './resource-hub.page.html',
  styleUrls: ['./resource-hub.page.scss'],
  standalone: false,
})
export class ResourceHubPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

}
