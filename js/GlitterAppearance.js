import * as THREE from "three";

// TO Who Writes Code Here
// Better try receiving light, which implemented in lights.js
// As for now, the shining effect is only a simple product with view dir
// Now, the effects not fit the lighting effect of other models verywell(if you see the rendered result, you may find a little weird)

export function createGlitterMaterial(options = {}) {
  const color = options.color || new THREE.Color(0xffffff);
  const brightness =
    options.brightness !== undefined ? options.brightness : 1.0;

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: color },
      brightness: { value: brightness },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float brightness;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Anisotropic sparkle
        float spec = max(0.0, dot(normal, viewDir));
        
        // Use brightness to calculate sharpness/intensity
        // Higher brightness = sharper and brighter flashes
        float flash = pow(spec, 20.0) * brightness;
        
        vec3 finalColor = mix(color * 0.5, vec3(1.0), flash);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    // Must be opaque (transparent: false) so that it renders in the Opaque Pass.
    // The GlobeGlass uses 'transmission', which only refracts objects rendered in the background (opaque) pass.
    transparent: false,
    depthWrite: true,
  });
}
