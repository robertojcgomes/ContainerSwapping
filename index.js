import * as THREE from 'three';
        
import Stats from 'three/addons/libs/stats.module.js';

import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let canvas, camera, scene, bgTexture, logoEnvMap, renderer, stats;
let glassMaterial, iridescenceMetal, iridescenceGlass, img1, img2, img3;
let autoRotate = false;
let width, height;

const scenes = [];

init();
animate();

function init() {

    canvas = document.getElementById('c');

    stats = new Stats();
    statsContainer.appendChild(stats.dom);

    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 12, 8),
        new THREE.DodecahedronGeometry(0.5),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
    ];

    const content = document.getElementById('content');

    bgTexture = new EXRLoader().load('examples/textures/cloudy_sky.exr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
    });

    logoEnvMap = new EXRLoader().load('examples/textures/cloudy_sky3.exr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
    });

    img1 = new THREE.TextureLoader().load('examples/textures/cerveau.jpg');
    img1.encoding = THREE.sRGBEncoding;
    img2 = new THREE.TextureLoader().load('examples/textures/audermars.png');
    img2.encoding = THREE.sRGBEncoding;
    img3 = new THREE.TextureLoader().load('examples/textures/Dior_fullsize.png');
    img3.encoding = THREE.sRGBEncoding;

    const imgs = [img1,img2,img3,img1,img2,img3];

    // Glass Material
    glassMaterial = new THREE.MeshPhysicalMaterial({
        envMap: logoEnvMap,
        transparent: true,
        color: 0xffffff,
        transmission: 1,
        opacity: 1,
        metalness: 0.2,
        roughness: 0,
        thickness: 0.2,
        iridescence: 0
    });
    // Iridescence Metal
    iridescenceMetal = new THREE.MeshPhysicalMaterial({
        envMap: bgTexture,
        //envMap: logoEnvMap,			
        //reflectivity: 1.2,
        roughness: 0.1,
        metalness: 0.98,
        emissive: 0,
        iridescence: 1,
        iridescenceIOR: 1.94,
        iridescenceThicknessRange: [100, 400]
    });
    // Iridescence Glass
    iridescenceGlass = new THREE.MeshPhysicalMaterial({
        envMap: logoEnvMap,
        reflectivity: 1.2,
        roughness: 0,
        metalness: 1,
        iridescence: 1,
        transmission: 0.7,
        thickness: 40,
        opacity: 1,
        transparent: true,
        side: THREE.DoubleSide,
        emissive: 1,
        iridescenceIOR: 1.94,
        iridescenceThicknessRange: [100, 400],
        //forceSinglePass: true
    });

    for (let i = 1; i < 7; i++) {

        const scene = new THREE.Scene();
        scene.environment = bgTexture;

        // make a list item
        const element = document.createElement('div');
        if (i % 2 == 0) {
            element.className = 'element even';
        } else {
            element.className = 'element odd';
        }
        element.innerHTML = '<h2>Element ' + i + '</h2><p>This is some text in a div element.</p>';

        scene.userData.element = element;
        content.appendChild(element);
        
        const camera = new THREE.PerspectiveCamera(55, element.offsetWidth / element.offsetHeight, 1, 1000);
        camera.position.z = 4;
        scene.userData.camera = camera;

        // Medaillon
        let displayCase;
        let card;

        new GLTFLoader()
            .setPath('examples/models/gltf/')
            .setDRACOLoader(new DRACOLoader().setDecoderPath('jsm/libs/draco/gltf/'))
            .load('medaillon_WebGL02.glb', function (gltf) {

                displayCase = gltf.scene;
                displayCase.getObjectByName('DisplayCase_1').material = iridescenceMetal;
                //displayCase.getObjectByName('DisplayCase_3').material = glassMaterial;

                card = displayCase.getObjectByName('DisplayCase_2');
                card.material.emissiveMap = imgs[i-1];
                card.material.emissiveMap.flipY = false;

                scene.add(displayCase);
                scene.userData.displayCase = displayCase;
            });


        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(-.45, 0, 1).normalize();
        scene.add(light);

        const light2 = new THREE.DirectionalLight(0xffffff, 10);
        light2.position.set(1, .5, 0).normalize();
        scene.add(light2);

        scenes.push(scene);
    }

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
}

function updateSize() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {

        renderer.setSize(width, height, false);

    }
}

function animate() {

    stats.update();

    render();
    requestAnimationFrame(animate);
}

function render() {

    updateSize();

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor(0xffffff, 0);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xffffff, 0);
    renderer.setScissorTest(true);

    scenes.forEach(function (scene) {

        // so something moves
        const displayCase = scene.userData.displayCase;
        if (displayCase != null){
            displayCase.rotation.y -= 0.02;
        }

        // get the element that is a place holder for where we want to draw the scene
        const element = scene.userData.element;

        // get its position relative to the page's viewport
        const rect = element.getBoundingClientRect();

        // check if it's offscreen. If so skip it
        if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > renderer.domElement.clientWidth) {

            return; // it's off screen
        }

        // set the viewport
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        const camera = scene.userData.camera;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
    });
}