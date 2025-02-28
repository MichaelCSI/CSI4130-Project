import * as THREE from "three";
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { GUI } from "dat.gui";

var camera;
// initialization of Three.js
function init() {
	var container = document.createElement("div");
	document.body.appendChild(container);
	const renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0x333333));
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// All drawing will be organized in a scene graph
	var scene = new THREE.Scene();

	// show axes at the origin
	var axes = new THREE.AxesHelper(10);
	scene.add(axes);

	// Solar system group
	var solar = new THREE.Group();
	scene.add(solar);
	// sun is a child
	var faceMaterial = new THREE.MeshBasicMaterial({ color: "yellow" });
	var sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
	var sun = new THREE.Mesh(sphereGeometry, faceMaterial);
	// position the sun - center
	sun.position.set(0, 0, 0);
	// add the sun to the scene
	solar.add(sun);

	// earth and group
	var earthRotGroup = new THREE.Group();
	solar.add(earthRotGroup);
	var earthGroup = new THREE.Group();
	earthGroup.position.set(15, 0, 0);
	earthRotGroup.add(earthGroup);

	var faceMaterial_earth = new THREE.MeshBasicMaterial({ color: "blue" });
	var sphereGeometry_earth = new THREE.SphereGeometry(2, 8, 8);
	var earth = new THREE.Mesh(sphereGeometry_earth, faceMaterial_earth);
	// add the earth to the scene
	earthGroup.add(earth);

	// Adding teapot to the earth
	// var teapotGeometry = new THREE.TeapotBufferGeometry(1, 15, true, true, true, false, false);
	var teapotGeometry = new TeapotGeometry(1, 15, true, true, true, false, false);
	var teapot = new THREE.Mesh(teapotGeometry, new THREE.MeshBasicMaterial({ color: "pink" }));
	// Set position on top of earth
	teapot.position.set(0, 3, 0);
	earthGroup.add(teapot);

	// saturn and group
	var saturnRotGroup = new THREE.Group();
	solar.add(saturnRotGroup);
	var saturnGroup = new THREE.Group();
	// position the saturn relative to sun but offset 30deg rel to earth
	saturnGroup.position.set(35 * Math.cos(Math.PI / 6), 35 * Math.sin(Math.PI / 6), 0);
	saturnRotGroup.add(saturnGroup);

	var faceMaterial_saturn = new THREE.MeshBasicMaterial({
		color: "saddlebrown",
	});
	var sphereGeometry_saturn = new THREE.SphereGeometry(3, 16, 16);
	var saturn = new THREE.Mesh(sphereGeometry_saturn, faceMaterial_saturn);
	// add the saturn to the sun - saturn rotates around sun
	saturnGroup.add(saturn);

	// Adding a ring around saturn
	var torusGeometry = new THREE.TorusGeometry(4, 0.5, 32, 16);
	var torus = new THREE.Mesh(torusGeometry, new THREE.MeshBasicMaterial({ color: "dimgray" }));
	// scale
	torus.scale.z = 0.1;
	saturnGroup.add(torus); // as torus should rotate with saturn

	// Create Moon with 15 deg offest to torus ring
	var faceMaterial_moon = new THREE.MeshBasicMaterial({ color: "wheat" });
	var sphereGeometry_moon = new THREE.SphereGeometry(0.5, 8, 8);
	var moon = new THREE.Mesh(sphereGeometry_moon, faceMaterial_moon);

	moon.position.set(6 * Math.cos(Math.PI / 12), 6 * Math.sin(Math.PI / 12), 0);
	saturnGroup.add(moon);

	// need a camera to look at things
	// calcaulate aspectRatio
	var aspectRatio = window.innerWidth / window.innerHeight;
	var width = 20;
	// Camera needs to be global
	camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
	// position the camera back and point to the center of the scene
	camera.position.z = 100;
	camera.lookAt(scene.position);

	// render the scene
	renderer.render(scene, camera);

	//declared once at the top of your code
	var camera_axis = new THREE.Vector3(-30, 30, 30).normalize(); // viewing axis

	// setup the control gui
	var controls = new (function () {
		this.speed = -10;
		this.redraw = function () {};
	})();

	var gui = new GUI();
	gui.add(controls, "speed", -15, -1).onChange(controls.redraw);
	render();

	function render() {
		// render using requestAnimationFrame - register function
		requestAnimationFrame(render);
		var speed = 2 ** controls.speed;
		// earth group rotates arond sun
		earthRotGroup.rotation.z = (earthRotGroup.rotation.z + 3 * speed) % (2.0 * Math.PI);
		// Teapot has to compensate to stay on top of earth
		earthGroup.rotation.z = (earthGroup.rotation.z - 3 * speed) % (2.0 * Math.PI);
		// saturn group rotates arond sun
		saturnRotGroup.rotation.z = (saturnRotGroup.rotation.z + speed) % (2.0 * Math.PI);
		// saturn ring and moon rotate around saturn
		saturnGroup.rotation.x = (saturnGroup.rotation.x + 5 * speed) % (2.0 * Math.PI);
		saturnGroup.rotation.y = (saturnGroup.rotation.y + 5 * speed) % (2.0 * Math.PI);

		renderer.render(scene, camera);
	}
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// If we use a canvas then we also have to worry of resizing it
	renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = init;

// register our resize event function
window.addEventListener("resize", onResize, true);
