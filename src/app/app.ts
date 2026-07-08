import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './layout/components/global-loader/global-loader';
import { GlobalErrors } from './layout/components/global-errors/global-errors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, GlobalErrors],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
