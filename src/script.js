import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import fragmentShader from './shader/fragment.glsl'
import vertexShader from './shader/vertex.glsl'
import nietzsche from './img/nietzsche.jpg'
console.log(nietzsche)
import gsap from 'gsap'
import * as dat from 'dat.gui'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AberrationShader } from './shader/customPass.js'
const canvas = document.querySelector('.webgl')

class NewScene{
    constructor(){
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
        this.clock = new THREE.Clock()
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.point = new THREE.Vector2()
        this.InitTexture()
        this.InitImgShader()
        this.InitSettings()
        this.InitCamera()
        this.InitLights()
        this.InitRenderer()
        this.InitPostProcessing()
        //this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
        window.addEventListener('wheel', (e) => {
            //console.log(e.wheelDeltaY)
            this.move += e.wheelDeltaY/100 
        })

        window.addEventListener('mouseover', (e) => {
            gsap.to(this.material.uniforms.u_mousePressed, {
                duration: 0.5,
                value: 1,
                ease: "sine.out"
            })
        })

        window.addEventListener('mouseup', (e) => {
            gsap.to(this.material.uniforms.u_mousePressed, {
                duration: 0.5,
                value: 0,
                ease: "sine.out"
            })
        })

        window.addEventListener('mousemove', (e) => {
            this.test = new THREE.Mesh(
                new THREE.PlaneBufferGeometry(2000, 2000),
                new THREE.MeshBasicMaterial()
            )
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera)

            let intersects = this.raycaster.intersectObjects([this.test])
            //console.log(intersects[0].point)

            this.point.x = intersects[0].point.x
            this.point.y = intersects[0].point.y

        }, false)

        window.addEventListener('click', (e) => {
            e.preventDefault()
        })
    }

    InitTexture(){
        this.textureLoader = new THREE.TextureLoader()
        this.nietzsche = this.textureLoader.load(nietzsche)
    }

    InitSettings(){
        this.settings = {
            progress: 0,
            bloomStrength: 0.2,
            bloomRadius: 0.9,
            bloomThreshold: 0.2
        }
        this.gui = new dat.GUI({closed: true})
        this.gui.add(this.settings, 'progress', 0, 1, 0.01)
        this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomRadius', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomThreshold', 0, 10, 0.01)
    }

    InitPostProcessing(){
        this.renderScene = new RenderPass(this.scene, this.camera)
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.9, 0.05)
        this.customPass = new ShaderPass(AberrationShader)
        this.composer = new EffectComposer(this.renderer)
        

        this.composer.addPass(this.renderScene)
        this.composer.addPass(this.customPass)
        
        this.composer.addPass(this.bloomPass)
    } 

    InitImgShader(){
        this.move = 0
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_texture: {value: this.nietzsche},
                u_move: { value: 0},
                u_mouse: { value: this.mouse},
                u_mousePressed: { value: 0 }
            },
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
            depthWrite: false
        })
        this.number = 512 * 512
        this.geometry = new THREE.BufferGeometry()
        this.positions = new THREE.BufferAttribute(new Float32Array(this.number * 3), 3)
        this.coordinates = new THREE.BufferAttribute(new Float32Array(this.number * 3), 3)
        this.speeds = new THREE.BufferAttribute(new Float32Array(this.number * 1), 1)
        this.offset = new THREE.BufferAttribute(new Float32Array(this.number * 1), 1)
        this.direction = new THREE.BufferAttribute(new Float32Array(this.number * 1), 1)
        this.press = new THREE.BufferAttribute(new Float32Array(this.number * 1), 1)

        function rand(a, b){
            return a + (b-a) * Math.random()
        }

        let index = 0
        for (let i = 0; i < 512; i++){
            for(let j = 0; j < 512; j++){
                this.positions.setXYZ(index, i * 2, j, 0)
                this.coordinates.setXYZ(index,i,j,0)
                this.speeds.setX(index, rand(0.4, 1))
                this.offset.setX(index, rand(-1000, 1000))
                this.direction.setX(index, Math.random()>0.5?1:-1)
                this.press.setX(index, rand(0.4, 1))
                index++
            }
        }
        this.geometry.setAttribute('position', this.positions)
        //console.log(this.positions)
        this.geometry.setAttribute('aCoordinates', this.coordinates)
        this.geometry.setAttribute('aOffset', this.offset)
        this.geometry.setAttribute('aSpeed', this.speeds)
        this.geometry.setAttribute('aDirection', this.direction)
        this.geometry.setAttribute('aPress', this.press)
        this.geometry.center()


        //this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100)
        this.textureLoader = new THREE.TextureLoader()
        this.textureLoader.load('la joconde.jpg', (texture) => {
            this.material.uniforms.u_texture.value = texture
        })
        this.img = new THREE.Points(this.geometry, this.material)
        this.scene.add(this.img)
    }
    
    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        //this.renderer.render(this.scene, this.camera)
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth/window.innerHeight, 0.01, 10000)
        this.camera.position.set(0, 0, 500)
        this.scene.add(this.camera)
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(this.ambientLight)
    }

    InitControls(){
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableDamping = true
        //this.controls.update()
    }

    Resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    Update(){
        requestAnimationFrame(() => {
            if(this.bloomPass){
                this.bloomPass.threshold = this.settings.bloomThreshold
                this.bloomPass.strength = this.settings.bloomStrength
                this.bloomPass.radius = this.settings.bloomRadius
                this.composer.render(this.scene, this.camera)
            }
            this.material.uniforms.u_time.value = this.clock.getElapsedTime()   
            this.material.uniforms.u_move.value = this.move 
            this.material.uniforms.u_mouse.value = this.point
            //this.renderer.render(this.scene, this.camera)
            //this.controls.update()
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})