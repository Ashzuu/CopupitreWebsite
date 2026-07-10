import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from '@layouts/components/global-loader/global-loader';
import { GlobalErrors } from '@layouts/components/global-errors/global-errors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, GlobalErrors],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
