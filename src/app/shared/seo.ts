import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AUTHOR, PORTFOLIO_URL, SITE_URL } from '../data/catalog';

export interface PageSeo {
  title: string;
  description: string;
  /** Path with trailing slash, e.g. "/filmes/wicked/". */
  path: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'video.movie';
  jsonLd?: object[];
  noindex?: boolean;
}

export const abs = (p: string) => (p.startsWith('http') ? p : SITE_URL + p);
export const OG_IMAGE = '/og.png';

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Starplex',
    description: 'Cinema fictício em Brasília: projeto de portfólio com filmes em cartaz, sessões, mapa de assentos e bomboniere. Compras simuladas.',
    inLanguage: 'pt-BR',
    creator: { '@type': 'Person', name: AUTHOR, url: PORTFOLIO_URL },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

@Injectable({ providedIn: 'root' })
export class Seo {
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private titleSvc = inject(Title);

  set(p: PageSeo) {
    const url = abs(p.path);
    const image = abs(p.image ?? OG_IMAGE);
    this.titleSvc.setTitle(p.title);

    const tags: Record<string, string> = {
      description: p.description,
      robots: p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      'og:type': p.type ?? 'website',
      'og:site_name': 'Starplex',
      'og:title': p.title,
      'og:description': p.description,
      'og:url': url,
      'og:image': image,
      'og:image:alt': p.imageAlt ?? p.title,
      'og:locale': 'pt_BR',
      'twitter:card': 'summary_large_image',
      'twitter:title': p.title,
      'twitter:description': p.description,
      'twitter:image': image,
    };
    for (const [key, content] of Object.entries(tags)) {
      const attr = key.startsWith('og:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }

    let canonical = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    let ld = this.doc.getElementById('ld-json');
    if (!ld) {
      ld = this.doc.createElement('script');
      ld.id = 'ld-json';
      ld.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(ld);
    }
    // Escape "<" so no string in the data can close the script element.
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [websiteNode(), ...(p.jsonLd ?? [])] }).replace(/</g, '\\u003c');
  }
}
