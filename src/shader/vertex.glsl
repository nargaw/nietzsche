varying vec2 vUv;
varying vec3 vPos;
varying vec2 vCoordinates;
attribute vec3 aCoordinates;
attribute float aSpeed;
attribute float aOffset;
attribute float aDirection;
attribute float aPress;

uniform float u_move;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mousePressed;

void main(){
    vUv = uv;
    vec3 pos = position;
    //not stable
    pos.x += sin(u_move * aSpeed) * 3.;
    pos.y += cos(u_move * aSpeed) * 3.;
    pos.z = mod(position.z + u_move * 10. * aSpeed + aOffset, 2000.) - 1000.;

    //Stable
    vec3 stable = position;
    float dist = distance(stable.xy,u_mouse);
    float area = 1. - smoothstep(-80., 200., dist);

    float angle = atan(vUv.y, vUv.x);
    float radius = length(vUv);
    angle *= radius * 100.;
    vec2 shifted = radius * vec2(cos(angle + u_time), sin(angle + u_time));

    stable.x +=150. * sin(u_time * aPress * 1.5) * aDirection * area * u_mousePressed;
    stable.y +=100. * cos(u_time * aPress * 1.5) * aDirection * area * u_mousePressed;
    stable.z +=150. * tan(u_time * aPress * 1.5) * aDirection * area * u_mousePressed;

    vec4 mvPosition = modelViewMatrix * vec4(stable, 1.);
    gl_PointSize = 3000. * (1. / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vCoordinates = aCoordinates.xy;
    vPos = pos;
}