import { Component, OnInit } from '@angular/core';
import { comingSoonMovies } from 'src/data/comingSoonMovies';

interface Movie {
  id: string;
  movieCover: string;
  movieTitle: string;
  movieGenre: string;
  movieType: string;
  movieDate: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  movies: Movie[] = comingSoonMovies;
  currentIndex = 0;
  visibleMovie!: Movie;

  ngOnInit(): void {
    this.updateVisibleMovie();
  }

  updateVisibleMovie(): void {
    this.visibleMovie = this.movies[this.currentIndex];
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.movies.length;
    this.updateVisibleMovie();
  }

  prevSlide(): void {
    this.currentIndex = (this.currentIndex - 1 + this.movies.length) % this.movies.length;
    this.updateVisibleMovie();
  }
}
