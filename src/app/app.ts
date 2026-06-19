import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './layout/components/global-loader/global-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
