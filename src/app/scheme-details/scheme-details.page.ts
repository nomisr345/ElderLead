import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SchemeService } from '../services/scheme.service';
import { Scheme } from '../services/models/scheme';

@Component({
  selector: 'app-scheme-details',
  templateUrl: './scheme-details.page.html',
  styleUrls: ['./scheme-details.page.scss'],
  standalone: false,
})
export class SchemeDetailsPage implements OnInit {
  scheme: Scheme | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schemeService: SchemeService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.schemeService.getSchemeById(id).subscribe({
        next: (data) => {
          this.scheme = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching scheme:', err);
          this.isLoading = false;
        },
      });
    }
  }

  goBack() {
    this.router.navigate(['/']); // Navigate back to the main page
  }

  applyNow() {
    window.open('https://go.gov.sg/ptv', '_blank'); // Replace with actual application link
  }
}
