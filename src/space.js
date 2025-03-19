import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createGalaxy, galaxyParameters } from './galaxy.js';
import { toggleAudio } from "./music.js";
import { updateBackground, animateWater } from "./locations.js";

var camera, scene, renderer;
const animateMixers = [];
const clock = new THREE.Clock();

var menuButtons, monitor;
var sun;
var planetScene, planets;

var currentBackground = "space";

function loadModels(cameraPosition) {
    const loader = new GLTFLoader();

    // Sun
    loader.load('./models/sun.glb', function (gltf) {
        console.log("Loaded Sun", gltf);
        sun = gltf.scene;
        sun.scale.set(0.5, 0.5, 0.5);
        let sunMesh = sun.children[0].children[0].children[0].children[0].children[0].children[0];
        sunMesh.material.emissive = new THREE.Color(0xFFA500);
        sunMesh.material.emissiveIntensity = 200;
        scene.add(sun);

        // Add a PointLight at the Sun's position
        const sunLight = new THREE.PointLight(0xFFA500, 5000, 1000);
        scene.add(sunLight);
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
    });

    // Planets orbitting sun
    loader.load('./models/various_planets.glb', function (gltf) {		
        planetScene = gltf.scene;
		// Get planet list don't show gas planets (they look kinda funny)
        planets = planetScene.children[0].children[0].children[0].children;
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
		scene.add(planetScene);

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

    // Our main ship window
    loader.load('./models/scifi_wall_with_window.glb', function (gltf) {
        console.log("Loaded Window", gltf);
        
        let window = gltf.scene.children[0];

        // Create a parent object to hold the mesh and center it (initial rotation axis was weird)
        const wrapper = new THREE.Group();
        wrapper.add(window);

        // Apply transformations to the wrapper
        wrapper.rotation.set(0.05, Math.PI / 2.32, -0.1);
        wrapper.scale.set(0.45, 0.45, 0.45)
        wrapper.position.set(cameraPosition.x + 0.5, cameraPosition.y - 1.6, cameraPosition.z - 2);
        scene.add(wrapper);

        // Add lights on floor facing our window
        [2, -2].forEach(xOffset => {
            const spotLight = new THREE.SpotLight(0xffffff, 20, 10, Math.PI / 2, 0.1, 2);
            spotLight.position.set(
                wrapper.position.x + xOffset,
                wrapper.position.y,
                wrapper.position.z + 1
            );
            spotLight.target.position.set(
                wrapper.position.x,
                wrapper.position.y,
                wrapper.position.z
            );
            scene.add(spotLight);
            scene.add(spotLight.target);
        });
    }, undefined, function (error) {
        console.error("Error loading Window:", error);
    });


    // Glowing blue file icon on bottom left monitor
    loader.load('./models/sci_fi_monitor.glb', function (gltf) {
        console.log("Loaded Monitor (animation)", gltf);
        let monitor = gltf.scene;
        monitor.scale.set(1.5, 1.1, 1.2);
        monitor.rotation.set(-0.2, 0, -0.01);
        monitor.position.set(cameraPosition.x - 0.36, cameraPosition.y - 0.45, cameraPosition.z - 1.2);
        scene.add(monitor);

        // Add stronger emission to monitor animation
        monitor.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                if (obj.material.emissive) {
                    obj.material.emissiveIntensity = 5;
                }
            }
        });
        
        // Minor animation included with the icon
        const mixer = new THREE.AnimationMixer(monitor);
		gltf.animations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.play();
		});
		animateMixers.push(mixer);
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
    });

    // Bottom left monitor with wires
    loader.load('./models/futuristic_screen.glb', function (gltf) {
        console.log("Loaded Wired Monitor", gltf);
        let monitor = gltf.scene;
        monitor.rotation.set(0, -Math.PI / 2, 0);
        monitor.scale.set(0.2, 0.2, 0.2)
        monitor.position.set(cameraPosition.x - 0.5, cameraPosition.y - 1.5, cameraPosition.z - 2);
        scene.add(monitor);
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
    });

    // Top monitor for menu buttons
    loader.load('./models/hanging_monitor.glb', function (gltf) {
        console.log("Loaded Menu Monitor", gltf);
        monitor = gltf.scene;
        monitor.rotation.set(-0.2, -0.05, -0.005);
        monitor.scale.set(2.5, 1, 1)
        monitor.position.set(cameraPosition.x + 0.44, cameraPosition.y + 0.02, cameraPosition.z - 1.5);    
        scene.add(monitor);
        monitor.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                console.log(obj.material)
            }
        });
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
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

    // Set up scene with space background cube texture
	scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
	.setPath( './images/cubemap/' )
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
        0.2,
        0.5,
        0.8
    );
    composer.addPass(bloomPass);
    renderer.render(scene, camera);

    // Load models
	loadModels(camera.position);

    // Create background particle galaxy
    let lineParticles = createGalaxy(scene, 1, 5, 0.2);
    lineParticles.position.set(15, -15, -50);
    lineParticles.rotation.x = - Math.PI / 15;

    // Action buttons
    menuButtons = {
        button1: document.querySelector('.button1'),
        button2: document.querySelector('.button2'),
        travelButton: document.querySelector('.button3'),
        audioButton: document.querySelector('.button4')
    };

    // Button functionality
    menuButtons.button1.onclick = () => {
        console.log(`Button 1 clicked!`);
        // Add your custom logic here or in another function/file
    };
    menuButtons.button2.onclick = () => {
        console.log(`Button 2 clicked!`);
        // Add your custom logic here or in another function/file
    };

    // Travel button (go do different locations)
    const waterLocation = menuButtons.travelButton.querySelector('.water');
    waterLocation.onclick = () => {
        updateBackground(currentBackground, "water", scene, camera);
        currentBackground = "water";
        scene.remove(planetScene);
    }
    const treeLocation = menuButtons.travelButton.querySelector('.tree');
    treeLocation.onclick = () => {
        updateBackground(currentBackground, "tree", scene, camera);
        currentBackground = "tree";
        scene.remove(planetScene);
    }
    const fireLocation = menuButtons.travelButton.querySelector('.fire');
    fireLocation.onclick = () => {
        updateBackground(currentBackground, "fire", scene, camera);
        currentBackground = "fire";
        scene.remove(planetScene);
    }
    const spaceLocation = menuButtons.travelButton.querySelector('.space');
    spaceLocation.onclick = () => {
        updateBackground(currentBackground, "space", scene, camera);
        currentBackground = "space";
        scene.add(planetScene);
    }

    const volumeIcon = menuButtons.audioButton.querySelector('.audio');
    volumeIcon.onclick = () => {
        toggleAudio(volumeIcon);
    }


    let elapsedTime = 0;
	render();
	function render() {
		const delta = clock.getDelta();
        elapsedTime += delta;

        // If sun and planets loaded, handle updates
        if(sun && planets) {
            // Each planet has an atmospheric animation, update it
            animateMixers.forEach((mixer) => mixer.update(delta * 0.1));

            // Update background galaxy (gradual rotation)
            lineParticles.rotation.y += galaxyParameters.rotationVelocity * 0.00001;

            // Update planetary orbits
            for(let i = 0; i < planets.length; i++) {
                let orbitRadius = planets[i].orbitRadius;
                let orbitSpeed = Math.sqrt(10 * planets[i].size / orbitRadius)
                planets[i].position.x = Math.cos(0.1 * orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
                planets[i].position.z = Math.sin(0.1 * orbitSpeed * elapsedTime + i * 2 * Math.PI / planets.length) * orbitRadius;
            }
            // Rotation and added bloom gives fluctuating effect on sun
            sun.rotation.y -= 0.1 * delta / 25;
        }

        // Update water scene (time uniform to animate water)
        if(currentBackground.localeCompare("water") == 0) {
            animateWater(elapsedTime);
        }

        // Render
        composer.render();
		requestAnimationFrame(render);
	}
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = init;

// register our resize event function
window.addEventListener("resize", onResize, true);
