/* Studio lighting simulator — WebGL2 engine. Anas Alkarmi site. */
(function(){
'use strict';
const PI=Math.PI, D2R=PI/180;
/* ---------------- math ---------------- */
const v3={
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]), norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]},
  lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]
};
const m4={
  id:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o},
  persp(fy,as,n,f){const t=1/Math.tan(fy/2),nf=1/(n-f);return new Float32Array([t/as,0,0,0,0,t,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0])},
  ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1])},
  look(e,c,u){const z=v3.norm(v3.sub(e,c)),x=v3.norm(v3.cross(u,z)),y=v3.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-v3.dot(x,e),-v3.dot(y,e),-v3.dot(z,e),1])},
  // object frame: position p, forward f (local +z), up hint
  frame(p,f,up,s){f=v3.norm(f);let x=v3.cross(up||[0,1,0],f);if(v3.len(x)<1e-5)x=[1,0,0];x=v3.norm(x);const y=v3.cross(f,x);s=s||[1,1,1];
    return new Float32Array([x[0]*s[0],x[1]*s[0],x[2]*s[0],0,y[0]*s[1],y[1]*s[1],y[2]*s[1],0,f[0]*s[2],f[1]*s[2],f[2]*s[2],0,p[0],p[1],p[2],1])},
  trs(t,ry,s){const c=Math.cos(ry||0),sn=Math.sin(ry||0);s=s||[1,1,1];return new Float32Array([c*s[0],0,-sn*s[0],0,0,s[1],0,0,sn*s[2],0,c*s[2],0,t[0],t[1],t[2],1])},
  inv(m){const a=m,o=new Float32Array(16);const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
    let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!det)return m4.id();det=1/det;
    o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*det;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*det;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*det;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*det;
    o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*det;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*det;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*det;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*det;
    o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*det;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*det;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*det;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*det;
    o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*det;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*det;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*det;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*det;return o},
  nrm3(m){const i=m4.inv(m);return new Float32Array([i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]])},
  xp(m,p){const w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];return [(m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12])/w,(m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13])/w,(m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14])/w,w]}
};
function kelvin(K){const t=K/100;let r,g,b;if(t<=66){r=255;g=99.4708025861*Math.log(t)-161.1195681661;b=t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307}else{r=329.698727446*Math.pow(t-60,-.1332047592);g=288.1221695283*Math.pow(t-60,-.0755148492);b=255}
  const c=[r,g,b].map(v=>Math.min(255,Math.max(0,v))/255).map(v=>Math.pow(v,2.2));const l=c[0]*.2126+c[1]*.7152+c[2]*.0722;return c.map(v=>v/l)}
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

/* ---------------- geometry builder ---------------- */
// vertex: pos f32x3, normal i8x4 (w=ao), colour u8x4 (a = mat*16 + rough*15)
class Geo{
  constructor(){this.P=[];this.N=[];this.C=[];this.I=[];}
  get count(){return this.P.length/3}
  push(pos,nrm,idx,m,col,mat,rough,ao){
    const base=this.count,nm=m?m4.nrm3(m):null,a=Math.round(mat)*16+Math.round(Math.min(1,Math.max(0,rough))*15);
    const c=col.map(v=>Math.round(Math.min(1,Math.max(0,v))*255));
    for(let i=0;i<pos.length;i+=3){let p=[pos[i],pos[i+1],pos[i+2]],n=[nrm[i],nrm[i+1],nrm[i+2]];
      if(m){p=m4.xp(m,p);n=v3.norm([nm[0]*n[0]+nm[3]*n[1]+nm[6]*n[2],nm[1]*n[0]+nm[4]*n[1]+nm[7]*n[2],nm[2]*n[0]+nm[5]*n[1]+nm[8]*n[2]])}
      this.P.push(p[0],p[1],p[2]);this.N.push(n[0],n[1],n[2],ao==null?1:ao);this.C.push(c[0],c[1],c[2],a)}
    for(const i of idx)this.I.push(i+base);return this}
}
const prim={
  box(w,h,d){const x=w/2,y=h/2,z=d/2,P=[],N=[],I=[];
    const f=(o,u,v,n)=>{const b=P.length/3;for(const [s,t] of [[-1,-1],[1,-1],[1,1],[-1,1]]){P.push(o[0]+u[0]*s+v[0]*t,o[1]+u[1]*s+v[1]*t,o[2]+u[2]*s+v[2]*t);N.push(...n)}I.push(b,b+1,b+2,b,b+2,b+3)};
    f([0,0,z],[x,0,0],[0,y,0],[0,0,1]);f([0,0,-z],[-x,0,0],[0,y,0],[0,0,-1]);f([x,0,0],[0,0,-z],[0,y,0],[1,0,0]);f([-x,0,0],[0,0,z],[0,y,0],[-1,0,0]);f([0,y,0],[x,0,0],[0,0,-z],[0,1,0]);f([0,-y,0],[x,0,0],[0,0,z],[0,-1,0]);return [P,N,I]},
  // along +y from 0..h, radii r0 (bottom) r1 (top)
  cyl(r0,r1,h,seg,caps=true){const P=[],N=[],I=[];const sl=(r0-r1)/h;
    for(let i=0;i<=seg;i++){const a=i/seg*2*PI,c=Math.cos(a),s=Math.sin(a);const n=v3.norm([c,sl,s]);P.push(r0*c,0,r0*s,r1*c,h,r1*s);N.push(...n,...n)}
    for(let i=0;i<seg;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}
    if(caps){for(const [y,r,ny] of [[0,r0,-1],[h,r1,1]]){if(r<=0)continue;const b=P.length/3;P.push(0,y,0);N.push(0,ny,0);for(let i=0;i<=seg;i++){const a=i/seg*2*PI;P.push(r*Math.cos(a),y,r*Math.sin(a));N.push(0,ny,0)}
      for(let i=0;i<seg;i++)ny>0?I.push(b,b+i+2,b+i+1):I.push(b,b+i+1,b+i+2)}}
    return [P,N,I]},
  sphere(r,seg=16,rings=10){const P=[],N=[],I=[];for(let j=0;j<=rings;j++){const v=j/rings*PI;for(let i=0;i<=seg;i++){const u=i/seg*2*PI;const n=[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];P.push(n[0]*r,n[1]*r,n[2]*r);N.push(...n)}}
    for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;I.push(a,a+1,b,a+1,b+1,b)}return [P,N,I]},
  disc(r,seg){const P=[0,0,0],N=[0,0,1],I=[];for(let i=0;i<=seg;i++){const a=i/seg*2*PI;P.push(r*Math.cos(a),r*Math.sin(a),0);N.push(0,0,1)}for(let i=0;i<seg;i++)I.push(0,i+1,i+2);return [P,N,I]},
  // rectangular / polygonal frustum along +z: back (z=0) half size b, front (z=d) half size f ; seg polygon sides (4 = rect)
  frustum(bx,by,fx,fy,d,seg){const P=[],N=[],I=[];const pts=(sx,sy,z)=>{const o=[];for(let i=0;i<seg;i++){const a=(i+.5)/seg*2*PI;o.push([Math.cos(a)*sx*(seg===4?Math.SQRT2:1),Math.sin(a)*sy*(seg===4?Math.SQRT2:1),z])}return o};
    const B=pts(bx,by,0),F=pts(fx,fy,d);for(let i=0;i<seg;i++){const j=(i+1)%seg;const a=B[i],b=B[j],c=F[j],e=F[i];const n=v3.norm(v3.cross(v3.sub(b,a),v3.sub(e,a)));const k=P.length/3;P.push(...a,...b,...c,...e);N.push(...n,...n,...n,...n);I.push(k,k+2,k+1,k,k+3,k+2)}
    const k=P.length/3;P.push(0,0,0);N.push(0,0,-1);for(const p of B){P.push(...p);N.push(0,0,-1)}for(let i=0;i<seg;i++)I.push(k,k+1+(i+1)%seg,k+1+i);return [P,N,I]},
  poly(r,seg,z){const P=[0,0,z],N=[0,0,1],I=[];for(let i=0;i<seg;i++){const a=(i+.5)/seg*2*PI;P.push(Math.cos(a)*r*(seg===4?Math.SQRT2:1),Math.sin(a)*r*(seg===4?Math.SQRT2:1),z);N.push(0,0,1)}for(let i=0;i<seg;i++)I.push(0,1+i,1+(i+1)%seg);return [P,N,I]},
  plane(w,d){return [[-w/2,0,-d/2,w/2,0,-d/2,w/2,0,d/2,-w/2,0,d/2],[0,1,0,0,1,0,0,1,0,0,1,0],[0,2,1,0,3,2]]},
  quadXY(w,h){return [[-w/2,0,0,w/2,0,0,w/2,h,0,-w/2,h,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,1,2,0,2,3]]}
};
const T=(x,y,z)=>m4.trs([x,y,z],0),TR=(x,y,z,ry)=>m4.trs([x,y,z],ry),TRS=(x,y,z,ry,s)=>m4.trs([x,y,z],ry,s);
const rotX=(a)=>new Float32Array([1,0,0,0,0,Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1]);
const rotZ=(a)=>new Float32Array([Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1,0,0,0,0,1]);
const srgb=h=>{const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};

