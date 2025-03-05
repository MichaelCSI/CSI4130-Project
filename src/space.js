import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

var camera, scene, renderer;
const animateMixers = [];

var sun;
var planets = [];

function loadPlanets() {
    const loader = new GLTFLoader();

    loader.load('./models/sun.glb', function (gltf) {
        console.log("Loaded Sun", gltf);
        sun = gltf.scene;
        sun.scale.set(0.5, 0.5, 0.5);
        let sunMesh = sun.children[0].children[0].children[0].children[0].children[0].children[0];
        sunMesh.material.emissive = new THREE.Color(0xFFA500);
        sunMesh.material.emissiveIntensity = 60;
        scene.add(sun)

        // Add a PointLight at the Sun's position
        const sunLight = new THREE.PointLight(0xFFA500, 5000, 1000);
        scene.add(sunLight);
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
    });

    loader.load('./models/various_planets.glb', function (gltf) {		
		// Get planet list don't show gas planets (they look kinda funny)
        planets = gltf.scene.children[0].children[0].children[0].children;
        planets = planets.filter(planet => !["gas", "cloud"].some(keyword => planet.name.includes(keyword)));
        console.log("Loaded planets: ", planets)
        // 5 Planets, we can do 5 positions along circle
		for(let i = 0; i < planets.length; i++) {
            // Make every other "planet" a moon for the previous planet
			let planet = planets[i];
            let size = i * 0.3;
            planet.scale.set(size, size, size);
            planet.size = size;
            planet.orbitRadius = (i % 3 + 1) * 10;
		}
		scene.add(gltf.scene)

		const mixer = new THREE.AnimationMixer(gltf.scene);
		gltf.animations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.play();
		});

		// Update the mixer in the animation loop
		animateMixers.push(mixer);
    }, undefined, function (error) {
        console.error("Error loading Planets:", error);
    });
}

const galaxyParameters = {};
galaxyParameters.count = 5_000;
galaxyParameters.size = 0.01;
galaxyParameters.radius = 60;
galaxyParameters.branches = 3;
galaxyParameters.spin = 1.2;
galaxyParameters.rotationVelocity = 0.4;
galaxyParameters.randomnessPower = 3;
galaxyParameters.spiralHeight = 0;
galaxyParameters.insideColor = '#ffffff';
galaxyParameters.outsideColor = '#ffffff';

function createGalaxy(scaleX, scaleY, scaleZ) {
    let particlesGeometry = new THREE.BufferGeometry()
    let particlesMaterial = new THREE.PointsMaterial({
        size: galaxyParameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    // X, Y, X for position and R, G, B for colors (* 3)
    const positions = new Float32Array(galaxyParameters.count * 3);
    const colors = new Float32Array(galaxyParameters.count * 3);

    const colorInside = new THREE.Color(galaxyParameters.insideColor);
    const colorOutside = new THREE.Color(galaxyParameters.outsideColor);

    // For each particle...
    for(let i = 0; i < galaxyParameters.count; i++){
        const i3 = i * 3

        // PARTICLE POSITION - Spread particles randomly around spiraling branches
        
        // Radius of the galaxy - length of branches, particles appear randomly along branches
        const radius = Math.random() * galaxyParameters.radius;
        
        // Angle of the current spiraling galaxy branch
        const branchAngle = (i % galaxyParameters.branches) / galaxyParameters.branches * Math.PI * 2;
        // Angle away from branch based on spin parameter
        const spinAngle = radius * galaxyParameters.spin;

        // Higher randomnessPower = denser around branches, distribute them across both sides (+/-) of axis
        const randomX = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        // Scale Y when we want a broader galaxy star system rather than say a spiral milky way kinda thing
        const randomY = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

        // X, Y, Z ... Use cos/sin to form circle based on angles/radius/random offset
        positions[i3] = scaleX * Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = scaleY * randomY + radius * galaxyParameters.spiralHeight + 3;
        positions[i3 + 2] = scaleZ * Math.sin(branchAngle + spinAngle) * radius + randomZ;


        // PARTICLE COLOR

        // Clone so we don't change original color
        const mixedColor = colorInside.clone();
        // Linearly interpolate colors based on proximity of current particle to radius
        mixedColor.lerp(colorOutside, radius / galaxyParameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    let particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    return particles;
}

// initialization of Three.js
function init() {
	var container = document.createElement("div");
	document.body.appendChild(container);
	
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0x000000));
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// All drawing will be organized in a scene graph
	scene = new THREE.Scene();
	// scene.background = new THREE.Color( 0x000000 );
    scene.background = new THREE.CubeTextureLoader()
	.setPath( './images/' )
	.load( [
				'px.png',
				'nx.png',
				'py.png',
				'ny.png',
				'pz.png',
				'nz.png'
			] );

	var aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
	camera.position.set(-10, 10, 40);
	camera.lookAt(scene.position);

    // Create the effect composer
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2,
        0.4,
        0.85
    );
    composer.addPass(bloomPass);

	const orbitControls = new OrbitControls( camera, renderer.domElement );

	loadPlanets();
    let lineParticles = createGalaxy(1, 5, 0.2);
    lineParticles.position.set(15, -15, -50);
    lineParticles.rotation.x = - Math.PI / 15;

	// render the scene
	renderer.render(scene, camera);

    let elapsedTime = 0;
	render();
	function render() {
		// render using requestAnimationFrame - register function
		requestAnimationFrame(render);

		const delta = clock.getDelta() * 0.1;
        elapsedTime += delta;

		animateMixers.forEach((mixer) => mixer.update(delta));

        lineParticles.rotation.y += galaxyParameters.rotationVelocity * 0.00001;

        for(let i = 0; i < planets.length; i++) {
            let orbitRadius = planets[i].orbitRadius;
            let orbitSpeed = Math.sqrt(20 * planets[i].size / orbitRadius)
            planets[i].position.x = Math.cos(orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
            planets[i].position.z = Math.sin(orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
        }

        // Rotation and added bloom gives fluctuating effect
        sun.rotation.y -= delta / 25;
	
		orbitControls.update();

        composer.render();
	}
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();
window.onload = init;

// register our resize event function
window.addEventListener("resize", onResize, true);
