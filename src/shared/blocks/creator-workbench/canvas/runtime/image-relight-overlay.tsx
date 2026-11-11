"use client";

import {
  ArrowUp,
  Loader2,
  Redo2,
  SunMedium,
  Thermometer,
  X,
} from "lucide-react";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import type { CanvasImageToolRequest } from "../core/canvas-types";

type RelightPreset = NonNullable<
  NonNullable<CanvasImageToolRequest["lighting"]>["anglePreset"]
>;

type RelightRimPreset = NonNullable<
  NonNullable<CanvasImageToolRequest["lighting"]>["rimPreset"]
>;

type DirectionPreset = {
  key: RelightPreset;
  label: string;
  azimuthDeg: number;
  elevationDeg: number;
};

type SliderStop = {
  value: number;
  color: string;
};

type RelightState = {
  angle: {
    preset: RelightPreset | null;
    azimuthDeg: number;
    elevationDeg: number;
  };
  brightnessLevel: number;
  temperatureK: number;
  rimEnabled: boolean;
  rimPreset: RelightRimPreset;
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

function getRelightTextureUrl(imageUrl?: string) {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    return imageUrl;
  }
  return imageUrl;
}

const DIRECTION_PRESETS: DirectionPreset[] = [
  { key: "left_90", label: "左侧", azimuthDeg: 270, elevationDeg: 0 },
  { key: "top_90", label: "顶部", azimuthDeg: 0, elevationDeg: 90 },
  { key: "right_90", label: "右侧", azimuthDeg: 90, elevationDeg: 0 },
  { key: "front_0", label: "前方", azimuthDeg: 0, elevationDeg: 0 },
  { key: "bottom_90", label: "底部", azimuthDeg: 0, elevationDeg: -90 },
  { key: "back_180", label: "后方", azimuthDeg: 180, elevationDeg: 0 },
];

const SMART_RIM_ANGLES = [
  { azimuthDeg: 0, elevationDeg: 0 },
  { azimuthDeg: 270, elevationDeg: 0 },
  { azimuthDeg: 90, elevationDeg: 0 },
  { azimuthDeg: 0, elevationDeg: 90 },
  { azimuthDeg: 0, elevationDeg: -90 },
  { azimuthDeg: 0, elevationDeg: 45 },
  { azimuthDeg: 315, elevationDeg: 0 },
  { azimuthDeg: 45, elevationDeg: 0 },
  { azimuthDeg: 315, elevationDeg: 45 },
  { azimuthDeg: 45, elevationDeg: 45 },
] as const;

const RIM_PRESET_ANGLES: Record<
  RelightRimPreset,
  { azimuthDeg: number; elevationDeg: number }
> = {
  back_0: { azimuthDeg: 180, elevationDeg: 0 },
  top_back_45: { azimuthDeg: 180, elevationDeg: 45 },
  low_back_45: { azimuthDeg: 180, elevationDeg: -45 },
};

const ALL_PRESET_ANGLES: Array<{
  key: RelightPreset;
  azimuthDeg: number;
  elevationDeg: number;
}> = [
  { key: "front_0", azimuthDeg: 0, elevationDeg: 0 },
  { key: "right_45", azimuthDeg: 45, elevationDeg: 0 },
  { key: "right_90", azimuthDeg: 90, elevationDeg: 0 },
  { key: "right_rear_45", azimuthDeg: 135, elevationDeg: 0 },
  { key: "back_180", azimuthDeg: 180, elevationDeg: 0 },
  { key: "left_rear_45", azimuthDeg: 225, elevationDeg: 0 },
  { key: "left_90", azimuthDeg: 270, elevationDeg: 0 },
  { key: "left_45", azimuthDeg: 315, elevationDeg: 0 },
  { key: "top_front_45", azimuthDeg: 0, elevationDeg: 45 },
  { key: "top_front_right_45", azimuthDeg: 45, elevationDeg: 45 },
  { key: "top_right_45", azimuthDeg: 90, elevationDeg: 45 },
  { key: "right_rear_top_45", azimuthDeg: 135, elevationDeg: 45 },
  { key: "top_rear_45", azimuthDeg: 180, elevationDeg: 45 },
  { key: "left_rear_top_45", azimuthDeg: 225, elevationDeg: 45 },
  { key: "top_left_45", azimuthDeg: 270, elevationDeg: 45 },
  { key: "top_front_left_45", azimuthDeg: 315, elevationDeg: 45 },
  { key: "bottom_front_45", azimuthDeg: 0, elevationDeg: -45 },
  { key: "bottom_front_right_45", azimuthDeg: 45, elevationDeg: -45 },
  { key: "bottom_right_45", azimuthDeg: 90, elevationDeg: -45 },
  { key: "right_rear_bottom_45", azimuthDeg: 135, elevationDeg: -45 },
  { key: "bottom_rear_45", azimuthDeg: 180, elevationDeg: -45 },
  { key: "left_rear_bottom_45", azimuthDeg: 225, elevationDeg: -45 },
  { key: "bottom_left_45", azimuthDeg: 270, elevationDeg: -45 },
  { key: "bottom_front_left_45", azimuthDeg: 315, elevationDeg: -45 },
  { key: "top_90", azimuthDeg: 0, elevationDeg: 90 },
  { key: "bottom_90", azimuthDeg: 0, elevationDeg: -90 },
];

const BRIGHTNESS_STOPS: SliderStop[] = [
  { value: 10, color: "#CCCCCC" },
  { value: 50, color: "#CCCCCC" },
  { value: 100, color: "#CCCCCC" },
];

const TEMPERATURE_STOPS: SliderStop[] = [
  { value: 2000, color: "#D7995D" },
  { value: 3000, color: "#D5AE55" },
  { value: 4000, color: "#F3DB90" },
  { value: 5600, color: "#F3F9FC" },
  { value: 7000, color: "#D4E6EE" },
  { value: 8000, color: "#C4E2F0" },
];

const TEMPERATURE_GRADIENT =
  "linear-gradient(90deg, rgba(238,130,36,0.30) 0%, rgba(242,154,37,0.30) 20%, rgba(249,218,125,0.30) 41%, rgba(247,249,242,0.30) 63%, rgba(220,239,247,0.30) 81%, rgba(182,224,242,0.30) 99%)";

