import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ActivitiesPage {
  searchQuery: string = ''; // Store the search input
  events = [
    { name: 'Taichi Sessions', location: '93 Toa Payoh Central', date: '18 FEB', image: 'assets/taichi.jpeg' },
    { name: 'Community Tea Session', location: 'Community Hall', date: '18 FEB', image: 'assets/tea-session.webp' },
    { name: 'Smartphone Workshop', location: 'Tech Center', date: '19 FEB', image: 'assets/smartphone.jpg' },
    { name: 'Craft & Chat', location: 'Art Studio', date: '19 FEB', image: 'assets/craft.webp' },
    { name: 'Evening Exercise', location: 'Park Pavilion', date: '21 FEB', image: 'assets/exercise.png' },
    { name: 'Karaoke Night', location: 'Community Center', date: '21 FEB', image: 'assets/karaoke.jpeg' },
    { name: 'Health Talks', location: '5 Bishan Place', date: '21 FEB', image: 'assets/health-talk.jpeg' }
  ];
  filteredEvents = [...this.events]; // Copy for filtering

  constructor(private router: Router) {}

  navigateToAllActivities() {
    this.router.navigate(['/all-activities']);
  }

  filterEvents(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredEvents = this.events.filter(e =>
      e.name.toLowerCase().includes(query) || e.location.toLowerCase().includes(query)
    );
  }
}
