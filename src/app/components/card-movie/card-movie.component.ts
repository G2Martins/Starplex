import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-card-movie',
	templateUrl: './card-movie.component.html',
	styleUrls: ['./card-movie.component.css']
})
export class CardMovieComponent implements OnInit {
	@Input() 
	movieCover: string = '';
	@Input() movieTitle: string = '';
	
	@Input() 
	movieGenre: string = '';
	
	@Input() 
	movieType: string = '';
	
	@Input() 
	movieDuration?: string; 
	
	@Input() 
	movieDate?: string;

	constructor() { }

	ngOnInit(): void { }
}
