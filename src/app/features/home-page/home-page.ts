import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthService } from '@services/auth-service';

@Component({
  selector: 'copupitre-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  readonly authService = inject(AuthService);

  readonly isModelLoaded = signal(false);

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private modelGroup?: THREE.Group;
  private animFrameId?: number;
  private resizeListener?: () => void;
  private scrollTriggers: ScrollTrigger[] = [];

  ngOnInit(): void {
    this.titleService.setTitle('Copupitre — Entraide musicale entre orchestres associatifs');
    this.metaService.updateTag({
      name: 'description',
      content:
        "Copupitre est la plateforme solidaire et bénévole d'entraide entre orchestres associatifs et musiciens. Trouvez des renforts pour vos concerts, recrutez pour la saison et partagez du matériel.",
    });
    this.metaService.updateTag({
      property: 'og:title',
      content: 'Copupitre — Entraide musicale entre orchestres associatifs',
    });
    this.metaService.updateTag({
      property: 'og:description',
      content:
        "Trouvez des renforts bénévoles pour vos concerts, recrutez des musiciens et prêtez des instruments d'orchestre en toute convivialité.",
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.isWebGLAvailable()) {
      return;
    }

    this.initThreeScene();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }

    for (const trigger of this.scrollTriggers) {
      trigger.kill();
    }
    this.scrollTriggers = [];

    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  /**
   * Vérifie la disponibilité effective de WebGL (indispensable sous Node.js / jsdom en environnement de test).
   */
  private isWebGLAvailable(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    try {
      const canvas = document.createElement('canvas');
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  private initThreeScene(): void {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;

    gsap.registerPlugin(ScrollTrigger);

    this.scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Position de la caméra avec un zoom immersif sur l'instrument
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4.8);

    // Éclairage studio mettant en valeur le bois et le vernis du violon
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    keyLight.position.set(4, 5, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xddeeff, 1.5);
    fillLight.position.set(-4, -2, -3);
    this.scene.add(fillLight);

    // Lumière d'accentuation chaude rappelant la charte #EF8354
    const accentLight = new THREE.PointLight(0xef8354, 3.2, 14);
    accentLight.position.set(2, 2, 4);
    this.scene.add(accentLight);

    this.modelGroup = new THREE.Group();
    // Orientation relevée pour lever l'instrument (inclinaison x positive pour relever la tête/le manche)
    this.modelGroup.rotation.set(0.65, 0.45, -0.2);
    this.modelGroup.position.set(0, 0, 0);
    this.scene.add(this.modelGroup);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Chargement du modèle 3D de violon
    const loader = new GLTFLoader();
    loader.load(
      'assets/violin3.glb',
      (gltf) => {
        const model = gltf.scene;

        // 1. Mise à l'échelle (zoom) de l'instrument
        const initialBox = new THREE.Box3().setFromObject(model);
        const size = initialBox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 2.9 / maxAxis;
        model.scale.setScalar(targetScale);
        model.updateMatrixWorld(true);

        // 2. Centrage géométrique exact à l'origine (0, 0, 0)
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.sub(center);

        this.modelGroup?.add(model);
        this.modelGroup?.updateMatrixWorld(true);

        // 3. Compensation fine du centre de la boîte englobante orientée pour un centrage visuel parfait
        if (this.modelGroup) {
          const rotatedBox = new THREE.Box3().setFromObject(this.modelGroup);
          const rotatedCenter = rotatedBox.getCenter(new THREE.Vector3());
          model.position.x -= rotatedCenter.x;
          model.position.y -= rotatedCenter.y;
          this.modelGroup.updateMatrixWorld(true);
        }

        this.isModelLoaded.set(true);
        this.setupScrollAnimations(canvas);
      },
      undefined,
      () => {
        this.isModelLoaded.set(false);
      }
    );

    // Boucle de rendu avec oscillation douce au repos, centrée sur Y = 0
    const clock = new THREE.Clock();
    const tick = () => {
      const elapsed = clock.getElapsedTime();
      if (this.modelGroup) {
        // Léger mouvement flottant naturel centré sur 0
        this.modelGroup.position.y = Math.sin(elapsed * 1.2) * 0.04;
      }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    tick();

    // Redimensionnement fluide de la fenêtre
    this.resizeListener = () => {
      if (!this.camera || !this.renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.resizeListener);
  }

  private setupScrollAnimations(canvas: HTMLCanvasElement): void {
    if (!this.modelGroup) return;

    // 0. Apparition progressive du violon : invisible au repos sur la section 1,
    // son opacité croît au fil du défilement pour atteindre 100% à l'arrivée sur la section 2
    gsap.set(canvas, { opacity: 0 });
    const fadeInTween = gsap.to(canvas, {
      opacity: 1,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom 20%',
        scrub: true,
      },
    });

    if (fadeInTween.scrollTrigger) {
      this.scrollTriggers.push(fadeInTween.scrollTrigger);
    }

    // 1. Zone de vide / Showcase 3D : rotation 360° du violon lors du défilement à travers la section 2
    const showcaseTween = gsap.to(this.modelGroup.rotation, {
      y: Math.PI * 2 + 0.45,
      x: 0.55,
      z: -0.15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.horn-showcase-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    });

    if (showcaseTween.scrollTrigger) {
      this.scrollTriggers.push(showcaseTween.scrollTrigger);
    }

    // 2. Transition vers les sections informatives : estompage en filigrane discret pour maximiser la lisibilité
    const fadeOutTween = gsap.to(canvas, {
      opacity: 0.35,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '.content-sections',
        start: 'top 85%',
        end: 'top 30%',
        scrub: true,
      },
    });

    if (fadeOutTween.scrollTrigger) {
      this.scrollTriggers.push(fadeOutTween.scrollTrigger);
    }

    const contentTween = gsap.to(this.modelGroup.position, {
      x: window.innerWidth < 768 ? 0 : 1.4,
      y: window.innerWidth < 768 ? -0.2 : 0,
      z: window.innerWidth < 768 ? -1.0 : -0.6,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '.content-sections',
        start: 'top 80%',
        end: 'top 20%',
        scrub: 1,
      },
    });

    if (contentTween.scrollTrigger) {
      this.scrollTriggers.push(contentTween.scrollTrigger);
    }
  }
}
