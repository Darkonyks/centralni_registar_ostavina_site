import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { APP_URLS } from '../../config/site';
import { FinalCta } from '../sections/FinalCta';
import { Hero } from '../sections/Hero';
import { Footer } from './Footer';
import { Header } from './Header';

describe('Demo i Aplikacija linkovi', () => {
  it('svuda se otvaraju u novom prozoru, uz napomenu za čitače ekrana', () => {
    render(
      <>
        <Header />
        <Hero />
        <FinalCta />
        <Footer />
      </>,
    );

    const appLinks = screen.getAllByRole('link', { hidden: true }).filter((link) => {
      const href = link.getAttribute('href');
      return href === APP_URLS.demo || href === APP_URLS.app;
    });

    // Header (desktop + mobilni meni) 4, hero 2, završni CTA 1, footer 2.
    expect(appLinks).toHaveLength(9);
    for (const link of appLinks) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
      expect(link).toHaveTextContent('(otvara se u novom prozoru)');
    }
  });

  it('linkovi ka sekcijama stranice ostaju u istom prozoru', () => {
    render(<FinalCta />);

    expect(screen.getByRole('link', { name: 'Pošalji upit' })).not.toHaveAttribute('target');
  });
});
