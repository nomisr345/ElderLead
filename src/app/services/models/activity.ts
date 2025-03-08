export class Activity {
    title: string;
    description: string;
    date: any;
    location: string;
    category: string;
    instructorName: string;
    instructorCert: string;
    imagePath?: string; // Optional image URL field
    id: string;
  
    constructor(
      title: string,
      description: string,
      date: any,
      location?: string,
      category?: string,
      instructorName?: string,
      instructorCert?: string,
      imagePath?: string,
      id?: string
    ) {
      this.title = title;
      this.description = description;
      this.date = date;
      this.location = location || '';
      this.category = category || '';
      this.instructorName = instructorName || '';
      this.instructorCert = instructorCert || '';
      this.imagePath = imagePath || ''; // Default to empty string
      this.id = id || '';
    }
  }
  