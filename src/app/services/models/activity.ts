export class Activity {
  title: string;
  description: string;
  startTime: any;
  endTime: any;
  location: string;
  category: string;
  instructorName?: string;
  instructorCert?: string;
  imagePath?: string; // Optional image URL field
  id: string;  // Ensure that id is always required
  expanded?: boolean;

  constructor(
    title: string,
    description: string,
    startTime: any,
    endTime: any,
    location: string = '',
    category: string = '',
    instructorName: string = '',
    instructorCert: string = '',
    imagePath: string = '', // Default to empty string
    id: string,  // id is required, no default value
  ) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.location = location;
    this.category = category;
    this.instructorName = instructorName;
    this.instructorCert = instructorCert;
    this.imagePath = imagePath;
    this.id = id; // Make sure `id` is always provided
    this.expanded = false; // Initialize `expanded` to false
  }
}
