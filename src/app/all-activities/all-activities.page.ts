import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common'; // ✅ Import CommonModule

@Component({
  selector: 'app-all-activities',
  templateUrl: './all-activities.page.html',
  styleUrls: ['./all-activities.page.scss'],
  standalone: false, 
})
export class AllActivitiesPage implements OnInit {
  searchQuery: string = '';

  activities: { name: string; date: string; image: string }[] = [
    { name: 'Morning Tai Chi Session', date: '18TH FEB • TUESDAY • 8:00 AM', image: 'assets/taichi.jpeg' },
    { name: 'Community Tea Session', date: '18TH FEB • TUESDAY • 10:00 AM', image: 'assets/tea-session.webp' },
    { name: 'Smartphone Workshop', date: '19TH FEB • WEDNESDAY • 10:00 AM', image: 'assets/smartphone.jpg' },
    { name: 'Craft & Chat', date: '19TH FEB • WEDNESDAY • 4:30 PM', image: 'assets/craft.webp' },
    { name: 'Evening Exercise', date: '21ST FEB • FRIDAY • 5:00 PM', image: 'assets/exercise.png' },
    { name: 'Karaoke Night', date: '21ST FEB • FRIDAY • 7:00 PM', image: 'assets/karaoke.jpeg' }
  ];

  // ✅ Initialize with the correct type
  filteredActivities: { name: string; date: string; image: string }[] = [];

  constructor(private navController: NavController, private router: Router) {}

  ngOnInit() {
    this.filteredActivities = [...this.activities]; // ✅ Correctly assigns the array
  }

  goBack() {
    this.navController.back();
  }

  goToEventDetails() {
    this.router.navigate(['/event-details']);
  }

  filterActivities(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    
    if (!query.trim()) {
      this.filteredActivities = [...this.activities];
      return;
    }

    this.filteredActivities = this.activities.filter(activity =>
      activity.name.toLowerCase().includes(query)
    );
  }
}