/* ---------------- shaders ---------------- */
const MAXL=16;
const VS_MAIN=`#version 300 es
layout(location=0) in vec3 aP;layout(location=1) in vec4 aN;layout(location=2) in vec4 aC;layout(location=3) in vec2 aUV;
uniform mat4 uVP,uM;uniform mat3 uNM;
out vec3 vW;out vec3 vN;out vec4 vC;out float vAO;out vec3 vO;out vec2 vUV;
void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=normalize(uNM*aN.xyz);vAO=clamp(aN.w,0.,1.);vC=aC;vO=aP;vUV=vec2(aUV.x,1.-aUV.y);gl_Position=uVP*w;}`;
const VS_DEPTH=`#version 300 es
layout(location=0) in vec3 aP;layout(location=3) in vec2 aUV;uniform mat4 uVP,uM;out vec2 vUV;void main(){vUV=vec2(aUV.x,1.-aUV.y);gl_Position=uVP*uM*vec4(aP,1.);}`;
const FS_DEPTH=`#version 300 es
precision mediump float;void main(){}`;
const FS_DEPTHA=`#version 300 es
precision mediump float;in vec2 vUV;uniform sampler2D uAlbT;void main(){if(texture(uAlbT,vUV).a<.42)discard;}`;
const FS_MAIN=`#version 300 es
precision highp float;
in vec3 vW;in vec3 vN;in vec4 vC;in float vAO;in vec3 vO;in vec2 vUV;
layout(location=0) out vec4 oC;
uniform float uTex;uniform sampler2D uAlbT,uNrmT,uSpecT;uniform float uWallFin,uFloorFin;uniform vec3 uFloorCol;
uniform vec3 uCam;uniform int uNL;
uniform vec3 uLPos[${MAXL}];uniform vec3 uLDir[${MAXL}];uniform vec3 uLCol[${MAXL}];uniform vec4 uLPar[${MAXL}];uniform vec4 uLPar2[${MAXL}];uniform mat4 uLMat[${MAXL}];uniform vec4 uLTile[${MAXL}];
uniform highp sampler2D uShadow;uniform float uAtlas;
uniform vec3 uAmb;uniform float uHaze;uniform vec3 uEmit;uniform float uSubject;uniform vec3 uWall;uniform float uWork;uniform float uLDR;uniform float uExpo;uniform vec3 uWB;uniform float uSel;
const vec2 PD[12]=vec2[12](vec2(-.326,-.406),vec2(-.840,-.074),vec2(-.696,.457),vec2(-.203,.621),vec2(.962,-.195),vec2(.473,-.480),vec2(.519,.767),vec2(.185,-.893),vec2(.507,.064),vec2(.896,.412),vec2(-.322,-.933),vec2(-.792,-.598));
float h12(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}
float linZ(float z,float n,float f){z=z*2.-1.;return 2.*n*f/(f+n-z*(f-n));}
float shadowF(int i,vec3 wp,vec3 n,vec3 L){
  vec4 t=uLTile[i];if(t.w<.5)return 1.;
  float ndl=clamp(dot(n,L),0.,1.);
  vec4 c=uLMat[i]*vec4(wp+n*(.004+.012*(1.-ndl)),1.);vec3 p=c.xyz/c.w;
  if(abs(p.x)>.999||abs(p.y)>.999||p.z>1.)return 1.;
  vec4 P2=uLPar2[i];float nr=P2.z,fr=P2.w;
  vec2 uv=(p.xy*.5+.5)*t.z+t.xy;float z=p.z*.5+.5;float zr=linZ(z,nr,fr);
  vec2 lo=t.xy+.5/uAtlas,hi=t.xy+t.z-.5/uAtlas;
  float ang=h12(gl_FragCoord.xy)*6.2832;mat2 R=mat2(cos(ang),sin(ang),-sin(ang),cos(ang));
  float lsUV=P2.x/(2.*P2.y*zr)*t.z;          // light size projected at receiver, atlas uv
  float sr=clamp(lsUV*.5,1.5/uAtlas,.06*t.z);
  float bs=0.,bn=0.;
  for(int k=0;k<8;k++){vec2 o=R*PD[k]*sr;float d=texture(uShadow,clamp(uv+o,lo,hi)).r;float zd=linZ(d,nr,fr);if(zd<zr-.01){bs+=zd;bn+=1.;}}
  if(bn<.5)return 1.;
  float zb=bs/bn;float pen=(zr-zb)/zb*P2.x;float pr=clamp(pen/(2.*P2.y*zr)*t.z,1.2/uAtlas,.05*t.z);
  float s=0.;for(int k=0;k<12;k++){vec2 o=R*PD[k]*pr;float d=texture(uShadow,clamp(uv+o,lo,hi)).r;s+=(z-.0004<=d)?1.:0.;}
  return s/12.;
}
float D_GGX(float nh,float a){float a2=a*a;float d=nh*nh*(a2-1.)+1.;return a2/(3.14159*d*d+1e-6);}
float V_SJ(float nv,float nl,float a){float a2=a*a;return .5/(nl*sqrt(nv*nv*(1.-a2)+a2)+nv*sqrt(nl*nl*(1.-a2)+a2)+1e-5);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
  vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);
  float code=floor(vC.a*255.+.5);float mat=floor(code/16.+.001);float rough=mod(code,16.)/15.;
  vec3 alb=pow(vC.rgb,vec3(2.2));float ao=vAO;
  if(uTex>.5){vec4 tx=texture(uAlbT,vUV);float pc=floor(vC.r*255.+.5);
    if(pc>1.5&&pc<2.5){if(tx.a<.42)discard;mat=2.;rough=.5;}
    else{float sp=texture(uSpecT,vUV).r;rough=pc>.5&&pc<1.5?mix(.62,.36,sp):mix(.92,.5,sp);mat=pc>2.5?12.:pc>.5?1.:0.;
      vec3 tn=texture(uNrmT,vUV).xyz*2.-1.;
      vec3 dp1=dFdx(vW),dp2=dFdy(vW);vec2 du1=dFdx(vUV),du2=dFdy(vUV);vec3 d2p=cross(dp2,N),d1p=cross(N,dp1);
      vec3 Tg=d2p*du1.x+d1p*du2.x,Bg=d2p*du1.y+d1p*du2.y;float im=inversesqrt(max(max(dot(Tg,Tg),dot(Bg,Bg)),1e-20));
      N=normalize(mat3(Tg*im,-Bg*im,N)*vec3(tn.xy*.9,tn.z));}
    alb=pow(tx.rgb,vec3(2.2));}
  if((mat==4.||mat==9.||mat==2.)&&dot(N,V)<0.)N=-N;
  if(mat==6.&&uWork>0.&&dot(N,V)<0.)discard;
  float f0=.04,sss=0.,glossy=0.;vec3 emit=vec3(0.);
  if(mat==1.){sss=1.;f0=.028;if(uTex<.5){rough=max(rough,.48);alb=mix(vec3(dot(alb,vec3(.3,.59,.11))),alb,.74)*(.92+.16*vn(vO.xy*900.));}}
  else if(mat==12.){rough=.06;f0=.035;glossy=1.;}
  else if(mat==3.){ // eye: iris from object space
    vec3 ec=vec3(sign(vO.x)*.032,.002,.066);vec3 ed=normalize(vO-ec);float c=ed.z;
    float ir=smoothstep(.862,.874,c),pu=smoothstep(.962,.968,c),lim=smoothstep(.85,.866,c)*(1.-smoothstep(.874,.89,c));
    float st=vn(vec2(atan(ed.y,ed.x)*9.,c*60.));vec3 iris=mix(vec3(.13,.07,.03),vec3(.34,.2,.08),st*(.4+.6*smoothstep(.87,.96,c)));
    vec3 scl=mix(vec3(.5,.44,.41),vec3(.56,.4,.38),smoothstep(.75,.2,c)*.5)*(.85+.15*smoothstep(.2,.8,c));
    alb=mix(scl,iris,ir);alb*=1.-lim*.55;alb=mix(alb,vec3(.004),pu);rough=.03;f0=.035;glossy=1.;}
  else if(mat==2.){f0=.046;rough=max(rough,.42);if(uTex<.5)alb*=.9+.2*vn(vO.xy*1400.);}
  else if(mat==4.){emit=uEmit;alb=vec3(.8);}
  else if(mat==5.){ // floor
    if(uFloorFin<.5){vec2 q=vW.xz*vec2(1./.19,1./1.2);float row=floor(q.x);q.y+=h12(vec2(row,3.))*7.;float pl=floor(q.y);
      float g=h12(vec2(row,pl));float grain=vn(vec2(vW.x*3.,vW.z*48.+row*9.))*.5+vn(vec2(vW.x*9.,vW.z*160.))*.25;
      alb=mix(vec3(.052,.03,.017),vec3(.11,.066,.036),g*.7+grain*.5)*uFloorCol*2.2;
      float edge=min(min(fract(q.x),1.-fract(q.x))*.19,min(fract(q.y),1.-fract(q.y))*1.2);alb*=mix(.45,1.,smoothstep(0.,.004,edge));rough=.42+grain*.2;}
    else if(uFloorFin<1.5){float n=vn(vW.xz*3.)*.5+vn(vW.xz*17.)*.3+vn(vW.xz*90.)*.2;alb=uFloorCol*(.75+.4*n);rough=.55+.2*n;}
    else{float n=vn(vW.xz*400.)*.6+vn(vW.xz*40.)*.4;alb=uFloorCol*(.82+.25*n);rough=.97;}}
  else if(mat==6.){ // walls
    vec2 wp=abs(N.z)>.5?vW.xy:vW.zy;float n=vn(wp*vec2(2.,4.))*.08+vn(wp*30.)*.03;rough=.85;
    if(uWallFin<.5){alb=uWall*(.95+n*.6);}
    else if(uWallFin<1.5){float px=wp.x/.62;float e=min(fract(px),1.-fract(px))*.62;alb=uWall*(.92+n)*mix(.35,1.,smoothstep(0.,.012,e));rough=.8;}
    else if(uWallFin<2.5){vec2 b=wp/vec2(.225,.075);b.x+=.5*mod(floor(b.y),2.);vec2 f=fract(b),id=floor(b);float m=min(min(f.x,1.-f.x)*.225,min(f.y,1.-f.y)*.075);
      float v=h12(id);alb=mix(vec3(.55,.53,.5)*.6,uWall*(.75+.5*v)*(.9+.2*vn(wp*60.)),smoothstep(.004,.009,m));rough=.93;}
    else if(uWallFin<3.5){float c=vn(wp*1.3)*.5+vn(wp*7.)*.3+vn(wp*50.)*.2;alb=uWall*(.72+.5*c);rough=.9;}
    else if(uWallFin<4.5){float px=wp.x/.11;float e=min(fract(px),1.-fract(px))*.11;float v=h12(vec2(floor(px),2.));alb=uWall*(.8+.35*v)*(.9+.2*vn(vec2(wp.x*40.,wp.y*3.)))*mix(.2,1.,smoothstep(.002,.006,e));rough=.7;}
    else if(uWallFin<5.5){float f=sin(wp.x*38.+vn(wp*vec2(3.,.5))*4.)*.5+.5;alb=uWall*mix(.55,1.1,f)*(.95+.1*vn(wp*vec2(200.,8.)));rough=.95;}
    else{vec2 q=wp/vec2(.32,.42);vec2 f=fract(q)-.5;float dmd=abs(f.x)+abs(f.y);float st=smoothstep(.06,.03,max(abs(f.x)*3.,abs(f.y))*min(abs(f.x),abs(f.y)*3.)+.02);
      float band=smoothstep(.34,.36,dmd)*smoothstep(.46,.44,dmd);alb=uWall*(1.+n*.4);alb=mix(alb,uWall*.22,max(band,st)*.85);rough=.8;}}
  else if(mat==7.){f0=.5;glossy=1.;}
  else if(mat==9.){sss=.5;}
  else if(mat==11.){ // rug
    vec2 q=vW.xz;float b=max(abs(q.x)-1.1,abs(q.y-.3)-.75);float border=smoothstep(-.12,-.1,b)*(1.-smoothstep(-.03,-.01,b));
    float pat=step(.5,fract((q.x+q.y)*4.))*.5+step(.5,fract((q.x-q.y)*4.))*.5;
    alb=mix(vec3(.12,.05,.035),vec3(.2,.1,.06),pat*.5+vn(q*40.)*.3);alb=mix(alb,vec3(.33,.27,.2),border);rough=.95;}
  vec3 col=vec3(0.);
  float nv=clamp(dot(N,V),1e-3,1.);
  for(int i=0;i<${MAXL};i++){if(i>=uNL)break;
    vec3 lc=uLCol[i];if(dot(lc,lc)<1e-8)continue;
    vec4 P=uLPar[i];vec3 Lv=uLPos[i]-vW;float d=length(Lv);vec3 L=Lv/d;
    float cone=1.;if(P.w<.5||P.w>1.5){float cd=dot(-L,uLDir[i]);cone=smoothstep(P.x,P.y,cd);if(P.w>1.5)cone*=max(cd,0.)*.6+.4;}
    if(cone<=0.)continue;
    float size=P.z;float ndl=dot(N,L);float w=clamp(size/d*.32,0.,.45);
    vec3 wr=vec3(w)+sss*vec3(.34,.15,.07);vec3 dif=clamp((vec3(ndl)+wr)/(1.+wr),0.,1.);
    if(max(dif.r,max(dif.g,dif.b))<=0.)continue;
    float sh=shadowF(i,vW,N,L);vec3 shc=sss>0.?pow(vec3(sh),vec3(.55,.9,1.05)):vec3(sh);
    float a=max(rough*rough,.002);a=clamp(a+size/(2.*d)*.5*(1.-glossy*.7),a,1.);
    vec3 H=normalize(L+V);float nh=clamp(dot(N,H),0.,1.),nl=clamp(ndl,0.,1.),vh=clamp(dot(V,H),0.,1.);
    float F=f0+(1.-f0)*pow(1.-vh,5.);
    float spec=D_GGX(nh,a)*V_SJ(nv,nl,a)*F*nl;
    if(sss>0.)spec=spec*.7+D_GGX(nh,a*.5)*V_SJ(nv,nl,a*.5)*F*nl*.3;
    vec3 sp=vec3(spec);if(mat==7.)sp*=alb*2.;
    col+=lc*cone/(d*d)*shc*(alb*dif+sp);
  }
  // ambient bounce + work light for set view
  float hemi=.55+.45*N.y;col+=uAmb*alb*ao*hemi;
  col+=uWork*alb*ao*(.35+.65*clamp(dot(N,V),0.,1.))*.9;
  // cloth sheen
  if(mat==0.)col+=uAmb*pow(1.-nv,4.)*.25*ao;
  col+=emit;
  // haze: analytic in-scatter per light (unshadowed)
  if(uHaze>0.){vec3 rd=-V;float T=length(vW-uCam);
    for(int i=0;i<${MAXL};i++){if(i>=uNL)break;vec3 lc=uLCol[i];if(dot(lc,lc)<1e-8)continue;vec3 oc=uCam-uLPos[i];float bb=dot(oc,rd);float c=dot(oc,oc);float hh=sqrt(max(c-bb*bb,1e-4));
      float I=(atan((T+bb)/hh)-atan(bb/hh))/hh;vec3 cp=uCam+rd*clamp(-bb,0.,T);vec4 P=uLPar[i];float cone=1.;if(P.w<.5||P.w>1.5)cone=smoothstep(P.x,P.y,dot(normalize(cp-uLPos[i]),uLDir[i]));
      col+=lc*uHaze*.018*I*cone;}}
  if(uSel>0.)col=mix(col,vec3(1.,.62,.26)*.6,uSel*.35);
  if(uLDR>.5){col*=uExpo*uWB;col=aces(col);col=pow(col,vec3(1./2.2));}
  oC=vec4(col,1.);
}`;
const VS_Q=`#version 300 es
layout(location=0) in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FS_DOF=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uCol,uDep;uniform float uN,uF,uFocus,uK,uMax;uniform vec2 uTx;
float lin(float z){z=z*2.-1.;return 2.*uN*uF/(uF+uN-z*(uF-uN));}
float coc(float d){return clamp(uK*abs(d-uFocus)/d,0.,uMax);}
void main(){float d0=lin(texture(uDep,uv).r);float c0=coc(d0);vec3 acc=texture(uCol,uv).rgb;float wsum=1.;
  if(uMax<.6){o=vec4(acc,1.);return;}
  const float GA=2.39996;
  for(int k=1;k<40;k++){float r=uMax*sqrt(float(k)/40.);float a=float(k)*GA;vec2 off=vec2(cos(a),sin(a))*r*uTx;
    float ds=lin(texture(uDep,uv+off).r);float cs=coc(ds);if(ds>d0)cs=min(cs,c0*1.05);
    float w=smoothstep(r-1.,r+.5,cs);acc+=texture(uCol,uv+off).rgb*w;wsum+=w;}
  o=vec4(acc/wsum,1.);}`;
