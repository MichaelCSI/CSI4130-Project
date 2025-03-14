import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createGalaxy, galaxyParameters } from './galaxy.js';

var camera, scene, renderer;
const animateMixers = [];
const clock = new THREE.Clock();

var menuButtons;
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

function loadSpaceShip(cameraPosition) {
    const loader = new GLTFLoader();

    loader.load('./models/sci-fi_spaceship_corridor.glb', function (gltf) {
        console.log("Loaded Ship", gltf);
        let ship = gltf.scene.children[0];
        ship.scale.set(0.3, 0.3, 0.3);
        ship.rotation.set(Math.PI / 2.3, Math.PI * 0.99, -Math.PI / 14)
        ship.position.set(cameraPosition.x + 0.2, cameraPosition.y - 0.5, cameraPosition.z);
        scene.add(ship)
    }, undefined, function (error) {
        console.error("Error loading ship:", error);
    });
}

// initialization of Three.js
function init() {
	var container = document.createElement("div");
	document.body.appendChild(container);
	
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0x000000));
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	scene = new THREE.Scene();
    // Set space background cube texture
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

    // Load sun/planets
	loadPlanets();
    // Load spaceship (glass window and background ship)
    loadSpaceShip(camera.position);
    // Create background particle galaxy
    let lineParticles = createGalaxy(scene, 1, 5, 0.2);
    lineParticles.position.set(15, -15, -50);
    lineParticles.rotation.x = - Math.PI / 15;

	// Render the scene
	renderer.render(scene, camera);
        // Action buttons
        menuButtons = [
            {
                position: camera.position.clone().add(new THREE.Vector3(-0.6, 0.2, -1)),
                element: document.querySelector('.button1')
            },
            {
                position: camera.position.clone().add(new THREE.Vector3(-0.4, 0.25, -1)),
                element: document.querySelector('.button2')
            },
            {
                position: camera.position.clone().add(new THREE.Vector3(-0.5, 0, -1)),
                element: document.querySelector('.button3')
            }
        ];
        // Button positioning
        updateButtonPositions();
        // Button functionality
        menuButtons[0].element.onclick = () => {
            console.log(`Button 1 clicked!`);
            // Add your custom logic here or in another function/file
        };
        menuButtons[1].element.onclick = () => {
            console.log(`Button 2 clicked!`);
            // Add your custom logic here or in another function/file
        };
        menuButtons[2].element.onclick = () => {
            console.log(`Button 3 clicked!`);
            // Add your custom logic here or in another function/file
        };

    let elapsedTime = 0;
	render();
	function render() {
		const delta = clock.getDelta() * 0.1;
        elapsedTime += delta;

        // If sun and planets loaded, handle updates
        if(sun && planets) {
            // Each planet has an atmospheric animation, update it
            animateMixers.forEach((mixer) => mixer.update(delta));

            // Update background galaxy (gradual rotation)
            lineParticles.rotation.y += galaxyParameters.rotationVelocity * 0.00001;

            // Update planetary orbits
            for(let i = 0; i < planets.length; i++) {
                let orbitRadius = planets[i].orbitRadius;
                let orbitSpeed = Math.sqrt(20 * planets[i].size / orbitRadius)
                planets[i].position.x = Math.cos(orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
                planets[i].position.z = Math.sin(orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
            }
            // Rotation and added bloom gives fluctuating effect on sun
            sun.rotation.y -= delta / 25;
        }

        composer.render();
		requestAnimationFrame(render);
	}
}

function updateButtonPositions() {
    menuButtons.forEach(button => {
        const screenPosition = button.position.clone();
        screenPosition.project(camera);

        const translateX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const translateY = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
        
        button.element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
    updateButtonPositions();
}

window.onload = init;

// register our resize event function
window.addEventListener("resize", onResize, true);
