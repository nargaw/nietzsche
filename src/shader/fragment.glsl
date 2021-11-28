varying vec2 vUv;
varying vec3 vPos;
varying vec2 vCoordinates;
uniform float u_time;
uniform sampler2D u_texture;

void main(){
    vec2 myUv = vec2(vCoordinates.x/512.,vCoordinates.y/512.);
    vec4 image = texture2D(u_texture, myUv);

    float alpha = 1. - clamp(0., 1., abs(vPos.z/900.));
    float distanceToCenter=distance(gl_PointCoord,vec2(.5));
    float strength=.05/distanceToCenter-.05*2.;
    gl_FragColor = vec4(image);
    gl_FragColor.a = strength;

}