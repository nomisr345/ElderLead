import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Scheme } from '../services/models/scheme';
import { SchemeService } from '../services/scheme.service';
import { NewsService } from '../services/news.service';
import Swiper from 'swiper'; // Import Swiper class

@Component({
  selector: 'app-resource-hub',
  templateUrl: './resource-hub.page.html',
  styleUrls: ['./resource-hub.page.scss'],
  standalone: false,
})
export class ResourceHubPage implements OnInit {
  newsArticles: any[] = [];
  schemes: Scheme[] = [];  // Array to hold scheme data
  swiper: Swiper | null = null;

  // Slider options for the news feed
  ngAfterViewInit() {
    this.swiper = new Swiper('.swiper-container', {
      slidesPerView: 1.2,
      spaceBetween: 10,
      navigation: true,
      pagination: true,
    });
  }

  constructor(private schemeService: SchemeService, private navCtrl: NavController, private newsService: NewsService) {}

  ngOnInit() {
    this.loadSchemes(); // Load the schemes when the page initializes
    this.loadElderlyNews();
  }

  loadSchemes() {
    this.schemeService.getSchemes().subscribe(
      (schemes: Scheme[]) => {
        this.schemes = schemes; // Assign fetched schemes to the local variable
      },
      (error) => {
        console.error('Error fetching schemes:', error);
      }
    );
  }

  loadElderlyNews() {
    this.newsService.getElderlyNews().subscribe(
      (response) => {
        if (response && response.articles) {
          this.newsArticles = response.articles;
        }
      },
      (error) => {
        console.error('Error fetching news', error);
        // Handle error (e.g., show a friendly message)
      }
    );
  }
  
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  goBack() {
    this.navCtrl.back();
  }

  supportServices = [
    {
      name: 'CareLine',
      description: 'Changi General Hospital',
      phone: '6340 7054',
      logo: 'assets/careline.png',
      link: 'https://www.cgh.com.sg/careline'
    },
    {
      name: 'Agency for Integrated Care',
      description: '',
      phone: '1800 650 6060',
      logo: 'assets/aic.png',
      link: 'https://www.aic.sg/'
    },
    {
      name: 'Dementia Singapore',
      description: '',
      phone: '6377 0700',
      logo: 'assets/dementia.jpg',
      link: 'https://www.dementia.org.sg/'
    },
    {
      name: 'The Seniors Hotline',
      description: 'SAGE Counselling Centre',
      phone: '6377 0700',
      logo: 'assets/sage.jpeg',
      link: 'https://www.sagecc.org.sg/'
    }
  ];
  
}