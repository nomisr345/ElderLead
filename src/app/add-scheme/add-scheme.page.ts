import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Scheme } from '../services/models/scheme';
import { SchemeService } from '../services/scheme.service';

@Component({
  selector: 'app-add-scheme',
  templateUrl: './add-scheme.page.html',
  styleUrls: ['./add-scheme.page.scss'],
  standalone: false,
})
export class AddSchemePage implements OnInit {

   newScheme: Scheme = new Scheme('', '','', '', '', '', '', '');
   today = new Date().toISOString();
   dateError: boolean = false; 
 
   constructor(private schemeService: SchemeService, private router: Router) {}
   validateDates() {
    if (this.newScheme.startDate && this.newScheme.endDate) {
      const startDate = new Date(this.newScheme.startDate);
      const endDate = new Date(this.newScheme.endDate);
      this.dateError = endDate < startDate;
    }
  }

  async add(schemeForm: any) {
    if (!schemeForm.valid || this.dateError) return;

    try {
      const formattedScheme: Scheme = {
        ...this.newScheme,
        startDate: new Date(this.newScheme.startDate),
        endDate: new Date(this.newScheme.endDate),
        
      };

    console.log("Start Date:", formattedScheme.startDate);
    console.log("End Date:", formattedScheme.endDate);

      await this.schemeService.add(formattedScheme);
      console.log('Scheme added successfully.');
    } catch (error) {
      console.error('Error adding scheme:', error);
    }
    this.router.navigate(['/tabs/admin']);
  }
 
   uploadImage() {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = 'image/*';
     
     input.click();  // Trigger the file picker
 
     input.onchange = (event: any) => {
       const file = event.target.files[0];
       if (file) {
         this.readFile(file);
       }
     };
   }
 
   // Helper method to read the file as a data URL (base64)
   readFile(file: File) {
     const reader = new FileReader();
     reader.onload = () => {
       this.newScheme.imagePath = reader.result as string;  // Save base64 image to the model
     };
     reader.readAsDataURL(file);  // Read the file as a data URL
   }
 
  ngOnInit() {
  }

}
