export class Scheme {
    title: string;
    highlights: string;
    applicationPeriod: any;
    startDate?: any; 
    endDate?: any;   
    eligibility: string;
    imagePath?: string; // Optional image URL field
    id: string;  // Ensure that id is always required
    expanded?: boolean;
  
    constructor(
      title: string,
      highlights: string,
      applicationPeriod: any,
      startDate: any,
      endDate: any,
      eligibility: string = '',
      imagePath: string = '', // Default to empty string
      id: string,  // id is required, no default value
    ) {
      this.title = title;
      this.highlights = highlights;
      this.applicationPeriod = applicationPeriod;
      this.startDate = startDate;
      this.endDate = endDate; 
      this.eligibility = eligibility;
      this.imagePath = imagePath;
      this.id = id; // Make sure `id` is always provided
      this.expanded = false; // Initialize `expanded` to false
    }
  }
  