const FS_BRIGHT=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uCol;uniform vec2 uTx;uniform float uExpo;
void main(){vec3 c=vec3(0.);for(int i=0;i<4;i++){vec2 of=vec2(float(i%2),float(i/2))-.5;c+=texture(uCol,uv+of*uTx*2.).rgb;}c*=.25*uExpo;float l=max(c.r,max(c.g,c.b));o=vec4(c*smoothstep(1.,3.,l),1.);}`;
const FS_BLUR=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uCol;uniform vec2 uDir;
void main(){vec3 c=texture(uCol,uv).rgb*.2270;c+=(texture(uCol,uv+uDir*1.3846).rgb+texture(uCol,uv-uDir*1.3846).rgb)*.3162;c+=(texture(uCol,uv+uDir*3.2308).rgb+texture(uCol,uv-uDir*3.2308).rgb)*.0703;o=vec4(c,1.);}`;
const FS_FINAL=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uCol,uBloom;uniform float uExpo,uBK,uFC,uGrain,uVig,uTime,uRaw;uniform vec3 uWB;uniform vec2 uRes;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture(uCol,uv).rgb;if(uRaw<.5){c=c*uExpo*uWB+texture(uBloom,uv).rgb*uBK*uWB;c=aces(c);c=pow(c,vec3(1./2.2));}
  vec2 d=uv-.5;c*=1.-dot(d,d)*uVig;c+=(h(uv*uRes+fract(uTime)*37.)-.5)*uGrain;
  if(uFC>.5){float Y=dot(c,vec3(.2126,.7152,.0722));vec3 f=vec3(Y*.85);
    if(Y<.03)f=vec3(.45,.1,.6);else if(Y<.1)f=vec3(.12,.3,.85);else if(Y>.38&&Y<.44)f=vec3(.2,.78,.3);else if(Y>.52&&Y<.58)f=vec3(.95,.52,.68);else if(Y>.97)f=vec3(.95,.12,.1);else if(Y>.92)f=vec3(.96,.86,.15);c=f;}
  o=vec4(c,1.);}`;
const VS_LINE=`#version 300 es
layout(location=0) in vec3 aP;layout(location=2) in vec4 aC;uniform mat4 uVP;out vec4 vC;void main(){vC=aC;gl_Position=uVP*vec4(aP,1.);}`;
const FS_LINE=`#version 300 es
precision mediump float;in vec4 vC;out vec4 o;void main(){o=vC;}`;

/* ---------------- fixture catalogue ---------------- */
const FIX={
  octa:{label:'Octabox 120',short:'Octa',size:1.15,outer:88,inner:35,power:5.2,soft:true,kind:0},
  softbox:{label:'Softbox 60×90',short:'Softbox',size:.75,outer:80,inner:30,power:4.2,soft:true,kind:0},
  strip:{label:'Stripbox 30×120',short:'Strip',size:.6,outer:75,inner:25,power:3,soft:true,kind:0},
  fresnel:{label:'Fresnel',short:'Fresnel',size:.12,outer:30,inner:18,power:7,beam:true,kind:0},
  tube:{label:'LED tube 4ft',short:'Tube',size:.9,outer:170,inner:120,power:1.7,rgb:true,kind:2},
  lantern:{label:'China ball',short:'Lantern',size:.6,outer:180,inner:180,power:1.6,kind:1},
  bounce:{label:'Bounce reflector',short:'Bounce',size:1,outer:85,inner:40,power:0,passive:true,kind:2},
  bgspot:{label:'Background spot',short:'BG spot',size:.08,outer:26,inner:12,power:9,beam:true,kind:0},
  window:{label:'Window (daylight)',short:'Window',size:1.4,outer:165,inner:90,power:3.4,soft:true,kind:0,wall:true}
};

/* ---------------- engine ---------------- */
function create(canvas,opts){
  opts=opts||{};
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  if(!gl)return null;
  const HDR=!!gl.getExtension('EXT_color_buffer_float')||!!gl.getExtension('EXT_color_buffer_half_float');
  gl.getExtension('OES_texture_float_linear');
  const MOB=!!opts.mobile;
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(o));throw new Error('shader')}return o}
  function prog(vs,fs){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));throw new Error('link')}
    const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const u=gl.getActiveUniform(p,i);U[u.name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,u.name)}return {p,U}}
  const PM=prog(VS_MAIN,FS_MAIN),PD=prog(VS_DEPTH,FS_DEPTH),PDA=prog(VS_DEPTH,FS_DEPTHA),PDOF=prog(VS_Q,FS_DOF),PBR=prog(VS_Q,FS_BRIGHT),PBL=prog(VS_Q,FS_BLUR),PF=prog(VS_Q,FS_FINAL),PL=prog(VS_LINE,FS_LINE);
  const qbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const qvao=gl.createVertexArray();gl.bindVertexArray(qvao);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
  function quad(){gl.bindVertexArray(qvao);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}

  // mesh upload (interleaved 20B)
  function upload(P,N,C,I){const n=P.length/3;const buf=new ArrayBuffer(n*20),f=new Float32Array(buf),i8=new Int8Array(buf),u8=new Uint8Array(buf);
    for(let k=0;k<n;k++){f[k*5]=P[k*3];f[k*5+1]=P[k*3+1];f[k*5+2]=P[k*3+2];i8[k*20+12]=Math.round(N[k*4]*127);i8[k*20+13]=Math.round(N[k*4+1]*127);i8[k*20+14]=Math.round(N[k*4+2]*127);i8[k*20+15]=Math.round(N[k*4+3]*127);u8[k*20+16]=C[k*4];u8[k*20+17]=C[k*4+1];u8[k*20+18]=C[k*4+2];u8[k*20+19]=C[k*4+3]}
    return uploadRaw(buf,n,n>65535?new Uint32Array(I):new Uint16Array(I))}
  function uploadRaw(buf,n,idx){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,buf,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.BYTE,true,20,12);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.UNSIGNED_BYTE,true,20,16);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);gl.bindVertexArray(null);
    return {vao,count:idx.length,type:idx instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,vb,ib}}
  function geoMesh(g){return upload(g.P,g.N,g.C,g.I)}

  const objects=[];  // {mesh, M, NM, cast, layer, emit:fn|null, subject, lightId}
  function addObj(mesh,M,o){const ob=Object.assign({mesh,M:M||m4.id(),cast:true,layer:'set',emit:null,subject:0,sel:0,visible:true},o||{});ob.NM=m4.nrm3(ob.M);objects.push(ob);return ob}
  function setM(ob,M){ob.M=M;ob.NM=m4.nrm3(M)}

  /* ----- helpers ----- */
  const rotY=a=>m4.trs([0,0,0],a);
  function removeObj(o){const k=objects.indexOf(o);if(k>=0)objects.splice(k,1)}
  const clampN=(v,a,b)=>Math.min(b,Math.max(a,v));
  const rotPt=(x,z,ry,px,pz)=>{const c=Math.cos(ry),s=Math.sin(ry);return [x+c*px+s*pz,z-s*px+c*pz]};
  async function fetchB64(url){const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);const t=(await r.text()).trim();const bin=atob(t);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}

  /* ----- textures ----- */
  const aniso=gl.getExtension('EXT_texture_filter_anisotropic');
  function flatTex(rgba){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(rgba));return t}
  const FLATN=flatTex([128,128,255,255]),FLATS=flatTex([60,60,60,255]);
  const texCache={};
  function loadTex(url){if(texCache[url])return texCache[url];texCache[url]=new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,4);res(t)};im.onerror=()=>{delete texCache[url];rej(new Error('texture '+url))};im.src=url});return texCache[url]}

  /* ----- people: seated, textured avatars (Microsoft Rocketbox, MIT) ----- */
  const HEAD=[0,1.305,-.02],CHEST=[0,.94,.02],HEAD2=[-1,1.305,.5];
  const people=[];
  const meshCache={};
  async function personMesh(base){if(meshCache[base])return meshCache[base];const ab=await fetchB64(base+'m.txt');const dv=new DataView(ab);
    if(dv.getUint32(0,true)!==0x31305641)throw new Error('bad person mesh');const nv=dv.getUint32(4,true),ns=dv.getUint32(8,true);let off=12;const subs=[];
    for(let i=0;i<ns;i++){subs.push([dv.getUint32(off,true),dv.getUint32(off+4,true),dv.getUint32(off+8,true)]);off+=12}
    const eyes=[dv.getFloat32(off,true),dv.getFloat32(off+4,true),dv.getFloat32(off+8,true)],chest=[dv.getFloat32(off+12,true),dv.getFloat32(off+16,true),dv.getFloat32(off+20,true)];off+=24;
    const vb=ab.slice(off,off+nv*16);off+=nv*16;let ni=0;subs.forEach(s=>ni=Math.max(ni,s[1]+s[2]));const idx=new Uint16Array(ab.slice(off,off+ni*2));
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,vb,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.SHORT,false,16,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.BYTE,true,16,8);
    gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.UNSIGNED_BYTE,true,16,11);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,2,gl.UNSIGNED_SHORT,true,16,12);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);gl.bindVertexArray(null);
    const m={vao,subs,eyes,chest};meshCache[base]=m;return m}
  let peopleBase='p/';
  function personFrame(P){return TRS(P.x,0,P.z,P.ry,[1e-4,1e-4,1e-4])}
  function placePerson(P){const M=personFrame(P);P.objs.forEach(o=>setM(o,M));if(P.seatObjs)P.seatObjs.forEach(o=>setM(o,TRS(P.x,0,P.z,P.ry)));
    const e=P.eyes||[0,1.305,-.088],c=P.chest||[0,.94,-.16];const f=[Math.sin(P.ry),0,Math.cos(P.ry)];
    const [ex,ez]=rotPt(P.x,P.z,P.ry,e[0],e[2]),[cx,cz]=rotPt(P.x,P.z,P.ry,c[0],c[2]);const H=P.slot?HEAD2:HEAD;
    H[0]=ex+f[0]*.075;H[1]=e[1]+.005;H[2]=ez+f[2]*.075;if(!P.slot){CHEST[0]=cx+f[0]*.2;CHEST[1]=c[1];CHEST[2]=cz+f[2]*.2}}
  function buildSeat(P){(P.seatObjs||[]).forEach(removeObj);P.seatObjs=[];const D=PROPS[P.seat];if(!D)return;const g=new Geo(),e=new Geo();D.build(g,e,{color:P.seatColor||D.color,id:100+P.slot});
    if(g.count)P.seatObjs.push(addObj(geoMesh(g),m4.id(),{layer:'seat',personSeat:P.slot}))}
  async function setPerson(slot,pid,o){let P=people[slot];if(!P){P={slot,pid:null,x:slot?-1.2:0,z:slot?.35:0,ry:slot?1.15:0,seat:'armchair',objs:[],seatObjs:[]};people[slot]=P}
    Object.assign(P,o||{});
    if(pid&&pid!==P.pid){const base=peopleBase+pid+'/';P.loading=pid;
      const [mesh,tx]=await Promise.all([personMesh(base),Promise.all(['body','body_n','body_s','head','head_n','head_s','hair'].map(n=>loadTex(base+n+'.webp').catch(()=>null)))]);
      if(P.loading!==pid)return P;
      P.objs.forEach(removeObj);P.objs=[];P.pid=pid;P.eyes=mesh.eyes;P.chest=mesh.chest;
      for(const [mi,start,count] of mesh.subs){const tex=mi===0?{a:tx[0],n:tx[1],s:tx[2]}:mi===1?{a:tx[3],n:tx[4],s:tx[5]}:{a:tx[6],alpha:true};if(!tex.a)continue;
        P.objs.push(addObj({vao:mesh.vao,count,type:gl.UNSIGNED_SHORT,offset:start*2},m4.id(),{layer:'person',tex,alphaTest:!!tex.alpha,person:P.slot}))}}
    if(!P.seatObjs.length||(o&&('seat' in o||'seatColor' in o)))buildSeat(P);
    placePerson(P);shadowDirty.fill(true);dirty=true;return P}
  function removePerson(slot){const P=people[slot];if(!P)return;P.objs.forEach(removeObj);(P.seatObjs||[]).forEach(removeObj);people[slot]=null;if(slot===1)people.length=1;shadowDirty.fill(true);dirty=true}
  function movePerson(P){placePerson(P);shadowDirty.fill(true);dirty=true}

  /* ----- room ----- */
  const room={back:-2.35,left:-3.2,right:2.9,rightOn:false,wall:'#2a2622',fin:1,floor:0,floorCol:'#b3b3b3',skirt:true};
  let roomObjs=[];
  function buildRoom(){roomObjs.forEach(removeObj);roomObjs=[];const g=new Geo();const B=room.back,Lx=room.left,Rx=room.rightOn?room.right:6.5;
    g.push(...prim.plane(16,16),T(0,0,0),[.5,.5,.5],5,.5,1);
    const bw=Rx-Lx;g.push(...prim.quadXY(bw,3.4),T((Lx+Rx)/2,0,B),[.5,.5,.5],6,.8,1);
    if(room.skirt)g.push(...prim.box(bw,.1,.025),T((Lx+Rx)/2,.05,B+.012),[.08,.075,.07],0,.6,1);
    const sd=7;g.push(...prim.quadXY(sd,3.4),m4.mul(T(Lx,0,B+sd/2),rotY(PI/2)),[.5,.5,.5],6,.8,1);
    if(room.skirt)g.push(...prim.box(.025,.1,sd),T(Lx+.012,.05,B+sd/2),[.08,.075,.07],0,.6,1);
    if(room.rightOn){g.push(...prim.quadXY(sd,3.4),m4.mul(T(Rx,0,B+sd/2),rotY(-PI/2)),[.5,.5,.5],6,.8,1);if(room.skirt)g.push(...prim.box(.025,.1,sd),T(Rx-.012,.05,B+sd/2),[.08,.075,.07],0,.6,1)}
    roomObjs.push(addObj(geoMesh(g),m4.id(),{layer:'room'}));props.forEach(p=>{if(PROPS[p.type].wall){snapWall(p);placeProp(p)}});lights.forEach(L=>{if(FIX[L.type].wall)snapWallLight(L)});shadowDirty.fill(true);dirty=true}
  function nearestWall(x,z){const c=[['back',Math.abs(z-room.back)],['left',Math.abs(x-room.left)]];if(room.rightOn)c.push(['right',Math.abs(x-room.right)]);c.sort((a,b)=>a[1]-b[1]);return c[0][0]}
  function snapWall(p){const D=PROPS[p.type];const d=(D.depth||.06)/2;const w=nearestWall(p.x,p.z);const xmax=room.rightOn?room.right-.4:5;
    if(w==='back'){p.z=room.back+d+.002;p.ry=0;p.x=clampN(p.x,room.left+.4,xmax)}
    else if(w==='left'){p.x=room.left+d+.002;p.ry=PI/2;p.z=clampN(p.z,room.back+.4,3.5)}
    else{p.x=room.right-d-.002;p.ry=-PI/2;p.z=clampN(p.z,room.back+.4,3.5)}p.wall=w}
  function snapWallLight(L){const w=nearestWall(L.x,L.z);const xmax=room.rightOn?room.right-.6:5;
    if(w==='back'){L.z=room.back+.02;L.x=clampN(L.x,room.left+.7,xmax);L.wn=[0,0,1]}else if(w==='left'){L.x=room.left+.02;L.z=clampN(L.z,room.back+.7,3.5);L.wn=[1,0,0]}else{L.x=room.right-.02;L.z=clampN(L.z,room.back+.7,3.5);L.wn=[-1,0,0]}
    L.h=clampN(L.h,.9,2.1)}

  /* ----- prop library (local space: origin on the floor, facing +z) ----- */
  const C=h=>srgb(h),dk=(c,k)=>c.map(v=>v*k),mixc=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const bxp=(g,w,h,d,x,y,z,col,mat,r,M)=>g.push(...prim.box(w,h,d),M?m4.mul(T(x,y,z),M):T(x,y,z),col,mat==null?0:mat,r==null?.7:r,1);
  const cyp=(g,r0,r1,h,x,y,z,col,mat,r,seg)=>g.push(...prim.cyl(r0,r1,h,seg||16),T(x,y,z),col,mat==null?0:mat,r==null?.6:r,1);
  function seeded(id){let s=(id*9301+49297)%233280||7;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}}
  const BOOKC=['#5b2a22','#27394a','#6b5a3c','#2f3b2a','#8a7d68','#1f1c1a','#704b2a','#a3997e','#3d2f4a'];
  function books(g,x0,x1,y,z,depth,R){let x=x0;while(x<x1-.03){const bw=.022+R()*.035,bh=.18+R()*.12;if(R()<.1){x+=.05;continue}const c=C(BOOKC[Math.floor(R()*BOOKC.length)]).map(v=>v*(.8+R()*.4));
      bxp(g,bw,bh,depth*(.75+R()*.2),x+bw/2,y+bh/2,z,c,0,.75);x+=bw+.002}}
  const PROPS={
    armchair:{label:'Armchair',group:'Seating',color:'#3a2418',colors:['#3a2418','#23272e','#5a4632','#6b2e2a','#1b1b1b','#7d7466'],seat:true,foot:[.36,.34],
      build(g,e,p){const c=C(p.color);const cm=(x,y,z,W,H,D,rx)=>bxp(g,W,H,D,x,y,z,c,8,.55,rx?rotX(rx):null);
        cm(0,.36,-.02,.66,.14,.62);cm(0,.75,-.34,.66,.72,.12,-.12);cm(-.36,.52,-.02,.1,.26,.62);cm(.36,.52,-.02,.1,.26,.62);
        for(const [x,z] of [[-.28,.24],[.28,.24],[-.28,-.28],[.28,-.28]])cyp(g,.02,.016,.29,x,0,z,C('#1a120c'),7,.4,8)}},
    sofa:{label:'Sofa',group:'Seating',color:'#2d3238',colors:['#2d3238','#5a4632','#7d7466','#3a2418','#40503f','#1b1b1b'],seat:true,foot:[1.02,.42],
      build(g,e,p){const c=C(p.color);bxp(g,2.04,.2,.84,0,.28,0,dk(c,.85),0,.9);for(let i=-1;i<=1;i++)bxp(g,.62,.13,.66,i*.64,.44,.06,c,0,.95);
        bxp(g,1.8,.48,.2,0,.62,-.3,c,0,.95,rotX(-.1));bxp(g,.16,.34,.84,-.94,.5,0,c,0,.95);bxp(g,.16,.34,.84,.94,.5,0,c,0,.95);
        for(const [x,z] of [[-.95,.35],[.95,.35],[-.95,-.35],[.95,-.35]])cyp(g,.02,.02,.18,x,0,z,C('#161412'),7,.4,8)}},
    chair:{label:'Chair',group:'Seating',color:'#6b4a2e',colors:['#6b4a2e','#1b1b1b','#c9b28a','#3a3f45','#8a3b2a'],seat:true,foot:[.24,.24],
      build(g,e,p){const c=C(p.color);bxp(g,.46,.05,.44,0,.45,0,c,8,.5);bxp(g,.44,.42,.035,0,.72,-.21,c,8,.5,rotX(-.08));
        for(const [x,z] of [[-.2,.19],[.2,.19],[-.2,-.19],[.2,-.19]])cyp(g,.017,.014,.43,x,0,z,dk(c,.8),8,.5,8);
        for(const x of [-.2,.2])cyp(g,.014,.014,.5,x,.45,-.2,dk(c,.8),8,.5,8)}},
    stool:{label:'Bar stool',group:'Seating',color:'#1b1b1b',colors:['#1b1b1b','#6b4a2e','#c9b28a','#8a8d91'],foot:[.2,.2],
      build(g,e,p){const c=C(p.color);cyp(g,.18,.17,.05,0,.72,0,c,8,.45,24);for(let k=0;k<4;k++){const a=k*PI/2+PI/4;g.push(...prim.cyl(.012,.012,.74,6,false),m4.mul(T(Math.cos(a)*.17,0,Math.sin(a)*.17),rotZ(0)),C('#2a2c2f'),7,.35,1)}
        g.push(...prim.cyl(.19,.19,.015,24,false),T(0,.28,0),C('#2a2c2f'),7,.35,1)}},
    sidetable:{label:'Side table',group:'Tables',color:'#4a3222',colors:['#4a3222','#1b1b1b','#c9b28a','#8a8d91'],surface:.58,foot:[.24,.24],
      build(g,e,p){const c=C(p.color);cyp(g,.24,.24,.03,0,.55,0,c,8,.35,28);cyp(g,.025,.025,.55,0,0,0,dk(c,.6),8,.4,10);cyp(g,.16,.16,.02,0,0,0,dk(c,.6),8,.4,24);
        cyp(g,.04,.04,.1,.08,.58,.05,C('#d8d2c8'),8,.25,16);cyp(g,.045,.012,.08,-.08,.58,-.04,C('#c9b28a'),8,.1,16);cyp(g,.012,.045,.08,-.08,.66,-.04,C('#c9b28a'),8,.1,16)}},
    coffeetable:{label:'Coffee table',group:'Tables',color:'#3b2a1e',colors:['#3b2a1e','#1b1b1b','#c9b28a','#d8d2c8'],surface:.42,foot:[.55,.3],
      build(g,e,p){const c=C(p.color);bxp(g,1.1,.04,.6,0,.4,0,c,8,.35);for(const [x,z] of [[-.5,.25],[.5,.25],[-.5,-.25],[.5,-.25]])bxp(g,.04,.38,.04,x,.19,z,dk(c,.8),8,.4);
        const R=seeded(p.id||3);books(g,-.25,.05,.42,.02,.2,R)}},
    desk:{label:'Desk',group:'Tables',color:'#2b2622',colors:['#2b2622','#c9b28a','#d8d2c8','#1b1b1b','#6b4a2e'],surface:.76,foot:[.75,.4],
      build(g,e,p){const c=C(p.color);bxp(g,1.5,.04,.78,0,.74,0,c,8,.3);for(const x of [-.7,.7]){bxp(g,.05,.72,.05,x,.36,.33,C('#1d1e20'),7,.4);bxp(g,.05,.72,.05,x,.36,-.33,C('#1d1e20'),7,.4);bxp(g,.05,.05,.7,x,.05,0,C('#1d1e20'),7,.4)}}},
    roundtable:{label:'Round table',group:'Tables',color:'#c9b28a',colors:['#c9b28a','#2b2622','#d8d2c8','#6b4a2e'],surface:.76,foot:[.46,.46],
      build(g,e,p){const c=C(p.color);cyp(g,.46,.46,.035,0,.73,0,c,8,.35,36);cyp(g,.05,.05,.72,0,0,0,C('#1d1e20'),7,.35,12);cyp(g,.26,.24,.03,0,0,0,C('#1d1e20'),7,.35,24)}},
    bookshelf:{label:'Bookshelf',group:'Storage',color:'#3b2a1e',colors:['#3b2a1e','#1b1b1b','#c9b28a','#d8d2c8','#2f3b3a'],foot:[.53,.18],
      build(g,e,p){const c=C(p.color);const R=seeded(p.id||5);bxp(g,.03,1.9,.34,-.52,.95,0,c,10,.7);bxp(g,.03,1.9,.34,.52,.95,0,c,10,.7);bxp(g,1.04,1.9,.02,0,.95,-.16,dk(c,.6),10,.7);
        for(let s=0;s<5;s++){const y=.04+s*.46;bxp(g,1.04,.03,.34,0,y,0,c,10,.7);if(s<4)books(g,-.48,.48,y+.015,.02,.26,R)}}},
    cabinet:{label:'Sideboard',group:'Storage',color:'#3b2a1e',colors:['#3b2a1e','#1b1b1b','#d8d2c8','#40503f','#c9b28a'],surface:.72,foot:[.8,.23],
      build(g,e,p){const c=C(p.color);bxp(g,1.6,.55,.45,0,.42,0,c,8,.45);for(let i=0;i<3;i++)bxp(g,.5,.47,.01,-.53+i*.53,.42,.226,dk(c,.85),8,.45);
        for(const [x,z] of [[-.72,.18],[.72,.18],[-.72,-.18],[.72,-.18]])cyp(g,.018,.012,.15,x,0,z,C('#1a120c'),7,.4,8)}},
    plant:{label:'Floor plant',group:'Decor',color:'#2b2622',colors:['#2b2622','#d8d2c8','#8a5a3c','#1b1b1b'],foot:[.3,.3],
      build(g,e,p){const R=seeded(p.id||9);cyp(g,.19,.24,.42,0,0,0,C(p.color),0,.8,24);
        for(let i=0;i<150;i++){const a=R()*2*PI,rr=.05+R()*.42,hy=.55+R()*1.05*(1-rr*.6);const sz=.07+R()*.07;const m=m4.mul(m4.mul(T(Math.cos(a)*rr*.8,hy,Math.sin(a)*rr*.6),rotY(R()*PI*2)),rotX(-.6+R()*1.2));
          g.push(...prim.sphere(sz,7,4),m4.mul(m,TRS(0,0,0,0,[1,.12,.45])),[.12+R()*.08,.28+R()*.12,.1+R()*.05],9,.55,.85)}
        for(let i=0;i<9;i++){const a=R()*2*PI;g.push(...prim.cyl(.008,.004,.9+R()*.5,5,false),m4.mul(T(Math.cos(a)*.05,.4,Math.sin(a)*.05),rotZ((R()-.5)*.5)),[.2,.25,.12],0,.7,1)}}},
    smallplant:{label:'Small plant',group:'Decor',color:'#d8d2c8',colors:['#d8d2c8','#2b2622','#8a5a3c'],small:true,foot:[.1,.1],
      build(g,e,p){const R=seeded(p.id||11);cyp(g,.07,.055,.12,0,0,0,C(p.color),8,.4,16);for(let i=0;i<34;i++){const a=R()*2*PI,rr=R()*.1,hy=.12+R()*.2;const m=m4.mul(m4.mul(T(Math.cos(a)*rr,hy,Math.sin(a)*rr),rotY(R()*6)),rotX(-.6+R()*1.2));
        g.push(...prim.sphere(.035+R()*.02,6,4),m4.mul(m,TRS(0,0,0,0,[1,.14,.5])),[.12+R()*.08,.3+R()*.12,.1],9,.55,.85)}}},
    floorlamp:{label:'Floor lamp',group:'Practicals',color:'#f3e6cf',colors:['#f3e6cf','#e8c9a0','#d9d2c4','#b8a58a'],lamp:{y:1.45,size:.35,power:.9},foot:[.18,.18],
      build(g,e,p){cyp(g,.16,.16,.025,0,0,0,C('#1a1715'),7,.4,24);g.push(...prim.cyl(.012,.012,1.42,10,false),T(0,.02,0),C('#1a1715'),7,.35,1);
        e.push(...prim.cyl(.2,.17,.3,28,false),T(0,1.3,0),C(p.color),4,.8,1)}},
    tablelamp:{label:'Table lamp',group:'Practicals',color:'#efe3cc',colors:['#efe3cc','#e8c9a0','#d9d2c4'],small:true,lamp:{y:.42,size:.2,power:.45},foot:[.12,.12],
      build(g,e,p){cyp(g,.07,.09,.2,0,0,0,C('#3b3530'),8,.3,20);g.push(...prim.cyl(.008,.008,.14,8,false),T(0,.2,0),C('#b09060'),7,.3,1);
        e.push(...prim.cyl(.15,.11,.2,24,false),T(0,.32,0),C(p.color),4,.8,1)}},
    neon:{label:'Neon sign',group:'Practicals',color:'#ff3fa4',colors:['#ff3fa4','#3fd8ff','#ffb13f','#9dff5c','#ffffff'],wall:true,depth:.06,y:1.7,lamp:{y:0,size:.5,power:.35,neon:true},
      build(g,e,p){bxp(g,.9,.36,.02,0,0,-.02,[.03,.03,.03],8,.3);const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push([-.36+t*.72,Math.sin(t*PI*2.4)*.09+(t>.5?.03:-.03)])}
        for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);e.push(...prim.cyl(.009,.009,L,6,false),m4.mul(T(a[0],a[1],0),rotZ(Math.atan2(dx,dy)*-1)),C(p.color),4,.5,1)}}},
    tv:{label:'Screen',group:'Decor',color:'#2a4a7a',colors:['#2a4a7a','#1a1a1a','#7a3a2a','#2a6a5a'],wall:true,depth:.06,y:1.45,
      build(g,e,p){bxp(g,1.24,.72,.04,0,0,0,[.02,.02,.02],8,.2);e.push(...prim.quadXY(1.18,.66),T(0,-.33,.021),C(p.color),4,.3,1)}},
    art:{label:'Framed art',group:'Decor',color:'#b8643c',colors:['#b8643c','#2f4d6a','#8a8d5a','#d8d2c8','#6a2f4d'],wall:true,depth:.04,y:1.55,
      build(g,e,p){const c=C(p.color);bxp(g,.8,.6,.03,0,0,0,[.03,.03,.03],8,.3);bxp(g,.7,.5,.01,0,0,.016,[.85,.83,.8],0,.9);bxp(g,.4,.3,.005,-.04,.02,.022,c,0,.9);bxp(g,.18,.36,.005,.18,-.02,.023,dk(c,.5),0,.9)}},
    shelf:{label:'Wall shelf',group:'Storage',color:'#3b2a1e',colors:['#3b2a1e','#1b1b1b','#d8d2c8'],wall:true,depth:.24,y:1.5,
      build(g,e,p){const c=C(p.color);const R=seeded(p.id||13);bxp(g,1.1,.03,.24,0,0,0,c,10,.6);books(g,-.5,.1,.015,0,.18,R);cyp(g,.05,.04,.18,.3,.015,0,C('#d8d2c8'),8,.25,14)}},
    curtain:{label:'Curtains',group:'Walls',color:'#6b5a48',colors:['#6b5a48','#d8d2c8','#2a2f3a','#6b2e2a','#40503f','#1b1b1b'],wall:true,depth:.12,y:0,
      build(g,e,p){const c=C(p.color);const n=14,W=1.8;for(let i=0;i<n;i++){const x=-W/2+(i+.5)*W/n;const ang=(i%2?.55:-.55);bxp(g,W/n*1.08,2.7,.012,x,1.36,0,dk(c,.9+.1*(i%2)),0,.95,rotY(ang))}
        bxp(g,W+.2,.03,.03,0,2.74,0,C('#1a1715'),7,.4)}},
    rug:{label:'Rug',group:'Decor',color:'#6b3322',colors:['#6b3322','#3a4a5a','#a39a86','#2b2622','#5a6a4a'],flat:true,foot:[1.2,.85],
      build(g,e,p){g.push(...prim.box(2.4,.012,1.7),T(0,.006,0),C(p.color),11,.95,1)}},
    books:{label:'Books',group:'Decor',color:'#5b2a22',colors:['#5b2a22','#27394a','#a3997e'],small:true,foot:[.14,.12],
      build(g,e,p){const R=seeded(p.id||17);let y=0;for(let i=0;i<4;i++){const h=.03+R()*.02;bxp(g,.24-R()*.05,h,.17-R()*.03,(R()-.5)*.02,y+h/2,0,C(BOOKC[Math.floor(R()*BOOKC.length)]),0,.8,rotY((R()-.5)*.3));y+=h}}},
    vase:{label:'Vase',group:'Decor',color:'#d8d2c8',colors:['#d8d2c8','#2f4d6a','#b8643c','#1b1b1b'],small:true,foot:[.08,.08],
      build(g,e,p){cyp(g,.06,.09,.16,0,0,0,C(p.color),8,.25,20);cyp(g,.09,.04,.12,0,.16,0,C(p.color),8,.25,20);for(let i=0;i<6;i++)g.push(...prim.cyl(.004,.004,.35,4,false),m4.mul(T(0,.2,0),rotZ((i-2.5)*.08)),[.25,.3,.12],0,.7,1)}},
    mic:{label:'Podcast mic',group:'Decor',color:'#1b1b1b',colors:['#1b1b1b','#8a8d91'],small:true,foot:[.1,.1],
      build(g,e,p){const c=C(p.color);bxp(g,.06,.06,.08,0,.03,-.2,C('#2a2c2f'),7,.4);g.push(...prim.cyl(.009,.009,.42,8,false),m4.mul(T(0,.06,-.2),rotX(.35)),C('#2a2c2f'),7,.35,1);
        g.push(...prim.cyl(.008,.008,.34,8,false),m4.mul(T(0,.45,-.06),rotX(1.35)),C('#2a2c2f'),7,.35,1);g.push(...prim.cyl(.028,.028,.16,16),m4.mul(T(0,.44,.28),rotX(1.9)),c,7,.35,1)}},
    backdrop:{label:'Paper backdrop',group:'Walls',color:'#5a6068',colors:['#5a6068','#d8d2c8','#1b1b1b','#2f4d6a','#7a5a3e','#8a2f2a'],foot:[1.4,.9],
      build(g,e,p){const c=C(p.color);g.push(...prim.quadXY(2.72,2.6),T(0,.4,-.6),c,0,.97,1);for(let i=0;i<8;i++){const a0=i/8*PI/2,a1=(i+1)/8*PI/2;const y0=.4-Math.sin(a0)*.4,z0=-.6+(1-Math.cos(a0))*.4,y1=.4-Math.sin(a1)*.4,z1=-.6+(1-Math.cos(a1))*.4;
          const n0=[0,Math.sin(a0),Math.cos(a0)],n1=[0,Math.sin(a1),Math.cos(a1)];g.push([-1.36,y0,z0,1.36,y0,z0,1.36,y1,z1,-1.36,y1,z1],[...n0,...n0,...n1,...n1],[0,2,1,0,3,2],null,c,0,.97,1)}
        g.push(...prim.plane(2.72,1.4),T(0,.002,.5),c,0,.97,1);cyp(g,.03,.03,2.9,-1.45,0,-.62,C('#2a2c2f'),7,.4,8);cyp(g,.03,.03,2.9,1.45,0,-.62,C('#2a2c2f'),7,.4,8);
        g.push(...prim.cyl(.045,.045,2.9,12),m4.mul(T(-1.45,2.9,-.62),rotZ(-PI/2)),c,0,.9,1)}}
  };
  const props=[];let propId=1;
  function buildProp(p){(p.objs||[]).forEach(removeObj);p.objs=[];const D=PROPS[p.type];const g=new Geo(),e=new Geo();D.build(g,e,p);
    if(g.count)p.objs.push(addObj(geoMesh(g),m4.id(),{layer:'prop',propId:p.id,cast:!D.flat}));
    if(e.count){const eo=addObj(geoMesh(e),m4.id(),{layer:'prop',propId:p.id,cast:false});eo.propEmit=p;p.objs.push(eo)}}
  function surfaceAt(x,z,self){let y=0;for(const q of props){if(q===self||!PROPS[q.type].surface)continue;const D=PROPS[q.type];const f=D.foot||[.3,.3];const c=Math.cos(q.ry||0),s=Math.sin(q.ry||0);const dx=x-q.x,dz=z-q.z;const lx=c*dx-s*dz,lz=s*dx+c*dz;
      if(Math.abs(lx)<=f[0]&&Math.abs(lz)<=f[1])y=Math.max(y,D.surface)}return y}
  function placeProp(p){const D=PROPS[p.type];if(D.small)p.y=surfaceAt(p.x,p.z,p);const M=TRS(p.x,p.y||0,p.z,p.ry||0);p.objs.forEach(o=>setM(o,M))}
  function addProp(type,o){const D=PROPS[type];if(!D)return null;const p=Object.assign({id:propId++,type,x:0,z:-1.4,y:D.y||0,ry:0,color:D.color,on:true,int:1,k:2700},o||{});
    if(!p.color||!/^#[0-9a-f]{6}$/i.test(p.color))p.color=D.color;props.push(p);buildProp(p);if(D.wall){if(o&&o.y==null)p.y=D.y||0;snapWall(p)}placeProp(p);shadowDirty.fill(true);dirty=true;return p}
  function removeProp(id){const i=props.findIndex(p=>p.id===id);if(i<0)return;props[i].objs.forEach(removeObj);props.splice(i,1);shadowDirty.fill(true);dirty=true}
  function touchProp(p,rebuild){if(rebuild)buildProp(p);if(PROPS[p.type].wall)snapWall(p);placeProp(p);props.forEach(q=>{if(q!==p&&PROPS[q.type].small)placeProp(q)});shadowDirty.fill(true);dirty=true}
  function clearProps(){props.slice().forEach(p=>removeProp(p.id))}
  function propLights(){const out=[];for(const p of props){const D=PROPS[p.type];if(!D.lamp||!p.on)continue;const [x,z]=rotPt(p.x,p.z,p.ry||0,0,D.lamp.neon?.1:0);let c=D.lamp.neon?srgb(p.color).map(v=>Math.pow(v,2.2)*2.2):kelvin(p.k||2700);
      out.push({p:[x,(p.y||0)+D.lamp.y,z],col:v3.mul(c,(p.int==null?1:p.int)*D.lamp.power),size:D.lamp.size})}return out}
  function propEmit(p,isMonitor){const D=PROPS[p.type];if(p.type==='tv')return v3.mul(srgb(p.color).map(v=>Math.pow(v,2.2)),1.6*(isMonitor?1:.5));if(!D.lamp||!p.on)return [0,0,0];
    const c=D.lamp.neon?srgb(p.color).map(v=>Math.pow(v,2.2)):kelvin(p.k||2700);return v3.mul(c,(p.int==null?1:p.int)*(D.lamp.neon?9:2.2)*(isMonitor?1:.5))}

  /* ----- fixtures ----- */
  const fixMeshes={};
  function fixtureMesh(type){if(fixMeshes[type])return fixMeshes[type];const g=new Geo(),e=new Geo();const blk=srgb('#16181a'),mt=srgb('#2a2c2f');
    if(type==='octa'){g.push(...prim.frustum(.12,.12,.58,.58,.42,8),T(0,0,-.42),blk,0,.9,1);e.push(...prim.poly(.575,8,-.005),T(0,0,0),[1,1,1],4,.5,1);g.push(...prim.cyl(.09,.09,.18,16),m4.mul(T(0,0,-.6),rotX(PI/2)),mt,7,.4,1)}
    else if(type==='softbox'){g.push(...prim.frustum(.09,.09,.3,.45,.38,4),T(0,0,-.38),blk,0,.9,1);e.push(...prim.poly(1,4,-.005),TRS(0,0,0,0,[.3,.45,1]),[1,1,1],4,.5,1);g.push(...prim.cyl(.08,.08,.16,16),m4.mul(T(0,0,-.54),rotX(PI/2)),mt,7,.4,1)}
    else if(type==='strip'){g.push(...prim.frustum(.06,.2,.15,.6,.25,4),T(0,0,-.25),blk,0,.9,1);e.push(...prim.poly(1,4,-.005),TRS(0,0,0,0,[.15,.6,1]),[1,1,1],4,.5,1)}
    else if(type==='fresnel'||type==='bgspot'){const s=type==='bgspot'?.7:1;g.push(...prim.cyl(.1*s,.1*s,.28*s,20),m4.mul(T(0,0,-.28*s),rotX(PI/2)),blk,7,.5,1);e.push(...prim.disc(.085*s,20),T(0,0,.005),[1,1,1],4,.3,1);
      for(let k=0;k<4;k++){const a=k*PI/2;g.push(...prim.box(.2*s,.14*s,.006),m4.mul(m4.mul(TR(0,0,0,0),rotZ(a)),m4.mul(T(0,.1*s,.005),m4.mul(rotX(-.5),T(0,.07*s,0)))),blk,0,.8,1)}
      g.push(...prim.box(.03,.3*s,.03),T(0,-.15*s,-.14*s),mt,7,.4,1)}
    else if(type==='tube'){e.push(...prim.cyl(.018,.018,1.2,12),T(0,-.6,0),[1,1,1],4,.5,1);g.push(...prim.cyl(.022,.022,.04,12),T(0,.6,0),blk,7,.5,1);g.push(...prim.cyl(.022,.022,.04,12),T(0,-.64,0),blk,7,.5,1)}
    else if(type==='lantern'){e.push(...prim.sphere(.3,20,14),T(0,0,0),[1,1,1],4,.6,1);g.push(...prim.cyl(.008,.008,.35,6,false),T(0,.28,0),blk,7,.4,1)}
    else if(type==='window'){const fr=srgb('#e8e4dc'),W=1.1,H=1.5;g.push(...prim.box(W+.14,.05,.12),T(0,-H/2-.025,.03),fr,8,.5,1);g.push(...prim.box(W+.1,.05,.06),T(0,H/2+.025,0),fr,8,.5,1);
      g.push(...prim.box(.05,H,.06),T(-W/2-.025,0,0),fr,8,.5,1);g.push(...prim.box(.05,H,.06),T(W/2+.025,0,0),fr,8,.5,1);g.push(...prim.box(.03,H,.04),T(0,0,0),fr,8,.5,1);g.push(...prim.box(W,.03,.04),T(0,.12,0),fr,8,.5,1);
      e.push(...prim.quadXY(W,H),T(0,-H/2,-.012),[1,1,1],4,.5,1)}
    else if(type==='bounce'){g.push(...prim.cyl(.52,.52,.01,32),m4.mul(T(0,0,0),rotX(PI/2)),srgb('#e9e6df'),8,.6,1);g.push(...prim.cyl(.53,.53,.012,32,false),m4.mul(T(0,0,-.001),rotX(PI/2)),blk,0,.6,1)}
    const r={body:g.P.length?geoMesh(g):null,emit:e.P.length?geoMesh(e):null};fixMeshes[type]=r;return r}
  let standMesh=null,poleMesh=null,armMesh=null;
  function standMeshes(){if(standMesh)return;const g=new Geo(),mt=srgb('#2a2c2f');
    for(let k=0;k<3;k++){const a=k/3*2*PI;const foot=[Math.cos(a)*.42,0,Math.sin(a)*.42],hub=[0,.55,0];const d=v3.sub(hub,foot),L=v3.len(d);g.push(...prim.cyl(.011,.011,L,6,false),m4.frame(foot,[0,0,1],null)&&m4.mul(T(foot[0],0,foot[2]),m4.mul(rotY(-a),rotZ(Math.atan2(.42,.55)))),mt,7,.45,1)}
    g.push(...prim.cyl(.022,.022,.08,10),T(0,.5,0),mt,7,.4,1);standMesh=geoMesh(g);
    const p=new Geo();p.push(...prim.cyl(.014,.014,1,8,false),T(0,0,0),mt,7,.35,1);poleMesh=geoMesh(p);
    const a=new Geo();a.push(...prim.cyl(.011,.011,1,6,false),m4.mul(T(0,0,0),rotZ(-PI/2)),mt,7,.35,1);armMesh=geoMesh(a)}
  // camera rig mesh
  let camRig=null;
  function camRigMeshes(){const g=new Geo(),mt=srgb('#1c1d20'),bd=srgb('#101113');
    g.push(...prim.box(.13,.14,.22),T(0,0,-.05),bd,7,.5,1);g.push(...prim.cyl(.05,.05,.16,20),m4.mul(T(0,0,.06),rotX(PI/2)),mt,7,.35,1);g.push(...prim.frustum(.07,.05,.13,.09,.12,4),T(0,0,.22),bd,0,.8,1);
    g.push(...prim.box(.03,.03,.16),T(0,.1,-.02),mt,7,.4,1);g.push(...prim.box(.12,.08,.012),m4.mul(T(-.1,.06,-.1),rotY(-.4)),srgb('#0a0a0a'),8,.1,1);
    const head=geoMesh(g);const t=new Geo();for(let k=0;k<3;k++){const a=k/3*2*PI+PI/2;t.push(...prim.cyl(.013,.01,1,6,false),m4.mul(T(Math.cos(a)*.4,0,Math.sin(a)*.4),m4.mul(rotY(-a),rotZ(Math.atan2(.4,1)))),mt,7,.45,1)}
    t.push(...prim.cyl(.05,.06,.12,12),T(0,.92,0),bd,7,.4,1);camRig={head,legs:geoMesh(t)}}
  standMeshes();camRigMeshes();

  /* ----- state ----- */
  let lights=[];let nextId=1;
  const S={cam:{x:.42,z:1.95,h:1.3,f:85,T:2.8,wb:5600,iso:800},haze:.15,fc:false,view:'monitor',focus:0};
  function defaults(type){const F=FIX[type];return {id:nextId++,type,name:F.short,x:-1,z:1,h:1.6,int:.7,k:5600,soft:F.soft?.7:.3,beam:F.beam?30:null,on:true,target:'face',feather:0,rgb:null,tint:0,reflect:.6}}
  function addLight(type,props){const L=Object.assign(defaults(type),props||{});lights.push(L);buildLightObjects(L);assignTiles();shadowDirty.fill(true);dirty=true;return L}
  function removeLight(id){const i=lights.findIndex(l=>l.id===id);if(i<0)return;const L=lights[i];L.objs.forEach(o=>{const k=objects.indexOf(o);if(k>=0)objects.splice(k,1)});lights.splice(i,1);assignTiles();shadowDirty.fill(true);dirty=true}
  function buildLightObjects(L){standMeshes();const fm=fixtureMesh(L.type);L.objs=[];
    L.oStand=addObj(standMesh,m4.id(),{layer:'fixture',cast:false,lightId:L.id});L.oPole=addObj(poleMesh,m4.id(),{layer:'fixture',cast:false,lightId:L.id});L.objs.push(L.oStand,L.oPole);
    if(L.type==='lantern'){L.oArm=addObj(armMesh,m4.id(),{layer:'fixture',cast:false,lightId:L.id});L.objs.push(L.oArm)}
    if(fm.body){L.oBody=addObj(fm.body,m4.id(),{layer:'fixture',cast:L.type==='bounce',lightId:L.id});L.objs.push(L.oBody)}
    if(fm.emit){L.oEmit=addObj(fm.emit,m4.id(),{layer:'fixture',cast:false,lightId:L.id});L.objs.push(L.oEmit)}
    if(FIX[L.type].wall){L.oStand.visible=false;L.oPole.visible=false;if(L.oBody)L.oBody.cast=false;snapWallLight(L)}}
  function aimPoint(L){if(L.target==='wall')return [L.x*.35,1.35,room.back];if(L.target==='chest')return CHEST;if(L.target==='down')return [L.x,0,L.z];if(L.target==='face2'&&people[1])return HEAD2;return HEAD}
  function lightFrame(L){if(FIX[L.type].wall){const wn=L.wn||[0,0,1];const p=[L.x+wn[0]*.14,L.h,L.z+wn[2]*.14];const t=aimPoint(L);const a=v3.norm(v3.sub(t,p));return {p,d:v3.norm(v3.add(v3.mul(wn,.55),v3.mul(a,.45)))}}
    const p=[L.x,L.h,L.z];let t=aimPoint(L);let d=v3.norm(v3.sub(t,p));if(L.feather){const a=L.feather*D2R,c=Math.cos(a),s=Math.sin(a);d=[d[0]*c-d[2]*s,d[1],d[0]*s+d[2]*c]}if(L.type==='tube'||L.type==='lantern')d=v3.norm([d[0],0,d[2]]);return {p,d}}
  function updateLightObjects(L){if(FIX[L.type].wall){snapWallLight(L);const M=m4.frame([L.x,L.h,L.z],L.wn||[0,0,1],[0,1,0]);if(L.oBody)setM(L.oBody,M);if(L.oEmit)setM(L.oEmit,M);return}
    const {p,d}=lightFrame(L);const tilt=L.type==='tube'?0:0;
    setM(L.oStand,T(L.x,0,L.z));
    if(L.type==='lantern'){const ax=L.x-d[0]*.9,az=L.z-d[2]*.9;setM(L.oStand,T(ax,0,az));setM(L.oPole,TRS(ax,.5,az,0,[1,Math.max(.1,L.h+.35-.5),1]));const armLen=Math.hypot(L.x-ax,L.z-az);setM(L.oArm,m4.mul(T(ax,L.h+.35,az),m4.mul(rotY(-Math.atan2(L.z-az,L.x-ax)),TRS(0,0,0,0,[armLen,1,1]))));setM(L.oEmit,T(L.x,L.h,L.z));return}
    setM(L.oPole,TRS(L.x,.5,L.z,0,[1,Math.max(.05,L.h-.5-(L.type==='tube'?.6:.12)),1]));
    const M=m4.frame(p,d,[0,1,0]);if(L.oBody)setM(L.oBody,M);if(L.oEmit)setM(L.oEmit,L.type==='tube'?T(L.x,L.h,L.z):M);if(L.type==='tube'&&L.oBody)setM(L.oBody,T(L.x,L.h,L.z))}
  // camera rig objects
  const oCamLegs=addObj(camRig.legs,m4.id(),{layer:'fixture',cast:false,cam:true}),oCamHead=addObj(camRig.head,m4.id(),{layer:'fixture',cast:false,cam:true});
  function camFrame(){const c=S.cam,p=[c.x,c.h,c.z];const t=[HEAD[0],HEAD[1]-.06+(c.h-HEAD[1])*.25,HEAD[2]];return {p,d:v3.norm(v3.sub(t,p))}}
  function updateCamObjects(){const {p,d}=camFrame();setM(oCamHead,m4.frame(v3.sub(p,v3.mul(d,.13)),d,[0,1,0]));setM(oCamLegs,TRS(S.cam.x,0,S.cam.z,0,[1,Math.max(.3,S.cam.h-.12)/1,1]))}

  /* ----- shadow atlas ----- */
  const ATLAS=MOB?2048:2048,TILE=512,TPR=ATLAS/TILE;
  const shTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,ATLAS,ATLAS,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const shFB=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shFB);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const shadowDirty=new Array(16).fill(true);
  function assignTiles(){let t=0;lights.forEach(L=>{L.tile=(FIX[L.type].kind===1||L.type==='bounce')?-1:(t<TPR*TPR?t++:-1)})}
  function lightShadowCam(L){const {p,d}=lightFrame(L);const toS=v3.len(v3.sub(HEAD,p));const F=FIX[L.type];let fov=Math.min(115,Math.max(2*Math.atan(1.25/toS)/D2R,(F.beam?(L.beam||30)+14:40)));
    const V=m4.look(p,v3.add(p,d),Math.abs(d[1])>.97?[0,0,1]:[0,1,0]);const n=.12,f=9;const P=m4.persp(fov*D2R,1,n,f);return {VP:m4.mul(P,V),tanH:Math.tan(fov*D2R/2),n,f}}
  function renderShadows(){let any=false;
    for(const L of lights){if(L.tile<0||!L.on||!shadowDirty[L.tile])continue;any=true;const sc=lightShadowCam(L);L.sc=sc;
      gl.bindFramebuffer(gl.FRAMEBUFFER,shFB);const tx=L.tile%TPR,ty=Math.floor(L.tile/TPR);gl.viewport(tx*TILE,ty*TILE,TILE,TILE);gl.enable(gl.SCISSOR_TEST);gl.scissor(tx*TILE,ty*TILE,TILE,TILE);gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.SCISSOR_TEST);
      gl.useProgram(PD.p);gl.uniformMatrix4fv(PD.U.uVP,false,sc.VP);gl.enable(gl.DEPTH_TEST);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,3);gl.disable(gl.CULL_FACE);
      for(const o of objects){if(!o.cast||!o.visible||o.alphaTest)continue;gl.uniformMatrix4fv(PD.U.uM,false,o.M);gl.bindVertexArray(o.mesh.vao);gl.drawElements(gl.TRIANGLES,o.mesh.count,o.mesh.type,o.mesh.offset||0)}
      gl.useProgram(PDA.p);gl.uniformMatrix4fv(PDA.U.uVP,false,sc.VP);gl.uniform1i(PDA.U.uAlbT,1);gl.activeTexture(gl.TEXTURE1);
      for(const o of objects){if(!o.cast||!o.visible||!o.alphaTest)continue;gl.bindTexture(gl.TEXTURE_2D,o.tex.a);gl.uniformMatrix4fv(PDA.U.uM,false,o.M);gl.bindVertexArray(o.mesh.vao);gl.drawElements(gl.TRIANGLES,o.mesh.count,o.mesh.type,o.mesh.offset||0)}gl.activeTexture(gl.TEXTURE0);
      gl.disable(gl.POLYGON_OFFSET_FILL);shadowDirty[L.tile]=false}
    lights.forEach(L=>{if(!L.sc)L.sc=lightShadowCam(L)});gl.bindFramebuffer(gl.FRAMEBUFFER,null)}

  /* ----- light uniforms ----- */
  function lightUniformData(){const pos=[],dir=[],col=[],par=[],par2=[],mat=[],tile=[];let n=0;
    const push=(p,d,c,pa,pa2,M,ti)=>{pos.push(...p);dir.push(...d);col.push(...c);par.push(...pa);par2.push(...pa2);mat.push(...(M||m4.id()));tile.push(...ti);n++};
    // active lights; bounce computed after
    const incident=(pt,nrm)=>{let E=[0,0,0];for(const L of lights){if(!L.on||L.type==='bounce')continue;const F=FIX[L.type];const {p,d}=lightFrame(L);const Lv=v3.sub(p,pt),dd=v3.len(Lv),Ld=v3.mul(Lv,1/dd);const cosN=Math.max(0,v3.dot(nrm,Ld));
      const cd=v3.dot(v3.mul(Ld,-1),d);const co=Math.cos(F.outer*D2R/2*(L.beam&&F.beam?L.beam/F.outer*1:1)),ci=Math.cos(F.inner*D2R/2);let cone=F.kind===1?1:Math.min(1,Math.max(0,(cd-co)/Math.max(1e-3,ci-co)));
      const c=kelvin(L.k);const pw=L.int*F.power/(dd*dd)*cosN*cone;E=v3.add(E,v3.mul(c,pw))}return E};
    for(const L of lights){if(!L.on)continue;const F=FIX[L.type];const {p,d}=lightFrame(L);let c;
      if(L.type==='bounce'){const E=incident(p,d);c=v3.mul(E,L.reflect*.55*(L.int/.7))}
      else{c=kelvin(L.k);if(L.rgb){const h=L.rgb;c=[c[0]*h[0],c[1]*h[1],c[2]*h[2]]}c=v3.mul(c,L.int*F.power)}
      let outer=F.outer,inner=F.inner;if(F.beam&&L.beam){outer=L.beam;inner=L.beam*.55}
      const size=F.soft?F.size*(.35+.65*L.soft):F.size;
      const tile=L.tile>=0?[(L.tile%TPR)/TPR,Math.floor(L.tile/TPR)/TPR,1/TPR,1]:[0,0,0,0];
      push(p,d,c,[Math.cos(outer*D2R/2),Math.cos(inner*D2R/2),size,F.kind],[size,L.sc?L.sc.tanH:1,L.sc?L.sc.n:.1,L.sc?L.sc.f:9],L.sc?L.sc.VP:null,tile)}
    for(const pr of propLights()){if(n>=MAXL)break;push(pr.p,[0,-1,0],pr.col,[-1,-1,pr.size,1],[pr.size,1,.1,9],null,[0,0,0,0])}
    return {n,pos,dir,col,par,par2,mat,tile}}

  /* ----- render targets ----- */
  function makeRT(w,h,withDepth,fmt){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,fmt||(HDR?gl.RGBA16F:gl.RGBA8),w,h,0,gl.RGBA,HDR&&!fmt?gl.HALF_FLOAT:gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);let d=null;
    if(withDepth){d=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,d);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,d,0)}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);return {t,fb,d,w,h}}
  function freeRT(r){if(!r)return;gl.deleteTexture(r.t);gl.deleteFramebuffer(r.fb);if(r.d)gl.deleteTexture(r.d)}
  const RTs={};
  function rts(key,w,h){let R=RTs[key];if(R&&R.w===w&&R.h===h)return R;if(R){freeRT(R.scene);freeRT(R.dof);freeRT(R.b1);freeRT(R.b2)}
    const bw=Math.max(2,w>>2),bh=Math.max(2,h>>2);R={w,h,scene:makeRT(w,h,true),dof:makeRT(w,h,false),b1:makeRT(bw,bh,false),b2:makeRT(bw,bh,false)};RTs[key]=R;return R}

  /* ----- cameras ----- */
  const setCam={yaw:.5,pitch:.5,dist:5.6,tx:0,ty:.8,tz:-.2,top:false};
  function monitorCam(aspect){const {p,d}=camFrame();const f=S.cam.f;const fovy=2*Math.atan((18/f)/aspect);const V=m4.look(p,v3.add(p,d),[0,1,0]);const n=.05,fr=20;return {pos:p,V,P:m4.persp(fovy,aspect,n,fr),n,f:fr,fovy}}
  function setViewCam(aspect){let p,V,P;const t=[setCam.tx,setCam.ty,setCam.tz];
    if(setCam.top){p=[t[0],9,t[2]+.001];V=m4.look(p,[t[0],0,t[2]],[0,0,-1]);const hh=setCam.dist*.55;P=m4.ortho(-hh*aspect,hh*aspect,-hh,hh,.1,30)}
    else{const cp=Math.cos(setCam.pitch);p=[t[0]+Math.sin(setCam.yaw)*cp*setCam.dist,t[1]+Math.sin(setCam.pitch)*setCam.dist,t[2]+Math.cos(setCam.yaw)*cp*setCam.dist];V=m4.look(p,t,[0,1,0]);P=m4.persp(45*D2R,aspect,.05,40)}
    return {pos:p,V,P,n:.05,f:40}}

  /* ----- draw scene ----- */
  let LU=null;
  function drawScene(cam,isMonitor,target){
    gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.fb:null);gl.viewport(0,0,target.w,target.h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(PM.p);const U=PM.U;const VP=m4.mul(cam.P,cam.V);
    gl.uniformMatrix4fv(U.uVP,false,VP);gl.uniform3fv(U.uCam,cam.pos);gl.uniform1i(U.uNL,LU.n);
    if(LU.n){gl.uniform3fv(U.uLPos,LU.pos);gl.uniform3fv(U.uLDir,LU.dir);gl.uniform3fv(U.uLCol,LU.col);gl.uniform4fv(U.uLPar,LU.par);gl.uniform4fv(U.uLPar2,LU.par2);gl.uniformMatrix4fv(U.uLMat,false,LU.mat);gl.uniform4fv(U.uLTile,LU.tile);}
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);gl.uniform1i(U.uShadow,0);gl.uniform1f(U.uAtlas,ATLAS);
    // ambient from total light energy
    let E=[0,0,0];for(let i=0;i<LU.n;i++){E=v3.add(E,[LU.col[i*3],LU.col[i*3+1],LU.col[i*3+2]])}const amb=v3.mul(E,.0065);gl.uniform3fv(U.uAmb,amb);
    gl.uniform1f(U.uHaze,S.haze*(isMonitor?1:.5));gl.uniform3fv(U.uWall,srgb(room.wall).map(v=>Math.pow(v,2.2)));gl.uniform1f(U.uWallFin,room.fin);gl.uniform1f(U.uFloorFin,room.floor);gl.uniform3fv(U.uFloorCol,srgb(room.floorCol).map(v=>Math.pow(v,2.2)));gl.uniform1i(U.uAlbT,1);gl.uniform1i(U.uNrmT,2);gl.uniform1i(U.uSpecT,3);gl.uniform1f(U.uWork,isMonitor?0:.06);
    gl.uniform1f(U.uLDR,HDR?0:1);gl.uniform1f(U.uExpo,exposure(isMonitor));gl.uniform3fv(U.uWB,isMonitor?wbMul():[1,1,1]);
    for(const o of objects){if(!o.visible)continue;if(isMonitor&&o.cam)continue;
      let em=[0,0,0];if(o.lightId){const L=lights.find(l=>l.id===o.lightId);if(L&&L.on&&o===L.oEmit){const F=FIX[L.type];let c=kelvin(L.k);if(L.rgb)c=[c[0]*L.rgb[0],c[1]*L.rgb[1],c[2]*L.rgb[2]];em=v3.mul(c,L.int*(L.type==='window'?9:F.kind===1?3.2:F.soft?4:26)*(isMonitor?1:.35))}}
      if(o.propEmit)em=propEmit(o.propEmit,isMonitor);
      gl.uniform3fv(U.uEmit,em);gl.uniform1f(U.uSel,!isMonitor&&((o.lightId&&o.lightId===selId)||(o.propId&&o.propId===selProp))?.6:0);
      if(o.tex){gl.uniform1f(U.uTex,1);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,o.tex.a);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,o.tex.n||FLATN);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,o.tex.s||FLATS);gl.activeTexture(gl.TEXTURE0)}else gl.uniform1f(U.uTex,0);
      gl.uniformMatrix4fv(U.uM,false,o.M);gl.uniformMatrix3fv(U.uNM,false,o.NM);gl.bindVertexArray(o.mesh.vao);gl.drawElements(gl.TRIANGLES,o.mesh.count,o.mesh.type,o.mesh.offset||0)}
    gl.bindVertexArray(null)}
  function exposure(isMonitor){if(!isMonitor)return .9;return .72*Math.pow(2.8/S.cam.T,2)*(S.cam.iso/800)}
  function wbMul(){const a=kelvin(S.cam.wb),d=kelvin(5600);const m=[d[0]/a[0],d[1]/a[1],d[2]/a[2]];const l=m[0]*.2126+m[1]*.7152+m[2]*.0722;return m.map(v=>v/l)}

  /* ----- post ----- */
  function post(R,cam,isMonitor,vp){
    let src=R.scene.t;
    if(HDR&&isMonitor){
      // DOF
      const f=S.cam.f/1000,N=S.cam.T,focus=v3.len(v3.sub(cam.pos,S.focus===1&&people[1]?HEAD2:HEAD));const K=(f*f/(N*Math.max(.01,focus-f)))/.036*R.w;
      gl.bindFramebuffer(gl.FRAMEBUFFER,R.dof.fb);gl.viewport(0,0,R.w,R.h);gl.useProgram(PDOF.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,R.scene.t);gl.uniform1i(PDOF.U.uCol,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,R.scene.d);gl.uniform1i(PDOF.U.uDep,1);
      gl.uniform1f(PDOF.U.uN,cam.n);gl.uniform1f(PDOF.U.uF,cam.f);gl.uniform1f(PDOF.U.uFocus,focus);gl.uniform1f(PDOF.U.uK,K);gl.uniform1f(PDOF.U.uMax,Math.min(R.w*.018,K*1.2));gl.uniform2f(PDOF.U.uTx,1/R.w,1/R.h);gl.disable(gl.DEPTH_TEST);quad();src=R.dof.t;
      // bloom
      gl.bindFramebuffer(gl.FRAMEBUFFER,R.b1.fb);gl.viewport(0,0,R.b1.w,R.b1.h);gl.useProgram(PBR.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,src);gl.uniform1i(PBR.U.uCol,0);gl.uniform2f(PBR.U.uTx,1/R.w,1/R.h);gl.uniform1f(PBR.U.uExpo,exposure(true));quad();
      gl.useProgram(PBL.p);gl.uniform1i(PBL.U.uCol,0);for(let k=0;k<2;k++){gl.bindFramebuffer(gl.FRAMEBUFFER,R.b2.fb);gl.bindTexture(gl.TEXTURE_2D,R.b1.t);gl.uniform2f(PBL.U.uDir,(k+1)/R.b1.w,0);quad();gl.bindFramebuffer(gl.FRAMEBUFFER,R.b1.fb);gl.bindTexture(gl.TEXTURE_2D,R.b2.t);gl.uniform2f(PBL.U.uDir,0,(k+1)/R.b1.h);quad()}}
    // final to canvas viewport
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(vp[0],vp[1],vp[2],vp[3]);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(PF.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,src);gl.uniform1i(PF.U.uCol,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,R.b1.t);gl.uniform1i(PF.U.uBloom,1);
    gl.uniform1f(PF.U.uExpo,HDR?exposure(isMonitor):1);gl.uniform3fv(PF.U.uWB,HDR&&isMonitor?wbMul():[1,1,1]);gl.uniform1f(PF.U.uBK,HDR&&isMonitor?.22:0);gl.uniform1f(PF.U.uFC,isMonitor&&S.fc?1:0);gl.uniform1f(PF.U.uGrain,isMonitor?.022:.012);gl.uniform1f(PF.U.uVig,isMonitor?.55:.3);gl.uniform1f(PF.U.uTime,performance.now()/1000%50);gl.uniform2f(PF.U.uRes,vp[2],vp[3]);gl.uniform1f(PF.U.uRaw,HDR?0:1);
    quad()}

  /* ----- gizmos (set view) ----- */
  const lineBuf=gl.createBuffer(),lineVao=gl.createVertexArray();gl.bindVertexArray(lineVao);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,28,12);gl.bindVertexArray(null);
  function drawGizmos(cam,vp){const L=[];const seg=(a,b,c)=>{L.push(...a,...c,...b,...c)};
    for(const l of lights){if(!l.on)continue;const {p,d}=lightFrame(l);const F=FIX[l.type];const c=kelvin(l.k);const m=Math.max(...c);const col=[c[0]/m,c[1]/m,c[2]/m,l.id===selId?.85:.32];
      const reach=Math.min(3.2,v3.len(v3.sub(HEAD,p))*1.05);const ang=(F.beam&&l.beam?l.beam:Math.min(F.outer,70))*D2R/2;
      let u=v3.norm(v3.cross(d,[0,1,0]));if(v3.len(u)<.1)u=[1,0,0];const w=v3.cross(u,d);
      if(F.kind!==1&&l.id===selId)for(let k=0;k<6;k++){const a=k/6*2*PI;const dir=v3.norm(v3.add(d,v3.add(v3.mul(u,Math.cos(a)*Math.tan(ang)),v3.mul(w,Math.sin(a)*Math.tan(ang)))));seg(p,v3.add(p,v3.mul(dir,reach)),col)}
      seg(p,v3.add(p,v3.mul(d,reach)),[col[0],col[1],col[2],col[3]*.6]);
      if(!F.wall)seg([l.x,.003,l.z],[l.x,l.h,l.z],[1,1,1,.12])}
    const mc=monitorCam(16/9);const inv=m4.inv(m4.mul(mc.P,mc.V));const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const nr=m4.xp(inv,[x,y,-1]),fr=m4.xp(inv,[x,y,.9965]);return [nr.slice(0,3),v3.add(nr.slice(0,3),v3.mul(v3.norm(v3.sub(fr.slice(0,3),nr.slice(0,3))),3))]});
    const cc=[1,.23,.19,.8];for(let k=0;k<4;k++){seg(corners[k][0],corners[k][1],cc);seg(corners[k][1],corners[(k+1)%4][1],cc)}
    gl.bindBuffer(gl.ARRAY_BUFFER,lineBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(L),gl.DYNAMIC_DRAW);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(vp[0],vp[1],vp[2],vp[3]);
    gl.useProgram(PL.p);gl.uniformMatrix4fv(PL.U.uVP,false,m4.mul(cam.P,cam.V));gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(lineVao);gl.drawArrays(gl.LINES,0,L.length/7);gl.bindVertexArray(null);gl.disable(gl.BLEND)}

  /* ----- frame ----- */
  let dirty=true,selId=null,selProp=null;const view={main:'monitor',pip:true};
  function layout(){const W=canvas.width,H=canvas.height;const tall=H/W>.7;const mainVP=[0,0,W,H];const pw=Math.round(W*(tall?.4:.3)),ph=Math.round(pw*9/16);const m=Math.round(W*.015);const pipVP=[W-pw-m,H-ph-m,pw,ph];return {mainVP,pipVP,tall}}
  function monitorVP(vp,bottom){// fit 16:9 inside (bottom-aligned on tall canvases)
    const [x,y,w,h]=vp;const a=16/9;if(w/h>a){const ww=Math.round(h*a);return [x+Math.round((w-ww)/2),y,ww,h]}const hh=Math.round(w/a);return [x,bottom?y:y+Math.round((h-hh)/2),w,hh]}
  let lastLayout=null;
  function render(scale){scale=scale||1;
    lights.forEach(updateLightObjects);updateCamObjects();
    renderShadows();LU=lightUniformData();
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.03,.028,.026,1);gl.clear(gl.COLOR_BUFFER_BIT);
    const {mainVP,pipVP,tall}=layout();
    const draws=[[view.main,view.main==='monitor'?monitorVP(mainVP,tall):mainVP,false]];if(view.pip)draws.push([view.main==='monitor'?'set':'monitor',pipVP,true]);
    lastLayout={main:draws[0][1],pip:view.pip?pipVP:null,mainKind:view.main};
    for(const [kind,vp,isPip] of draws){const w=Math.max(2,Math.round(vp[2]*(isPip?1:scale))),h=Math.max(2,Math.round(vp[3]*(isPip?1:scale)));const R=rts(kind+(isPip?'p':'m'),w,h);
      const isMon=kind==='monitor';const cam=isMon?monitorCam(w/h):setViewCam(w/h);drawScene(cam,isMon,R.scene);post(R,cam,isMon,vp);if(!isMon)drawGizmos(cam,vp);
      if(isPip){gl.enable(gl.SCISSOR_TEST);for(const [x,y,ww,hh] of [[vp[0]-2,vp[1]-2,vp[2]+4,2],[vp[0]-2,vp[1]+vp[3],vp[2]+4,2],[vp[0]-2,vp[1],2,vp[3]],[vp[0]+vp[2],vp[1],2,vp[3]]]){gl.scissor(x,y,ww,hh);gl.clearColor(.93,.9,.85,1);gl.clear(gl.COLOR_BUFFER_BIT)}gl.disable(gl.SCISSOR_TEST)}}
    dirty=false}

  /* ----- picking / projection helpers ----- */
  function project(kind,pt){const lay=lastLayout;if(!lay)return null;const vp=kind===lay.mainKind?lay.main:lay.pip;if(!vp)return null;const cam=kind==='monitor'?monitorCam(vp[2]/vp[3]):setViewCam(vp[2]/vp[3]);const c=m4.xp(m4.mul(cam.P,cam.V),pt);if(c[3]<=0)return null;
    return [vp[0]+(c[0]*.5+.5)*vp[2],canvas.height-(vp[1]+(c[1]*.5+.5)*vp[3]),c[2]]}
  function rayFloor(px,py,y0){const lay=lastLayout;if(!lay||lay.mainKind!=='set')return null;const vp=lay.main;const cam=setViewCam(vp[2]/vp[3]);const inv=m4.inv(m4.mul(cam.P,cam.V));
    const nx=((px-vp[0])/vp[2])*2-1,ny=((canvas.height-py-vp[1])/vp[3])*2-1;const a=m4.xp(inv,[nx,ny,-1]),b=m4.xp(inv,[nx,ny,1]);const d=v3.norm(v3.sub(b.slice(0,3),a.slice(0,3)));if(Math.abs(d[1])<1e-4)return null;const t=((y0||0)-a[1])/d[1];if(t<0)return null;return [a[0]+d[0]*t,y0||0,a[2]+d[2]*t]}

  buildRoom();
  return {gl,HDR,S,FIX,lights,setCam,view,
    get dirty(){return dirty},set dirty(v){dirty=v},
    addLight,removeLight,render,project,rayFloor,monitorCam,lightFrame,
    people,setPerson,removePerson,movePerson,set peopleBase(v){peopleBase=v},props,PROPS,addProp,removeProp,touchProp,clearProps,room,buildRoom,snapWall,snapWallLight,HEAD,HEAD2,CHEST,
    selectProp(id){selProp=id;dirty=true},get selectedProp(){return selProp},
    select(id){selId=id;dirty=true},get selected(){return selId},
    invalidateShadows(){shadowDirty.fill(true);dirty=true},
    touchLight(L){if(L&&L.tile>=0)shadowDirty[L.tile]=true;dirty=true},
    clearLights(){lights.slice().forEach(l=>removeLight(l.id))},
    layout:()=>lastLayout, HEAD, kelvin};
}
window.StudioSet={create,FIX,kelvin};
})();
