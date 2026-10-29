import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from '@layouts/components/global-loader/global-loader';
import { GlobalErrors } from '@layouts/components/global-errors/global-errors';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, GlobalErrors],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