const DEFAULT_PARAMS: RelightState = {
  angle: { preset: "front_0" as RelightPreset, azimuthDeg: 0, elevationDeg: 0 },
  brightnessLevel: 50,
  temperatureK: 5600,
  rimEnabled: true,
  rimPreset: "back_0" as RelightRimPreset,
};

const TRACK_WIDTH = 132;
const DRAG_PX_PER_STOP = 20;

const SPHERE_SIZE = 256;
const SPHERE_RADIUS = 6;
const MERIDIANS = [0, 45, 90, 135, 180, 225, 270, 315];
const PARALLELS = [-90, -45, 0, 45, 90];
const GRID_STEPS = 64;
const SENSITIVITY = 0.8;
const LERP_DRAG = 0.2;
const LERP_IDLE = 0.12;
const DEFAULT_LIGHT_COLOR = new THREE.Color("#F3F9FC");

const CAMERA_VIEWS = {
  perspective: {
    pos: new THREE.Vector3(11, 8, 10),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  front: {
    pos: new THREE.Vector3(0, 1, 15),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
} as const;

type SceneState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  shell: THREE.Mesh;
  mLines: Map<number, THREE.Line>;
  pLines: Map<number, THREE.Line>;
  dots: THREE.Sprite[];
  lightGroup: THREE.Group;
  bulb: THREE.Mesh;
  cone: THREE.Mesh;
  dotTexture: THREE.Texture;
  targetMesh: THREE.Mesh;
  targetFrontMat: THREE.MeshStandardMaterial;
  pointLight: THREE.PointLight;
  rimGroup: THREE.Group;
  rimBulb: THREE.Mesh;
  rimCone: THREE.Mesh;
  rimPointLight: THREE.PointLight;
  rimEnabled: boolean;
  rimDispAz: number;
  rimDispEl: number;
  rimTAz: number;
  rimTEl: number;
  rimOpacity: number;
  dragTarget: "main" | "rim";
  tColor: THREE.Color;
  dispColor: THREE.Color;
  tIntensity: number;
  dispIntensity: number;
  dispAz: number;
  dispEl: number;
  tAz: number;
  tEl: number;
  dragging: boolean;
  bulbScale: number;
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
};

function shouldAutoEnableRim(azimuthDeg: number, elevationDeg: number) {
  return SMART_RIM_ANGLES.some((preset) => {
    const azDiff = Math.abs(((azimuthDeg - preset.azimuthDeg + 540) % 360) - 180);
    const elDiff = Math.abs(elevationDeg - preset.elevationDeg);
    return azDiff <= 5 && elDiff <= 5;
  });
}

function findMatchingPreset(azimuthDeg: number, elevationDeg: number) {
  if (Math.abs(elevationDeg - 90) <= 5) {
    return ALL_PRESET_ANGLES.find((preset) => preset.key === "top_90") ?? null;
  }
  if (Math.abs(elevationDeg + 90) <= 5) {
    return ALL_PRESET_ANGLES.find((preset) => preset.key === "bottom_90") ?? null;
  }

  return (
    ALL_PRESET_ANGLES.find((preset) => {
      const azDiff = Math.abs(((azimuthDeg - preset.azimuthDeg + 540) % 360) - 180);
      const elDiff = Math.abs(elevationDeg - preset.elevationDeg);
      return azDiff <= 5 && elDiff <= 5;
    }) ?? null
  );
}

function snapMeridian(azimuthDeg: number) {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  let best = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const meridian of MERIDIANS) {
    const distance = Math.min(
      Math.abs(normalized - meridian),
      360 - Math.abs(normalized - meridian),
    );
    if (distance < minDistance) {
      minDistance = distance;
      best = meridian;
    }
  }
  return best;
}

function snapParallel(elevationDeg: number) {
  let best = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const parallel of PARALLELS) {
    const distance = Math.abs(elevationDeg - parallel);
    if (distance < minDistance) {
      minDistance = distance;
      best = parallel;
    }
  }
  return best;
}

function findNearestRimPreset(
  azimuthDeg: number,
  elevationDeg: number,
): RelightRimPreset {
  let best: RelightRimPreset = "back_0";
  let minDistance = Number.POSITIVE_INFINITY;

  for (const [key, angle] of Object.entries(RIM_PRESET_ANGLES) as Array<
    [RelightRimPreset, { azimuthDeg: number; elevationDeg: number }]
  >) {
    const azDiff = Math.abs(((azimuthDeg - angle.azimuthDeg + 540) % 360) - 180);
    const elDiff = Math.abs(elevationDeg - angle.elevationDeg);
    const distance = azDiff + elDiff;
    if (distance < minDistance) {
      minDistance = distance;
      best = key;
    }
  }

  return best;
}

function getStopIndexFromX(
  trackElement: HTMLDivElement,
  clientX: number,
  stopCount: number,
) {
  const rect = trackElement.getBoundingClientRect();
  const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
  const index = Math.round((relativeX / rect.width) * (stopCount - 1));
  return Math.max(0, Math.min(index, stopCount - 1));
}

