import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";

var camera, scene, renderer;
const animateMixers = [];

var planets = [];

function loadPlanets() {
    const loader = new GLTFLoader();

    loader.load('./models/sun.glb', function (gltf) {
        console.log("Loaded Sun", gltf);
        // gltf.scene.position.set(-10, 0, 0);
        gltf.scene.scale.set(0.5, 0.5, 0.5);
        scene.add(gltf.scene)

        // Add a PointLight at the Sun's position
        const sunLight = new THREE.PointLight(0xffffaa, 1000, 1000);
        scene.add(sunLight);
    }, undefined, function (error) {
        console.error("Error loading Sun:", error);
    });

    loader.load('./models/various_planets.glb', function (gltf) {		
		// Get individual planets and filter ones that do not have quaternion property for animation
		planets = gltf.scene.children[0].children[0].children[0].children;
		console.log("Loaded Planets from model", gltf, planets);

        // 5 Planets, we can do 5 positions along circle
		for(let i = 0; i < planets.length; i+= 2) {
            // Make every other "planet" a moon for the previous planet
			let planet = planets[i];
            let moon = planets[i+1];
            planet.scale.set(1.5, 1.5, 1.5);
            moon.position.set(i * 5 + 1, 2, 0);
            moon.scale.set(0.1, 0.1, 0.1);
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



// Spiral galaxies (space is the big, background one, spiral is the mini galaxy)
var spaceParticles;
var spiralParticles;

const galaxyParameters = {};
galaxyParameters.count = 5_000;
galaxyParameters.size = 0.01;
galaxyParameters.radius = 40;
galaxyParameters.branches = 3;
galaxyParameters.spin = 1.2;
galaxyParameters.rotationVelocity = 0.4;
galaxyParameters.randomnessPower = 3;
// galaxyParameters.spiralHeight = 0.5;
galaxyParameters.spiralHeight = 0;
galaxyParameters.insideColor = '#1b3984';
galaxyParameters.outsideColor = '#ffffff';

function createGalaxy(scaleY) {
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
        const randomY = scaleY ? 
            Math.pow(Math.random() * 20, 1) * (Math.random() < 0.5 ? 1 : -1)
            :
            Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

        // X, Y, Z ... Use cos/sin to form circle based on angles/radius/random offset
        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY + radius * galaxyParameters.spiralHeight + 3;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;


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
	scene.background = new THREE.Color( 0x000000 );

	var aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
	camera.position.z = 40;
	camera.lookAt(scene.position);

	const orbitControls = new OrbitControls( camera, renderer.domElement );

	loadPlanets();
    spaceParticles = createGalaxy(true);
    galaxyParameters.count = 5_000;
    galaxyParameters.radius = 8;
    galaxyParameters.outsideColor = '#bf40bf'
    galaxyParameters.randomnessPower = 5
    spiralParticles = createGalaxy(false);
    spiralParticles.position.set(30, -5, -20);
    spiralParticles.rotation.x = Math.PI / 8;
    spiralParticles.rotation.z = Math.PI / 8;

	// render the scene
	renderer.render(scene, camera);

	// Setup the control gui
	// var controlsGUI = new (function () {
	// 	this.cameraZ = 1;
	// 	this.redraw = function () {
	// 		camera.position.z = this.cameraZ;
	// 		camera.updateWorldMatrix();
	// 	};
	// })();

	// var gui = new GUI();
	// gui.add(controlsGUI, "cameraZ", 40, 50).onChange(controls.redraw);
    
    let elapsedTime = 0;
	render();
	function render() {
		// render using requestAnimationFrame - register function
		requestAnimationFrame(render);

		const delta = clock.getDelta() * 0.1;
        elapsedTime += delta;

		animateMixers.forEach((mixer) => mixer.update(delta));

        spaceParticles.rotation.y += galaxyParameters.rotationVelocity * 0.0001;
        spiralParticles.rotation.y += galaxyParameters.rotationVelocity * 0.001;

        for(let i = 0; i < planets.length; i++) {
            planets[i].position.x = Math.cos(elapsedTime + i * 2 * Math.PI / planets.length) * 10;
            planets[i].position.z = Math.sin(elapsedTime + i * 2 * Math.PI / planets.length) * 10;
        }
	
		orbitControls.update();

		renderer.render(scene, camera);
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
