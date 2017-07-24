const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);

const canvas = document.querySelector('#three-mount');
const { width, height } = canvas.getBoundingClientRect();
const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setSize(width, height);
renderer.setClearColor(new THREE.Color().setRGB(0, 0, 0));

const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
camera.position.z = 5;

const controls = new OrbitControls(camera, canvas);

const mesh = new THREE.Mesh(
  new THREE.CubeGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial(),
);

const scene = new THREE.Scene();

scene.add(camera);
scene.add(mesh);

function run() {
  requestAnimationFrame(run);
  renderer.render(scene, camera);
}

run();