function createGradientLine(points: THREE.Vector3[]) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const pointCount = points.length;
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(pointCount * 3), 3),
  );
  geometry.setAttribute(
    "opacityAttr",
    new THREE.BufferAttribute(new Float32Array(pointCount), 1),
  );

  const material = new THREE.ShaderMaterial({
    uniforms: { globalOpacity: { value: 0 } },
    vertexShader: `
      attribute vec3 color;
      attribute float opacityAttr;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vColor = color;
        vOpacity = opacityAttr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float globalOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        gl_FragColor = vec4(vColor, vOpacity * globalOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Line(geometry, material);
}

function buildScene(element: HTMLDivElement): SceneState {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.copy(CAMERA_VIEWS.front.pos);
  camera.lookAt(CAMERA_VIEWS.front.lookAt);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(SPHERE_SIZE, SPHERE_SIZE);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  element.appendChild(renderer.domElement);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS * 1.01, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(0xcccccc) },
        shadowIntensity: { value: 0.85 },
        centerAlpha: { value: 0.08 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform float shadowIntensity;
        uniform float centerAlpha;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float nDotV = max(dot(vNormal, vViewDir), 0.0);
          float edge = pow(1.0 - nDotV, 2.0);
          vec3 col = mix(baseColor, vec3(0.0), edge * 0.5);
          float a = centerAlpha + edge * shadowIntensity;
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    }),
  );
  scene.add(shell);

  const mLines = new Map<number, THREE.Line>();
  for (const azimuth of MERIDIANS) {
    const points: THREE.Vector3[] = [];
    const theta = (azimuth * Math.PI) / 180;
    for (let index = 0; index <= GRID_STEPS; index += 1) {
      const elevation = -90 + (index / GRID_STEPS) * 180;
      const phi = ((90 - elevation) * Math.PI) / 180;
      points.push(
        new THREE.Vector3(
          SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta),
          SPHERE_RADIUS * Math.cos(phi),
          SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
        ),
      );
    }
    const line = createGradientLine(points);
    line.userData = { azimuth: azimuth, points };
    scene.add(line);
    mLines.set(azimuth, line);
  }

  const pLines = new Map<number, THREE.Line>();
  for (const elevation of PARALLELS) {
    const points: THREE.Vector3[] = [];
    const phi = ((90 - elevation) * Math.PI) / 180;
    const y = SPHERE_RADIUS * Math.cos(phi);
    const radius = SPHERE_RADIUS * Math.sin(phi);
    for (let index = 0; index <= GRID_STEPS; index += 1) {
      const theta = (index / GRID_STEPS) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          radius * Math.sin(theta),
          y,
          radius * Math.cos(theta),
        ),
      );
    }
    const line = createGradientLine(points);
    line.userData = { elevation, points };
    scene.add(line);
    pLines.set(elevation, line);
  }

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = 128;
  dotCanvas.height = 128;
  const dotContext = dotCanvas.getContext("2d")!;
  const gradient = dotContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  dotContext.fillStyle = gradient;
  dotContext.fillRect(0, 0, 128, 128);
  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  const dots: THREE.Sprite[] = [];
  for (const elevation of PARALLELS) {
    const phi = ((90 - elevation) * Math.PI) / 180;
    for (const azimuth of MERIDIANS) {
      const theta = (azimuth * Math.PI) / 180;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: dotTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      sprite.position.set(
        SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta),
        SPHERE_RADIUS * Math.cos(phi),
        SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
      );
      sprite.scale.set(0.2, 0.2, 1);
      sprite.userData = { azimuth, elevation };
      scene.add(sprite);
      dots.push(sprite);
    }
  }

  const targetFrontMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.5,
    metalness: 0.1,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7,
    metalness: 0.05,
  });
  const targetMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 0.2),
    [edgeMat, edgeMat, edgeMat, edgeMat, targetFrontMat, targetFrontMat],
  );
  targetMesh.castShadow = true;
  targetMesh.receiveShadow = true;
  targetMesh.visible = false;
  scene.add(targetMesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const lightGroup = new THREE.Group();
  const pointLight = new THREE.PointLight(DEFAULT_LIGHT_COLOR, 6, 0);
  pointLight.color.setHex(DEFAULT_LIGHT_COLOR.getHex());
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(1024, 1024);
  pointLight.shadow.bias = -0.001;
  lightGroup.add(pointLight);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, SPHERE_RADIUS, 128, 1, true),
    new THREE.ShaderMaterial({
      uniforms: {
        lightColor: { value: DEFAULT_LIGHT_COLOR.clone() },
        opacity: { value: 0 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;
        void main() {
          vUv = uv;
          vHeight = (position.y + ${(SPHERE_RADIUS / 2).toFixed(1)}) / ${SPHERE_RADIUS.toFixed(1)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lightColor;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;
        varying float vHeight;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        void main() {
          float falloff = pow(vHeight, 2.5);
          float lat = abs(vUv.x - 0.5) * 2.0;
          float core = pow(1.0 - lat, 4.0);
          float fringe = pow(1.0 - lat, 0.8);
          float grain = hash(vUv + time * 0.05) * 0.12;
          vec3 base = mix(lightColor, vec3(1.0), pow(vHeight, 8.0) * 0.8);
          float a = (core * 2.0 + fringe * 2.0) * falloff * opacity;
          a *= (0.9 + grain);
          a *= smoothstep(0.0, 0.15, vHeight);
          gl_FragColor = vec4(base, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  cone.rotation.x = -Math.PI / 2;
  cone.position.z = SPHERE_RADIUS / 2;
  lightGroup.add(cone);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 48, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        lightColor: { value: DEFAULT_LIGHT_COLOR.clone() },
        rimPower: { value: 3 },
        rimIntensity: { value: 1.5 },
        glowIntensity: { value: 0.3 },
        lightDir: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 lightColor;
        uniform float rimPower;
        uniform float rimIntensity;
        uniform float glowIntensity;
        uniform vec3 lightDir;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
          rim = pow(rim, rimPower) * rimIntensity;
          float dotL = dot(vWorldNormal, -lightDir);
          float fg = pow(max(0.0, dotL), 1.5) * 1.5;
          float crescent = rim * max(0.0, dotL + 0.5);
          vec3 col = vec3(0.01) + lightColor * (fg + crescent);
          col += pow(max(0.0, dotL), 6.0) * 0.5;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      depthWrite: true,
    }),
  );
  lightGroup.add(bulb);
  scene.add(lightGroup);

  const rimGroup = new THREE.Group();
  const rimPointLight = new THREE.PointLight(DEFAULT_LIGHT_COLOR, 3, 0);
  rimGroup.add(rimPointLight);

  const rimCone = new THREE.Mesh(
    new THREE.ConeGeometry(2, SPHERE_RADIUS, 128, 1, true),
    new THREE.ShaderMaterial({
      uniforms: {
        lightColor: { value: DEFAULT_LIGHT_COLOR.clone() },
        opacity: { value: 0 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;
        void main() {
          vUv = uv;
          vHeight = (position.y + ${(SPHERE_RADIUS / 2).toFixed(1)}) / ${SPHERE_RADIUS.toFixed(1)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lightColor;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;
        varying float vHeight;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        void main() {
          float falloff = pow(vHeight, 2.5);
          float lat = abs(vUv.x - 0.5) * 2.0;
          float core = pow(1.0 - lat, 4.0);
          float fringe = pow(1.0 - lat, 0.8);
          float grain = hash(vUv + time * 0.05) * 0.12;
          vec3 base = mix(lightColor, vec3(1.0), pow(vHeight, 8.0) * 0.8);
          float a = (core * 2.0 + fringe * 2.0) * falloff * opacity;
          a *= (0.9 + grain);
          a *= smoothstep(0.0, 0.15, vHeight);
          gl_FragColor = vec4(base, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  rimCone.rotation.x = -Math.PI / 2;
  rimCone.position.z = SPHERE_RADIUS / 2;
  rimGroup.add(rimCone);

  const rimBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 48, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        lightColor: { value: DEFAULT_LIGHT_COLOR.clone() },
        rimPower: { value: 3 },
        rimIntensity: { value: 1.5 },
        glowIntensity: { value: 0.3 },
        lightDir: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 lightColor;
        uniform float rimPower;
        uniform float rimIntensity;
        uniform float glowIntensity;
        uniform vec3 lightDir;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
          rim = pow(rim, rimPower) * rimIntensity;
          float dotL = dot(vWorldNormal, -lightDir);
          float fg = pow(max(0.0, dotL), 1.5) * 1.5;
          float crescent = rim * max(0.0, dotL + 0.5);
          vec3 col = vec3(0.01) + lightColor * (fg + crescent);
          col += pow(max(0.0, dotL), 6.0) * 0.5;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      depthWrite: true,
    }),
  );
  rimGroup.add(rimBulb);
  rimGroup.visible = false;
  scene.add(rimGroup);

  return {
    scene,
    camera,
    renderer,
    shell,
    mLines,
    pLines,
    dots,
    lightGroup,
    bulb,
    cone,
    dotTexture,
    targetMesh,
    targetFrontMat,
    pointLight,
    rimGroup,
    rimBulb,
    rimCone,
    rimPointLight,
    rimEnabled: false,
    rimDispAz: 180,
    rimDispEl: 0,
    rimTAz: 180,
    rimTEl: 0,
    rimOpacity: 0,
    dragTarget: "main",
    tColor: DEFAULT_LIGHT_COLOR.clone(),
    dispColor: DEFAULT_LIGHT_COLOR.clone(),
    tIntensity: 1,
    dispIntensity: 1,
    dispAz: 0,
    dispEl: 0,
    tAz: 0,
    tEl: 0,
    dragging: false,
    bulbScale: 1,
    camPos: CAMERA_VIEWS.front.pos.clone(),
    camLook: CAMERA_VIEWS.front.lookAt.clone(),
  };
}

function positionLight(scene: SceneState) {
  const theta = (scene.dispAz * Math.PI) / 180;
  const phi = ((90 - scene.dispEl) * Math.PI) / 180;
  const x = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
  const y = SPHERE_RADIUS * Math.cos(phi);
  const z = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
  scene.lightGroup.position.set(x, y, z);
  scene.lightGroup.lookAt(0, 0, 0);
  (scene.bulb.material as THREE.ShaderMaterial).uniforms.lightDir.value
    .set(x, y, z)
    .normalize();
  scene.bulb.scale.setScalar(scene.bulbScale);
}

function positionRimLight(scene: SceneState) {
  const theta = (scene.rimDispAz * Math.PI) / 180;
  const phi = ((90 - scene.rimDispEl) * Math.PI) / 180;
  const x = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
  const y = SPHERE_RADIUS * Math.cos(phi);
  const z = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
  scene.rimGroup.position.set(x, y, z);
  scene.rimGroup.lookAt(0, 0, 0);
  (scene.rimBulb.material as THREE.ShaderMaterial).uniforms.lightDir.value
    .set(x, y, z)
    .normalize();
}

function updateLineGradient(
  line: THREE.Line,
  lightPosition: THREE.Vector3,
  color: number,
  isStatic: boolean,
) {
  const points = line.userData.points as THREE.Vector3[];
  const colors = (
    line.geometry.attributes.color as THREE.BufferAttribute
  ).array as Float32Array;
  const opacities = (
    line.geometry.attributes.opacityAttr as THREE.BufferAttribute
  ).array as Float32Array;
  const color3 = new THREE.Color(color);
  const maxDistance = isStatic ? SPHERE_RADIUS * 1.2 : SPHERE_RADIUS * 1.5;
  const power = isStatic ? 3 : 2;

  for (let index = 0; index < points.length; index += 1) {
    const factor =
      Math.max(0, 1 - points[index].distanceTo(lightPosition) / maxDistance) **
      power;
    colors[index * 3] = color3.r * factor;
    colors[index * 3 + 1] = color3.g * factor;
    colors[index * 3 + 2] = color3.b * factor;
    opacities[index] = factor;
  }

  line.geometry.attributes.color.needsUpdate = true;
  line.geometry.attributes.opacityAttr.needsUpdate = true;
}

function highlightGrid(scene: SceneState) {
  const activeAzimuth = snapMeridian(scene.tAz);
  const activeElevation = snapParallel(scene.tEl);
  const lightPosition = scene.lightGroup.position;
  const lightHex = scene.dispColor.getHex();
  const shellUniforms = (scene.shell.material as THREE.ShaderMaterial).uniforms;

  if (scene.dragging) {
    shellUniforms.shadowIntensity.value = THREE.MathUtils.lerp(
      shellUniforms.shadowIntensity.value,
      0.3,
      0.1,
    );
    shellUniforms.centerAlpha.value = THREE.MathUtils.lerp(
      shellUniforms.centerAlpha.value,
      0.05,
      0.1,
    );

    scene.mLines.forEach((line, azimuth) => {
      const active = azimuth === activeAzimuth;
      const material = line.material as THREE.ShaderMaterial;
      material.uniforms.globalOpacity.value = THREE.MathUtils.lerp(
        material.uniforms.globalOpacity.value,
        active ? 1 : 0.3,
        0.15,
      );
      updateLineGradient(line, lightPosition, active ? lightHex : 0x444444, false);
    });

    scene.pLines.forEach((line, elevation) => {
      const active = elevation === activeElevation;
      const material = line.material as THREE.ShaderMaterial;
      material.uniforms.globalOpacity.value = THREE.MathUtils.lerp(
        material.uniforms.globalOpacity.value,
        active ? 1 : 0.3,
        0.15,
      );
      updateLineGradient(line, lightPosition, active ? lightHex : 0x444444, false);
    });

    scene.dots.forEach((dot) => {
      const { azimuth, elevation } = dot.userData;
      const active = azimuth === activeAzimuth && elevation === activeElevation;
      let targetOpacity = active ? 1 : 0.35;
      if (dot.position.z < 0) targetOpacity *= 0.5;
      dot.material.opacity = THREE.MathUtils.lerp(
        dot.material.opacity,
        targetOpacity,
        0.15,
      );
      dot.material.color.setHex(active ? lightHex : 0x777777);
    });
  } else {
    shellUniforms.shadowIntensity.value = THREE.MathUtils.lerp(
      shellUniforms.shadowIntensity.value,
      0.45,
      0.05,
    );
    shellUniforms.centerAlpha.value = THREE.MathUtils.lerp(
      shellUniforms.centerAlpha.value,
      0.08,
      0.05,
    );

    scene.mLines.forEach((line, azimuth) => {
      const active = azimuth === activeAzimuth;
      const material = line.material as THREE.ShaderMaterial;
      material.uniforms.globalOpacity.value = THREE.MathUtils.lerp(
        material.uniforms.globalOpacity.value,
        active ? 0.7 : 0,
        0.1,
      );
      if (active) updateLineGradient(line, lightPosition, lightHex, true);
    });

    scene.pLines.forEach((line, elevation) => {
      const active = elevation === activeElevation;
      const material = line.material as THREE.ShaderMaterial;
      material.uniforms.globalOpacity.value = THREE.MathUtils.lerp(
        material.uniforms.globalOpacity.value,
        active ? 0.7 : 0,
        0.1,
      );
      if (active) updateLineGradient(line, lightPosition, lightHex, true);
    });

    scene.dots.forEach((dot) => {
      const { azimuth, elevation } = dot.userData;
      const onLine = azimuth === activeAzimuth || elevation === activeElevation;
      let targetOpacity = onLine ? 0.25 : 0;
      if (dot.position.z < 0) targetOpacity *= 0.5;
      dot.material.opacity = THREE.MathUtils.lerp(
        dot.material.opacity,
        targetOpacity,
        0.1,
      );
      dot.material.color.setHex(0x999999);
    });
  }

  const coneUniforms = (scene.cone.material as THREE.ShaderMaterial).uniforms;
  const baseConeOpacity = scene.dragging ? 0.7 : 0.45;
  coneUniforms.opacity.value = THREE.MathUtils.lerp(
    coneUniforms.opacity.value,
    baseConeOpacity * scene.dispIntensity,
    0.1,
  );
  coneUniforms.time.value = performance.now() * 0.001;

  const bulbUniforms = (scene.bulb.material as THREE.ShaderMaterial).uniforms;
  bulbUniforms.rimIntensity.value = THREE.MathUtils.lerp(
    bulbUniforms.rimIntensity.value,
    scene.dragging ? 2.5 : 1.5,
    0.15,
  );
  bulbUniforms.glowIntensity.value = THREE.MathUtils.lerp(
    bulbUniforms.glowIntensity.value,
    scene.dragging ? 0.6 : 0.3,
    0.15,
  );

  const rimTarget = scene.rimEnabled ? 1 : 0;
  scene.rimOpacity = THREE.MathUtils.lerp(scene.rimOpacity, rimTarget, 0.1);
  scene.rimGroup.visible = scene.rimOpacity > 0.01;

  if (scene.rimGroup.visible) {
    const rimConeUniforms = (scene.rimCone.material as THREE.ShaderMaterial).uniforms;
    rimConeUniforms.opacity.value = scene.rimOpacity * 0.35;
    rimConeUniforms.time.value = performance.now() * 0.001;

    const rimBulbUniforms = (scene.rimBulb.material as THREE.ShaderMaterial).uniforms;
    rimBulbUniforms.rimIntensity.value = 1.5 * scene.rimOpacity;
    rimBulbUniforms.glowIntensity.value = 0.3 * scene.rimOpacity;
    scene.rimPointLight.intensity = 3 * scene.rimOpacity;
  }
}

function disposeScene(scene: SceneState) {
  scene.renderer.dispose();
  scene.renderer.domElement.remove();
  scene.dotTexture.dispose();
  scene.scene.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material: THREE.Material) => material.dispose());
    }
    if (object instanceof THREE.Sprite) {
      object.material.dispose();
    }
  });
}

function mapPresetToMainLight(
  preset: RelightPreset | null,
  azimuthDeg: number,
  elevationDeg: number,
): NonNullable<NonNullable<CanvasImageToolRequest["lighting"]>["mainLight"]> {
  if (preset === "top_90") return "top";
  if (preset === "bottom_90") return "bottom";
  if (preset === "back_180") return "back";
  if (preset === "left_90" || preset === "left_45" || preset === "left_rear_45")
    return "left";
  if (
    preset === "right_90" ||
    preset === "right_45" ||
    preset === "right_rear_45"
  ) {
    return "right";
  }
  if (elevationDeg >= 70) return "top";
  if (elevationDeg <= -70) return "bottom";
  if (Math.abs(((azimuthDeg - 180 + 540) % 360) - 180) <= 30) return "back";
  if (azimuthDeg >= 180 && azimuthDeg < 360) return "left";
  if (azimuthDeg > 0 && azimuthDeg < 180) return "right";
  return "front";
}

function SectionLabel({ label }: { label: string }) {
  return <span className="text-sm font-medium">{label}</span>;
}

function LightBadge({
  label,
  glowColor,
  textColor,
}: {
  label: string;
  glowColor: string;
  textColor: string;
}) {
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        background: "#212121",
        borderRadius: "12px 12px 0 0",
        outline: "1px solid var(--border)",
        outlineOffset: -1,
        height: 22,
        paddingLeft: 14,
        paddingRight: 14,
      }}
    >
      <span
        className="relative whitespace-nowrap uppercase"
        style={{
          color: textColor,
          fontSize: 12,
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: "16px",
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 89,
          height: 12,
          bottom: -5,
          background: glowColor,
          opacity: 0.33,
          filter: "blur(3.1px)",
        }}
      />
    </div>
  );
}

function DirectionPresetGrid({
  activePreset,
  onSelect,
}: {
  activePreset: RelightPreset | null;
  onSelect: (preset: DirectionPreset) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {DIRECTION_PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => onSelect(preset)}
          className={joinClasses(
            "h-6 px-6 rounded-sm text-xs font-semibold transition-colors overflow-hidden flex items-center justify-center",
            activePreset === preset.key
              ? "bg-input text-white shadow-[-2px_1px_6.3px_rgba(0,0,0,0.05)]"
              : "bg-input/30 text-muted-foreground hover:bg-input/60",
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

function SteppedSlider({
  stops,
  value,
  onChange,
  trackGradient,
  icon,
  suffix,
}: {
  stops: SliderStop[];
  value: number;
  onChange: (value: number) => void;
  trackGradient?: string;
  icon?: ReactNode;
  suffix?: string;
}) {
  const activeIndex = stops.findIndex((stop) => stop.value === value);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackDragging, setTrackDragging] = useState(false);
  const [valueDragging, setValueDragging] = useState(false);
  const valueDragStartX = useRef(0);
  const valueDragStartIndex = useRef(0);

  const selectByClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const index = getStopIndexFromX(trackRef.current, clientX, stops.length);
      onChange(stops[index].value);
    },
    [onChange, stops],
  );

  const handleTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      trackRef.current?.setPointerCapture(event.pointerId);
      setTrackDragging(true);
      selectByClientX(event.clientX);
    },
    [selectByClientX],
  );

  const handleTrackPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!trackDragging) return;
      selectByClientX(event.clientX);
    },
    [selectByClientX, trackDragging],
  );

  const handleValuePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setValueDragging(true);
      valueDragStartX.current = event.clientX;
      valueDragStartIndex.current = activeIndex;
    },
    [activeIndex],
  );

  const handleValuePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!valueDragging) return;
      const delta = event.clientX - valueDragStartX.current;
      const stepsDelta = Math.round(delta / DRAG_PX_PER_STOP);
      const newIndex = Math.max(
        0,
        Math.min(valueDragStartIndex.current + stepsDelta, stops.length - 1),
      );
      if (stops[newIndex].value !== value) {
        onChange(stops[newIndex].value);
      }
    },
    [onChange, stops, value, valueDragging],
  );

  useEffect(() => {
    if (!trackDragging && !valueDragging) return;
    const handlePointerUp = () => {
      setTrackDragging(false);
      setValueDragging(false);
    };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [trackDragging, valueDragging]);

  return (
    <div className="flex items-center justify-between">
      <div
        ref={trackRef}
        className="relative select-none cursor-pointer"
        style={{ width: TRACK_WIDTH, height: 22, touchAction: "none" }}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={() => setTrackDragging(false)}
      >
        <div
          className="absolute left-0 overflow-hidden pointer-events-none"
          style={{
            top: 6,
            width: TRACK_WIDTH,
            height: 10,
            padding: 2,
            borderRadius: trackGradient ? 16 : 18,
            background: trackGradient
              ? "rgba(173, 176, 178, 0.10)"
              : "rgba(255, 255, 255, 0.09)",
            backdropFilter: "blur(19px)",
          }}
        >
          {trackGradient ? (
            <div
              className="absolute inset-[2px] rounded-[14px]"
              style={{ background: trackGradient }}
            />
          ) : null}
          <div className="relative flex w-full h-full">
            {stops.map((stop, index) => (
              <div
                key={stop.value}
                className="flex-1 rounded-lg transition-colors duration-200"
                style={{
                  background: index === activeIndex ? stop.color : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        {stops.map((stop, index) => {
          const segmentWidth = TRACK_WIDTH / stops.length;
          const centerX = segmentWidth * index + segmentWidth / 2 - 1;
          return (
            <div
              key={`dot-${stop.value}`}
              className="absolute rounded-full transition-opacity duration-200 pointer-events-none"
              style={{
                top: 18,
                left: centerX,
                width: 2,
                height: 2,
                background: stop.color,
                opacity: index === activeIndex ? 0.7 : 0.2,
              }}
            />
          );
        })}
      </div>

      <div
        className="flex items-center shrink-0 rounded-sm bg-input/30 select-none"
        style={{
          width: 84,
          height: 24,
          cursor: "ew-resize",
          touchAction: "none",
        }}
        onPointerDown={handleValuePointerDown}
        onPointerMove={handleValuePointerMove}
        onPointerUp={() => setValueDragging(false)}
      >
        <div
          className={joinClasses(
            "flex-1 flex items-center pl-3 pointer-events-none",
            suffix ? "justify-between pr-2" : "gap-3 pr-3",
          )}
        >
          {icon ? (
            <div
              className={joinClasses(
                "flex items-center justify-center text-foreground shrink-0",
                suffix ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]",
              )}
            >
              {icon}
            </div>
          ) : null}
          <span className="text-sm font-medium text-foreground leading-5">
            {value}
          </span>
          {suffix ? (
            <span className="text-sm font-semibold text-foreground/[0.34] leading-5">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LightSphere3D({
  azimuthDeg,
  elevationDeg,
  onAngleChange,
  viewMode,
  onViewModeChange,
  imageSrc,
  lightColor = "#F3F9FC",
  brightnessPercent = 50,
  rimEnabled = false,
  rimAzimuthDeg = 180,
  rimElevationDeg = 0,
  onRimPresetChange,
  onDragTargetChange,
}: {
  azimuthDeg: number;
  elevationDeg: number;
  onAngleChange: (azimuthDeg: number, elevationDeg: number) => void;
  viewMode: "perspective" | "front";
  onViewModeChange: (mode: "perspective" | "front") => void;
  imageSrc?: string;
  lightColor?: string;
  brightnessPercent?: number;
  rimEnabled?: boolean;
  rimAzimuthDeg?: number;
  rimElevationDeg?: number;
  onRimPresetChange?: (preset: RelightRimPreset) => void;
  onDragTargetChange?: (target: "main" | "rim") => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const rafRef = useRef(0);
  const dragRef = useRef({ sx: 0, sy: 0, sAz: 0, sEl: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = buildScene(containerRef.current);
    sceneRef.current = scene;
    scene.tAz = azimuthDeg;
    scene.tEl = elevationDeg;
    scene.dispAz = azimuthDeg;
    scene.dispEl = elevationDeg;
    positionLight(scene);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      scene.camera.position.lerp(scene.camPos, 0.08);
      scene.camera.lookAt(scene.camLook);

      const lerpSpeed = scene.dragging ? LERP_DRAG : LERP_IDLE;
      let azimuthDelta = scene.tAz - scene.dispAz;
      if (azimuthDelta > 180) azimuthDelta -= 360;
      if (azimuthDelta < -180) azimuthDelta += 360;
      scene.dispAz += azimuthDelta * lerpSpeed;
      scene.dispEl += (scene.tEl - scene.dispEl) * lerpSpeed;
      scene.bulbScale += (1 - scene.bulbScale) * 0.12;
      positionLight(scene);

      let rimAzimuthDelta = scene.rimTAz - scene.rimDispAz;
      if (rimAzimuthDelta > 180) rimAzimuthDelta -= 360;
      if (rimAzimuthDelta < -180) rimAzimuthDelta += 360;
      scene.rimDispAz += rimAzimuthDelta * LERP_IDLE;
      scene.rimDispEl += (scene.rimTEl - scene.rimDispEl) * LERP_IDLE;
      positionRimLight(scene);

      scene.dispColor.lerp(scene.tColor, 0.1);
      scene.dispIntensity += (scene.tIntensity - scene.dispIntensity) * 0.1;

      const mainBulbUniforms = (scene.bulb.material as THREE.ShaderMaterial).uniforms;
      mainBulbUniforms.lightColor.value.copy(scene.dispColor);
      mainBulbUniforms.glowIntensity.value = 0.3 * scene.dispIntensity;
      (scene.cone.material as THREE.ShaderMaterial).uniforms.lightColor.value.copy(
        scene.dispColor,
      );
      scene.pointLight.color.copy(scene.dispColor);
      scene.pointLight.intensity = 6 * scene.dispIntensity;

      (scene.rimBulb.material as THREE.ShaderMaterial).uniforms.lightColor.value.copy(
        scene.dispColor,
      );
      (scene.rimCone.material as THREE.ShaderMaterial).uniforms.lightColor.value.copy(
        scene.dispColor,
      );
      scene.rimPointLight.color.copy(scene.dispColor);

      highlightGrid(scene);
      scene.renderer.render(scene.scene, scene.camera);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      disposeScene(scene);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.tAz = azimuthDeg;
    sceneRef.current.tEl = elevationDeg;
  }, [azimuthDeg, elevationDeg]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.tColor.set(lightColor);
  }, [lightColor]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.tIntensity =
      brightnessPercent <= 10
        ? 0.35
        : brightnessPercent >= 100
          ? 2.2
          : brightnessPercent / 50;
  }, [brightnessPercent]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const view = CAMERA_VIEWS[viewMode];
    sceneRef.current.camPos.copy(view.pos);
    sceneRef.current.camLook.copy(view.lookAt);
  }, [viewMode]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.rimEnabled = rimEnabled;
    sceneRef.current.rimTAz = rimAzimuthDeg;
    sceneRef.current.rimTEl = rimElevationDeg;
  }, [rimAzimuthDeg, rimElevationDeg, rimEnabled]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !imageSrc) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(imageSrc, (texture: THREE.Texture) => {
      if (!sceneRef.current) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.targetFrontMat.map = texture;
      scene.targetFrontMat.color.set(0xffffff);
      scene.targetFrontMat.needsUpdate = true;

      const image = texture.image as HTMLImageElement;
      const aspect = image.width / image.height;
      if (aspect > 1) {
        scene.targetMesh.scale.set(1, 1 / aspect, 1);
      } else {
        scene.targetMesh.scale.set(aspect, 1, 1);
      }
      scene.targetMesh.visible = true;
    });

    return () => {
      if (scene.targetFrontMat.map) {
        scene.targetFrontMat.map.dispose();
        scene.targetFrontMat.map = null;
        scene.targetFrontMat.needsUpdate = true;
      }
    };
  }, [imageSrc]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      const scene = sceneRef.current;
      if (!scene) return;

      let target: "main" | "rim" = "main";
      if (scene.rimEnabled && scene.rimGroup.visible && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        scene.camera.updateMatrixWorld();
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, scene.camera);
        const rimWorldPosition = new THREE.Vector3();
        scene.rimBulb.getWorldPosition(rimWorldPosition);
        if (raycaster.ray.intersectsSphere(new THREE.Sphere(rimWorldPosition, 1.5))) {
          target = "rim";
        }
      }

      scene.dragging = true;
      scene.dragTarget = target;
      setIsDragging(true);
      onDragTargetChange?.(target);

      dragRef.current =
        target === "rim"
          ? {
              sx: event.clientX,
              sy: event.clientY,
              sAz: scene.rimTAz,
              sEl: scene.rimTEl,
            }
          : {
              sx: event.clientX,
              sy: event.clientY,
              sAz: scene.tAz,
              sEl: scene.tEl,
            };
    },
    [onDragTargetChange],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const scene = sceneRef.current;
      if (!scene?.dragging) return;

      const drag = dragRef.current;
      const rawAzimuth = drag.sAz + (event.clientX - drag.sx) * SENSITIVITY;
      const rawElevation = Math.max(
        -90,
        Math.min(90, drag.sEl - (event.clientY - drag.sy) * SENSITIVITY),
      );

      if (scene.dragTarget === "rim") {
        scene.rimTAz = 180;
        scene.rimTEl = Math.max(-45, Math.min(45, rawElevation));
      } else {
        scene.tAz = rawAzimuth;
        scene.tEl = rawElevation;
      }
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (scene.dragTarget === "rim") {
      const preset = findNearestRimPreset(scene.rimTAz, scene.rimTEl);
      const angle = RIM_PRESET_ANGLES[preset];
      scene.rimTAz = angle.azimuthDeg;
      scene.rimTEl = angle.elevationDeg;
      onRimPresetChange?.(preset);
    } else {
      const azimuth = snapMeridian(scene.tAz);
      const elevation = snapParallel(scene.tEl);
      scene.tAz = azimuth;
      scene.tEl = elevation;
      scene.bulbScale = 1.5;
      onAngleChange(azimuth, elevation);
    }

    scene.dragging = false;
    setIsDragging(false);
  }, [onAngleChange, onRimPresetChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex bg-white/5 rounded-lg p-0.5">
        {(["perspective", "front"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={joinClasses(
              "px-3 py-1 text-[11px] font-semibold rounded-md transition-colors uppercase tracking-wider",
              viewMode === mode
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60",
            )}
          >
            {mode === "perspective" ? "透视" : "正面"}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative select-none"
        style={{
          width: SPHERE_SIZE,
          height: SPHERE_SIZE,
          cursor: isDragging ? "grabbing" : "crosshair",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}

export function ImageRelightOverlay({
  imageUrl,
  pending,
  onClose,
  onSubmit,
}: {
  imageUrl: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: CanvasImageToolRequest["lighting"]) => Promise<void>;
}) {
  const [params, setParams] = useState<RelightState>(DEFAULT_PARAMS);
  const [viewMode, setViewMode] = useState<"perspective" | "front">("perspective");
  const textureImageUrl = useMemo(() => getRelightTextureUrl(imageUrl), [imageUrl]);
  const { credits: requiredCredits } = useEstimateCredits(
    "nano-banana-2-image-to-image",
    { resolution: "4k" },
    { enabled: true },
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const updateParams = useCallback(
    (updates: Partial<RelightState>) => {
      setParams((previous) => ({ ...previous, ...updates }));
    },
    [],
  );

  const handleAngleChange = useCallback((azimuthDeg: number, elevationDeg: number) => {
    const matched = findMatchingPreset(azimuthDeg, elevationDeg);
    setParams((previous) => ({
      ...previous,
      angle: {
        preset: matched?.key ?? null,
        azimuthDeg,
        elevationDeg,
      },
      rimEnabled: false,
    }));
  }, []);

  const handlePresetSelect = useCallback((preset: DirectionPreset) => {
    setParams((previous) => ({
      ...previous,
      angle: {
        preset: preset.key,
        azimuthDeg: preset.azimuthDeg,
        elevationDeg: preset.elevationDeg,
      },
      rimEnabled: false,
    }));
  }, []);

  const rimAngle = useMemo(
    () => RIM_PRESET_ANGLES[params.rimPreset],
    [params.rimPreset],
  );

  const lightColor = useMemo(
    () =>
      TEMPERATURE_STOPS.find((stop) => stop.value === params.temperatureK)?.color ??
      "#F3F9FC",
    [params.temperatureK],
  );

  const glowColor = useMemo(() => {
    if (params.temperatureK <= 4000) return "#D5C6AA";
    if (params.temperatureK >= 7000) return "#9EC4F9";
    return "#A6A196";
  }, [params.temperatureK]);

  const handleGenerate = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void onSubmit({
        mode: viewMode,
        anglePreset: params.angle.preset ?? undefined,
        azimuthDeg: params.angle.azimuthDeg,
        elevationDeg: params.angle.elevationDeg,
        brightness: params.brightnessLevel,
        colorTemperature: params.temperatureK,
        mainLight: mapPresetToMainLight(
          params.angle.preset,
          params.angle.azimuthDeg,
          params.angle.elevationDeg,
        ),
      });
    },
    [onSubmit, params, viewMode],
  );

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 pointer-events-auto nodrag shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10"
      style={{ background: "#1F1F1F", borderRadius: 24, padding: 8 }}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white z-10"
      >
        <X className="size-[18px]" />
      </button>

      <div className="flex gap-4">
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: 322, height: 322, background: "#2B2B2B", borderRadius: 16 }}
        >
          <div className="flex flex-col items-center pt-2">
            <LightSphere3D
              azimuthDeg={params.angle.azimuthDeg}
              elevationDeg={params.angle.elevationDeg}
              onAngleChange={handleAngleChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              imageSrc={textureImageUrl}
              lightColor={lightColor}
              brightnessPercent={params.brightnessLevel}
              rimEnabled={false}
              rimAzimuthDeg={rimAngle.azimuthDeg}
              rimElevationDeg={rimAngle.elevationDeg}
              onRimPresetChange={() => {}}
              onDragTargetChange={() => {}}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setParams(DEFAULT_PARAMS);
              setViewMode("perspective");
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
          >
            <Redo2 className="size-3" />
            重置
          </button>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <LightBadge
              label="主光源"
              glowColor={glowColor}
              textColor="#B4B4B4"
            />
          </div>
        </div>

        <div className="flex flex-col pt-1" style={{ width: 246, height: 322 }}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <SectionLabel label="全局" />
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-sm font-semibold text-foreground/[0.48] mb-0.5 block">
                    亮度
                  </span>
                  <SteppedSlider
                    stops={BRIGHTNESS_STOPS}
                    value={params.brightnessLevel}
                    onChange={(nextValue) =>
                      updateParams({ brightnessLevel: nextValue })
                    }
                    icon={<SunMedium className="size-[14px]" />}
                    suffix="%"
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground/[0.48] mb-0.5 block">
                    色温
                  </span>
                  <SteppedSlider
                    stops={TEMPERATURE_STOPS}
                    value={params.temperatureK}
                    onChange={(nextValue) =>
                      updateParams({ temperatureK: nextValue })
                    }
                    trackGradient={TEMPERATURE_GRADIENT}
                    icon={<Thermometer className="size-[14px]" />}
                    suffix="K"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-1">
              <SectionLabel label="主光源" />
              <DirectionPresetGrid
                activePreset={params.angle.preset}
                onSelect={handlePresetSelect}
              />
            </div>

            <div className="h-px bg-border" />
          </div>

          <div className="mt-auto self-end flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-white text-sm font-semibold">
              <span className="tapnow-image-mask-submit-token" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span>{requiredCredits ?? "--"}</span>
            </span>
            <button
              type="button"
              disabled={pending || !imageUrl}
              onClick={handleGenerate}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_16px_30px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-px disabled:opacity-60 disabled:translate-y-0"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
