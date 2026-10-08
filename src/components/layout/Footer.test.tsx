import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Footer } from './Footer';

describe('Footer – podaci o firmi', () => {
  it('prikazuje pun naziv, adresu, MB, PIB i kontakt firme', () => {
    render(<Footer />);

    const address = screen.getByText(/Mirna 1, 22000 Sremska Mitrovica/).closest('address')!;
    expect(address).toHaveTextContent('MB: 63583197');
    expect(address).toHaveTextContent('PIB: 108624736');
    expect(
      screen.getByText('Geobiz Projektovanje i izrada softvera PR Darko Nedic'),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: '063/12-61-227' })).toHaveAttribute(
      'href',
      'tel:+381631261227',
    );
    expect(screen.getByRole('link', { name: 'office@geo-biz.com' })).toHaveAttribute(
      'href',
      'mailto:office@geo-biz.com',
    );
    const website = screen.getByRole('link', { name: /www\.geo-biz\.com/ });
    expect(website).toHaveAttribute('href', 'https://geo-biz.com/');
    expect(website).toHaveAttribute('target', '_blank');
    expect(website).toHaveAttribute('rel', 'noopener');
  });
});
