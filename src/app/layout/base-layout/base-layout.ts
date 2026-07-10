import { Component, input } from '@angular/core';
import { Footer } from '@layouts/components/footer/footer';
import { Header } from '@layouts/components/header/header';

/**
 * Base of the layout for all pages
 */
@Component({
  selector: 'copupitre-base-layout',
  imports: [Header, Footer],
  templateUrl: './base-layout.html',
  styleUrl: './base-layout.scss',
})
export class BaseLayout {
  /**
   * Value of the header is this visible or not
   */
  public Header = input<boolean>(true);

  /**
   * Value of the footer is this visible or not
   */
  public Footer = input<boolean>(true);
}
