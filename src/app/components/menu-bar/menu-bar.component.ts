import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
	selector: 'app-menu-bar',
	templateUrl: './menu-bar.component.html',
	styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {
	activeLink: string = 'home';

	constructor(private router: Router) { }

	ngOnInit(): void {
		// Atualiza a página ativa com base na URL
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				const url = event.urlAfterRedirects.split('/')[1];
				this.activeLink = url || 'home'; // Define a página ativa
			}
		});
	}

	setActive(link: string): void {
		this.activeLink = link;
	}
}
