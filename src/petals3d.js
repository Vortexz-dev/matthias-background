import {
  AmbientLight, BufferAttribute, BufferGeometry, Color, DirectionalLight,
  DoubleSide, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';

function petalMesh() {
  const positions = [];
  const colors = [];
  const indices = [];
  const rows = 16;
  const columns = 10;
  const base = new Color('#a76580');
  const edge = new Color('#f4cad8');
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const width = .024 + Math.sin(Math.PI * t ** 1.25) * .31;
    for (let column = 0; column <= columns; column++) {
      const u = (column / columns) * 2 - 1;
      positions.push(u * width + .1 * t ** 2, t - .5, .25 * t ** 2 + .21 * u ** 2 * Math.sin(Math.PI * t));
      const color = base.clone().lerp(edge, t * .66 + Math.abs(u) * .31);
      colors.push(color.r, color.g, color.b);
      if (!row || !column) continue;
      const vertex = row * (columns + 1) + column;
      indices.push(vertex, vertex - 1, vertex - columns - 2, vertex, vertex - columns - 2, vertex - columns - 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createPetals() {
  const canvas = document.createElement('canvas');
  const options = { alpha: true, antialias: true, powerPreference: 'low-power' };
  const context = canvas.getContext('webgl2', options);
  if (!context) throw new Error('WebGL2 unavailable');
  const renderer = new WebGLRenderer({ canvas, context, ...options });
  canvas.className = 'weather weather--front weather--petals';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  document.body.append(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, .1, 45);
  camera.position.z = 12;
  scene.add(new AmbientLight(0xffe6ec, 1.8));
  const key = new DirectionalLight(0xffeeee, 2.1);
  key.position.set(-4, 5, 3);
  scene.add(key);
  const geometry = petalMesh();
  const petals = Array.from({ length: 6 }, () => {
    const material = new MeshStandardMaterial({ side: DoubleSide, vertexColors: true, roughness: .78, transparent: true, depthWrite: false });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
  });
  let visible = false;

  return {
    lost: () => renderer.getContext().isContextLost(),
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    draw(time, amount, intro) {
      if (this.lost()) {
        canvas.hidden = true;
        return;
      }
      if (amount < .03) {
        if (visible) canvas.hidden = true;
        visible = false;
        return;
      }
      canvas.hidden = false;
      visible = true;
      for (const [index, mesh] of petals.entries()) {
        const strength = Math.min(1, Math.max(0, amount - index));
        mesh.visible = strength > .02;
        if (!mesh.visible) continue;
        const wave = time * (.42 + index * .048) + index * 1.38;
        const y = 4.9 - ((time * (.37 + index * .05) + index * 2.59) % 9.8);
        const z = 1.2 + index * .78 + Math.sin(wave * .6) * .75;
        const x = Math.sin(index * 2.2 + .58) * camera.aspect * (3 - index * .15);
        mesh.position.set(x + Math.sin(wave) * (.31 + index * .09), y, z);
        mesh.rotation.set(wave * .65, wave * .71, wave * .53);
        mesh.scale.setScalar((.2 + index * .037) * (1 - intro * .25));
        mesh.material.opacity = strength * Math.min(.54, (4.9 - Math.abs(y)) * .27);
      }
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      petals.forEach((mesh) => mesh.material.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
