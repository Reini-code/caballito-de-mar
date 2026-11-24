/*
 * Un pedacito de océano — sitio personal sin compiladores.
 * La escena 3D se genera por código. Si falla WebGL o la CDN,
 * permanece visible la ilustración SVG de respaldo.
 */

const $ = (selector) => document.querySelector(selector);
const overlay = $('#letter-overlay');
const letter = overlay.querySelector('.letter');
const bubbleLayer = $('#css-bubbles');
const bubbleButton = $('#make-bubbles');
const toast = $('#toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let triggerButton = null;
let toastTimer = 0;
let externalBurst = null;

const rand = (min, max) => min + Math.random() * (max - min);

function openLetter() {
  triggerButton = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('#close-letter').focus();
}
function closeLetter() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (triggerButton && typeof triggerButton.focus === 'function') triggerButton.focus();
}
$('#open-letter').addEventListener('click', openLetter);
$('#close-letter').addEventListener('click', closeLetter);
$('#letter-backdrop').addEventListener('click', closeLetter);
document.addEventListener('keydown', (event) => {
  if (!overlay.classList.contains('open')) return;
  if (event.key === 'Escape') closeLetter();
  if (event.key === 'Tab') {
    event.preventDefault();
    $('#close-letter').focus();
  }
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function cssBurst(n = 16, nearX = null) {
  const x = nearX == null ? rand(45, 85) : nearX;
  for (let i = 0; i < n; i += 1) {
    const bubble = document.createElement('span');
    bubble.className = 'css-bubble';
    bubble.style.setProperty('--x', `${Math.max(4, Math.min(95, x + rand(-20, 20)))}%`);
    bubble.style.setProperty('--d', `${rand(7, 34).toFixed(1)}px`);
    bubble.style.setProperty('--dx', `${rand(-110, 115).toFixed(0)}px`);
    bubble.style.setProperty('--s', `${reducedMotion ? 0.1 : rand(4, 7).toFixed(1)}s`);
    bubble.style.animationDelay = `${rand(0, 0.6).toFixed(1)}s`;
    bubbleLayer.append(bubble);
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
    setTimeout(() => bubble.remove(), 8500);
  }
}

bubbleButton.addEventListener('click', () => {
  cssBurst(18);
  if (externalBurst) externalBurst();
  showToast('Una burbujita bonita viaja hacia ti 🫧');
});

// Se importa dinámicamente para conservar la carta y la ilustración
// aunque la red o la aceleración gráfica estén deshabilitadas.
(async () => {
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
    initOcean(THREE);
  } catch (error) {
    console.info('Océano 3D no disponible; se usa la ilustración de respaldo.', error);
  }
})();

function initOcean(T) {
  const mount = $('#three-container');
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x001623, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 1.8));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  mount.appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0c5865, 0.017);
  const camera = new T.PerspectiveCamera(46, 1, 0.1, 160);
  const clock = new T.Clock();
  const isSmall = () => window.innerWidth < 761;

  scene.add(new T.HemisphereLight(0x9bfff0, 0x0c3546, 2.2));
  const sunlight = new T.DirectionalLight(0xb4f9f1, 3.0);
  sunlight.position.set(-3, 12, 8);
  scene.add(sunlight);
  const coralLight = new T.PointLight(0xffb6bb, 42, 12, 2);
  coralLight.position.set(4.5, 1.2, 5);
  scene.add(coralLight);
  const blueLight = new T.PointLight(0x53c9ec, 36, 19, 2);
  blueLight.position.set(-7, 4, 2);
  scene.add(blueLight);

  const material = (color, opts = {}) => new T.MeshStandardMaterial({ color, metalness: 0.04, roughness: 0.56, ...opts });
  const pink = material(0xf6acb3, { metalness: 0.07, roughness: 0.4, emissive: 0x3c101e, emissiveIntensity: .2 });
  const lilac = material(0xb78cd9, { roughness: .48 });
  const softRose = material(0xffc5bb, { roughness: .45 });
  const cream = material(0xffdec1, { roughness: .61 });
  const blush = material(0xec809c, { roughness: .6 });
  const iris = material(0x22374c, { roughness: .15, metalness: .15 });
  const white = new T.MeshBasicMaterial({ color: 0xfffefa });
  const sphereGeo = new T.SphereGeometry(1, 24, 16);

  function ball(group, mat, x, y, z, sx, sy, sz) {
    const m = new T.Mesh(sphereGeo, mat);
    m.position.set(x,y,z); m.scale.set(sx,sy,sz);
    group.add(m); return m;
  }
  function tube(group, pts, r, mat, steps = 30) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)));
    const m = new T.Mesh(new T.TubeGeometry(curve, steps, r, 8, false), mat);
    group.add(m); return m;
  }
  function taperTube(group, pts, mat, start = .21, end = .055) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)));
    const segments = 74, radial = 11;
    const frames = curve.computeFrenetFrames(segments, false);
    const vertices = [], uvs = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = curve.getPointAt(t);
      const radius = start * (1-t) + end * t;
      for (let j = 0; j <= radial; j++) {
        const theta = (j/radial) * Math.PI*2;
        const normal = frames.normals[i].clone().multiplyScalar(Math.cos(theta));
        const binormal = frames.binormals[i].clone().multiplyScalar(Math.sin(theta));
        const v = pos.clone().add(normal.add(binormal).multiplyScalar(radius));
        vertices.push(v.x,v.y,v.z); uvs.push(t,j/radial);
        if (i < segments && j < radial) {
          const a=i*(radial+1)+j,b=a+radial+1;
          indices.push(a,b,a+1,b,b+1,a+1);
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices); geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,mat);group.add(mesh);return mesh;
  }
  function cylinderBetween(group, from, to, radius, mat) {
    const a=new T.Vector3(...from), b=new T.Vector3(...to);
    const dir=b.clone().sub(a),len=dir.length();
    const mesh=new T.Mesh(new T.CylinderGeometry(radius*.73,radius,len,7),mat);
    mesh.position.copy(a.add(b).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());
    group.add(mesh);return mesh;
  }

  const creature = new T.Group();
  const seaHorse = new T.Group();
  creature.add(seaHorse);
  scene.add(creature);

  // Cuerpo y pancita; la cámara mira el perfil del caballito.
  ball(seaHorse,pink, .08,.32,0,.58,1.18,.51).rotation.z=-.13;
  ball(seaHorse,softRose,-.17,-.38,.04,.70,.83,.51).rotation.z=-.12;
  ball(seaHorse,cream,-.47,-.23,.30,.43,.75,.28).rotation.z=-.2;
  ball(seaHorse,pink,.15,-.85,-.06,.40,.52,.37).rotation.z=.18;

  // Cuello elevado y cabecita perfilada.
  taperTube(seaHorse,[[.17,.9,0],[-.19,1.25,0],[-.35,1.65,0],[-.16,1.95,0]],pink,.34,.31);
  ball(seaHorse,pink,-.32,1.97,.04,.53,.47,.43).rotation.z=-.22;
  ball(seaHorse,softRose,-.61,2.02,.06,.39,.30,.36).rotation.z=.06;
  tube(seaHorse,[[-.67,1.86,.11],[-1.03,1.81,.10],[-1.35,1.74,.1]],.135,softRose,15);
  ball(seaHorse,blush,-1.36,1.74,.1,.17,.13,.18);
  ball(seaHorse,cream,-1.35,1.68,.226,.082,.023,.025);
  ball(seaHorse,blush,-.52,1.81,.39,.20,.14,.06);

  // Dos ojitos: uno visible y una luz diminuta en su pupila.
  ball(seaHorse,white,-.52,2.10,.425,.155,.155,.077);
  ball(seaHorse,iris,-.555,2.105,.495,.094,.099,.051);
  ball(seaHorse,white,-.578,2.155,.535,.035,.037,.023);
  ball(seaHorse,white,-.54,2.083,.543,.017,.018,.018);

  // Crestita de caballito, en forma de pequeñas hojas.
  for (let i=0;i<4;i++) {
    const crest=new T.Mesh(new T.ConeGeometry(.14-i*.012,.46+i*.09,7),i%2?softRose:cream);
    crest.position.set(-.05 + i*.15,2.35-i*.05,0);
    crest.rotation.z=-.28+i*.17;
    seaHorse.add(crest);
  }

  // Cola espiral continua, más fina en la punta.
  taperTube(seaHorse,[
    [.06,-.92,-.04],[.12,-1.34,-.08],[.39,-1.73,-.08],
    [.95,-2.01,-.12],[1.43,-1.86,-.11],[1.51,-1.39,-.09],
    [1.21,-1.20,-.05],[.83,-1.39,-.02],[.86,-1.71,.04],
    [1.14,-1.73,.08],[1.26,-1.58,.1]
  ], pink, .26, .037);

  // Costillas laterales muy suaves y perlitas bajo el vientre.
  const rib = material(0xda879e, { transparent:true,opacity:.40,roughness:.8 });
  for(let i=0;i<5;i++) {
    const y=.42-i*.25;
    tube(seaHorse,[[-.44,y,.455],[-.17,y-.075,.58],[.24,y-.12,.47]],.022,rib,12);
  }
  for(let i=0;i<5;i++)ball(seaHorse,cream,-.57+i*.008,.36-i*.25,.36,.04,.038,.035);

  // Aletas translúcidas: se balancean como un abanico en el agua.
  const finMat=new T.MeshStandardMaterial({color:0xfbc7dc,transparent:true,opacity:.79,side:T.DoubleSide,roughness:.53,metalness:.03});
  const dorsal = new T.Group(); dorsal.position.set(.54,.45,-.08);
  const finShape=new T.Shape();
  finShape.moveTo(0,-.24);finShape.quadraticCurveTo(.55,-.55,.84,-.33);
  finShape.quadraticCurveTo(.7,-.06,.93,.22);
  finShape.quadraticCurveTo(.55,.51,0,.27);finShape.closePath();
  dorsal.add(new T.Mesh(new T.ShapeGeometry(finShape,12),finMat));
  for(let i=0;i<4;i++)tube(dorsal,[[0,-.13+i*.12,.012],[.45,.02+i*.11,.02],[.79,-.22+i*.13,.025]],.011,cream,9);
  seaHorse.add(dorsal);
  const sideFin = new T.Group();sideFin.position.set(.32,1.21,.23);
  const sfShape=new T.Shape(); sfShape.moveTo(0,-.05);sfShape.quadraticCurveTo(.52,-.27,.52,.02);sfShape.quadraticCurveTo(.5,.32,0,.17);sfShape.closePath();
  sideFin.add(new T.Mesh(new T.ShapeGeometry(sfShape),finMat));seaHorse.add(sideFin);

  // Colgante brillante (sin textos, sin nombres).
  const necklace = ball(seaHorse, material(0xffe9b2,{emissive:0xe6a663,emissiveIntensity:.7,metalness:.2}),-.30,1.13,.49,.065,.072,.045);
  const pendantLight=new T.PointLight(0xffd7a8,3,2);pendantLight.position.set(-.3,1.16,.8);seaHorse.add(pendantLight);

  // Piso oceánico con dunas y algunas piedras suaves.
  const floor = new T.Mesh(new T.PlaneGeometry(130,130,1,1),material(0x174f56,{roughness:1,metalness:0}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-3.48;scene.add(floor);
  const seabed = new T.Group(); scene.add(seabed);
  const duneColors=[0x2b6060,0x326a68,0x1b4d58,0x3c6f6c];
  for(let i=0;i<25;i++){
    const mat=material(duneColors[i%4],{roughness:1});
    const stone=ball(seabed,mat,rand(-16,16),-3.45,rand(-7,2),rand(.2,1.7),rand(.05,.22),rand(.2,.8));
    stone.rotation.y=rand(-2,2);
  }
  // Esferitas perla y piedrecitas en el fondo.
  for(let i=0;i<90;i++){
    const x=rand(-14,14),z=rand(-8,5),r=rand(.022,.082);
    ball(seabed,i%4===0?cream:material(i%3===0?0x78a1a1:0x315c69,{roughness:1}),x,-3.41,z,r,r*.63,r);
  }

  const coralMaterials=[material(0xf4a8a7,{emissive:0x4c1118,emissiveIntensity:.2}),material(0xb78cca),material(0x89ddd0),material(0xe6a5bd)];
  const coralGroups=[];
  function createCoral(x,z,height,colorIndex,seed){
    const g=new T.Group();g.position.set(x,-3.38,z);
    const mat=coralMaterials[colorIndex%coralMaterials.length];
    const rng=mulberry32(seed);
    let tips=[];
    function branch(a,b,width,depth){
      cylinderBetween(g,a,b,width,mat);
      if(depth===0){tips.push(b);return;}
      for(let k=0;k<2;k++){
        const sign=k===0?-1:1;
        const end=[b[0]+sign*(.15+rng()*.43),b[1]+height*(.18+rng()*.16),b[2]+(rng()-.5)*.35];
        branch(b,end,width*.72,depth-1);
      }
    }
    branch([0,0,0],[0,height*.32,0],.10,2);
    tips.forEach(p=>ball(g,mat,p[0],p[1],p[2],.075,.085,.075));
    seabed.add(g);coralGroups.push(g);
  }
  [
    [-10,-2,2.3,0,2],[-7,-4,1.8,1,3],[-4,-3,2.7,2,4],
    [8,-2,2.9,0,5],[10,-3,1.95,2,6],[12,-4,2.1,1,7],
    [3,-7,1.2,3,9],[-12,-5,1.6,3,10], [5,-5,1.4,1,11]
  ].forEach(c=>createCoral(...c));

  const seaweeds=[];
  const green1=material(0x49b5a4,{side:T.DoubleSide,roughness:.6}),green2=material(0x2e897f,{side:T.DoubleSide,roughness:.6});
  for (let i=0;i<36;i++) {
    const g=new T.Group();
    const x=rand(-14,14),z=rand(-7,3),len=rand(.8,2.8);
    g.position.set(x,-3.39,z);
    const pts=[[0,0,0],[.05,len*.25,0],[.17,len*.65,.07],[.08,len,.09]];
    const weed=tube(g,pts,rand(.025,.055),i%2?green1:green2,17);
    g.userData={speed:rand(.38,.83),phase:rand(0,6.28),amp:rand(.02,.075)};
    seabed.add(g);seaweeds.push(g);
  }

  function starfish(x,z,size,color){
    const shape=new T.Shape();
    for(let i=0;i<10;i++){
      const a=(i*Math.PI/5)-Math.PI/2;
      const r=i%2===0?size:size*.43;
      const px=Math.cos(a)*r,py=Math.sin(a)*r;
      if(i===0)shape.moveTo(px,py);else shape.lineTo(px,py);
    }
    shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelThickness:.03,bevelSize:.035,bevelSegments:2});
    const m=new T.Mesh(geo,material(color,{roughness:.7}));
    m.rotation.x=-Math.PI/2;m.rotation.z=rand(-1,1);m.position.set(x,-3.37,z);scene.add(m);
  }
  starfish(7.5,2,.49,0xf1a3a2);starfish(-8,-1,.41,0xe5b5c5);starfish(4.7,-2,.31,0xf3cfaa);

  // Pececitos del fondo, en pequeñas escuelas.
  const fishSchool=[];
  function makeFish(scale,col){
    const group=new T.Group();
    const fm=material(col,{metalness:.1,roughness:.49,emissive:col,emissiveIntensity:.12});
    ball(group,fm,0,0,0,.31*scale,.17*scale,.12*scale);
    const tailGeom=new T.ConeGeometry(.16*scale,.32*scale,3);
    const tail=new T.Mesh(tailGeom,fm);tail.rotation.z=Math.PI/2;tail.position.x=.33*scale;group.add(tail);
    const eyeMat=new T.MeshBasicMaterial({color:0x0f3344});
    ball(group,eyeMat,-.18*scale,.055*scale,.115*scale,.022*scale,.022*scale,.025*scale);
    return group;
  }
  for(let i=0;i<24;i++){
    const f=makeFish(rand(.55,1.3),[0x90dac9,0xd8b6bd,0xa6cbd7,0xf2d2a5][i%4]);
    f.position.set(rand(-13,13),rand(-1.3,4.5),rand(-7,-2.8));
    f.userData={startX:f.position.x,baseY:f.position.y,speed:rand(.16,.38),offset:rand(0,10),direction:i%2?1:-1};
    f.rotation.y=f.userData.direction>0?0:Math.PI;
    scene.add(f);fishSchool.push(f);
  }

  // Medusita traslúcida lejos del primer plano.
  const jellies=[];
  function jellyfish(x,y,z,col,scale){
    const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);
    const mat=new T.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.33,transparent:true,opacity:.52,roughness:.2,side:T.DoubleSide});
    const bell=new T.Mesh(new T.SphereGeometry(.6,20,10,0,Math.PI*2,0,Math.PI*.5),mat);
    bell.scale.y=.73;g.add(bell);
    for(let i=0;i<7;i++){
      const p=(i/6)*Math.PI*2;
      tube(g,[[Math.cos(p)*.38,-.1,Math.sin(p)*.38],[Math.cos(p)*.28,-.7,Math.sin(p)*.24],[Math.cos(p)*.36-.07,-1.2,Math.sin(p)*.3]],.017,mat,16);
    }
    scene.add(g);jellies.push({group:g,y,phase:rand(0,6.28)});
  }
  jellyfish(-6,2,-6,0xa1dff0,.85);jellyfish(10,4,-9,0xdca7dd,1.08);

  // Burbujas transparentes y pequeñas chispas a distinta profundidad.
  const bubbleMaterial=new T.MeshPhysicalMaterial({color:0x94edf5,metalness:.05,roughness:.08,transparent:true,opacity:.26,depthWrite:false,side:T.FrontSide,emissive:0x1a8189,emissiveIntensity:.24});
  const bubbleObjects=[];
  for(let i=0;i<55;i++){
    const radius=rand(.055,.2);
    const m=new T.Mesh(new T.SphereGeometry(radius,9,8),bubbleMaterial);
    m.position.set(rand(-14,14),rand(-3,8),rand(-4,5));
    m.userData={speed:rand(.09,.31),phase:rand(0,9),baseX:m.position.x};
    scene.add(m);bubbleObjects.push(m);
  }
  const dustCount=500, dust=new Float32Array(dustCount*3),dustColors=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){
    dust[i*3]=rand(-18,18);dust[i*3+1]=rand(-4,10);dust[i*3+2]=rand(-10,7);
    const c = new T.Color().setHSL(rand(.45,.55),rand(.23,.61),rand(.64,.93));
    dustColors.set([c.r,c.g,c.b],i*3);
  }
  const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(dust,3));dustGeo.setAttribute('color',new T.BufferAttribute(dustColors,3));
  const dustPoints=new T.Points(dustGeo,new T.PointsMaterial({size:.042,vertexColors:true,transparent:true,opacity:.52,depthWrite:false}));
  scene.add(dustPoints);

  // Luces de agua: haces translúcidos detrás del personaje.
  const rayMat=new T.MeshBasicMaterial({color:0x9ffff0,transparent:true,opacity:.025,depthWrite:false,side:T.DoubleSide});
  for(let i=0;i<5;i++){
    const ray=new T.Mesh(new T.ConeGeometry(1.2+Math.random()*1.8,17,18,1,true),rayMat);
    ray.position.set(-6+i*3.6,2,-8);ray.rotation.z=.13+i*.04;scene.add(ray);
  }

  let yaw=0,pitch=0,dragged=false,pointerDown=null;
  const raycaster=new T.Raycaster();
  const ndc=new T.Vector2();

  function layout(){
    const w=window.innerWidth,h=window.innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=isSmall()?46:46;
    camera.updateProjectionMatrix();
    camera.position.set(0,isSmall()?3.3:1.1,isSmall()?13.2:15.8);
    camera.lookAt(0,isSmall()?1.45:0,0);
    creature.position.set(isSmall()?.68:5.05,isSmall()?-1.45:-.06,isSmall()?1:1.1);
    creature.scale.setScalar(isSmall()?.93:1.13);
    coralLight.position.set(creature.position.x,1.5,5);
  }
  layout();
  window.addEventListener('resize',layout,{passive:true});

  const canvas=renderer.domElement;
  canvas.setAttribute('aria-label','Escena submarina interactiva; arrastra para mover el punto de vista y toca el caballito de mar para descubrir un mensaje.');
  canvas.setAttribute('role','img');
  canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{
    pointerDown={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};
    dragged=false;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointerDown)return;
    const dx=e.clientX-pointerDown.lastX,dy=e.clientY-pointerDown.lastY;
    if(Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6)dragged=true;
    yaw=T.MathUtils.clamp(yaw+dx*.0032,-.45,.45);
    pitch=T.MathUtils.clamp(pitch+dy*.0013,-.13,.17);
    pointerDown.lastX=e.clientX;pointerDown.lastY=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{
    if(!pointerDown)return;
    canvas.style.cursor='grab';
    if(!dragged){
      ndc.x=(e.clientX/window.innerWidth)*2-1;
      ndc.y=-(e.clientY/window.innerHeight)*2+1;
      raycaster.setFromCamera(ndc,camera);
      const hit=raycaster.intersectObjects(seaHorse.children,true);
      if(hit.length)openLetter();else cssBurst(7,e.clientX/window.innerWidth*100);
    }
    pointerDown=null;
  });
  canvas.addEventListener('pointercancel',()=>{pointerDown=null;canvas.style.cursor='grab'});
  externalBurst=()=>{for(let i=0;i<16;i++){
    const m=new T.Mesh(new T.SphereGeometry(rand(.04,.15),8,7),bubbleMaterial);
    m.position.set(creature.position.x+rand(-1,1),rand(-2.5,1),rand(2.5,4.5));
    m.userData={speed:rand(.55,1.2),phase:rand(0,9),baseX:m.position.x,temporary:true,lifetime:rand(2,5)};
    scene.add(m);bubbleObjects.push(m);
  }};

  // Solo declaramos que está listo cuando el navegador dibujó un fotograma.
  renderer.render(scene,camera);
  document.body.classList.add('has-three');
  let elapsed=0;
  function render(){
    const dt=Math.min(clock.getDelta(),.08);
    elapsed+=dt;
    const t=elapsed;
    if(!reducedMotion){
      creature.position.y=(isSmall()?-1.45:-.06)+Math.sin(t*.75)*.16;
      creature.rotation.z=Math.sin(t*.63)*.035;
      creature.rotation.y=Math.sin(t*.32)*.07+yaw*.5;
      dorsal.rotation.y=Math.sin(t*4.4)*.38;
      sideFin.rotation.y=Math.sin(t*6.7)*.56;
      dustPoints.rotation.y=Math.sin(t*.08)*.028;
      for(const fish of fishSchool){
        const data=fish.userData;
        fish.position.x=data.startX+data.direction*t*data.speed;
        if(fish.position.x>16)fish.position.x=-16;
        if(fish.position.x< -16)fish.position.x=16;
        fish.position.y=data.baseY+Math.sin(t*1.3+data.offset)*.16;
        fish.rotation.z=Math.sin(t*1.8+data.offset)*.045;
      }
      for(const g of seaweeds){g.rotation.z=Math.sin(t*g.userData.speed+g.userData.phase)*g.userData.amp;}
      for(const j of jellies){j.group.position.y=j.y+Math.sin(t*.5+j.phase)*.38;j.group.scale.y=(Math.sin(t*1.2+j.phase)*.04+1)*(j.group.scale.x);}
      for(let i=bubbleObjects.length-1;i>=0;i--){
        const b=bubbleObjects[i],info=b.userData;
        b.position.y+=dt*info.speed;
        b.position.x=info.baseX+Math.sin(t*.8+info.phase)*.19;
        if(info.temporary){info.lifetime-=dt;if(info.lifetime<=0){scene.remove(b);b.geometry.dispose();bubbleObjects.splice(i,1);continue;}}
        if(b.position.y>9){b.position.y=-3.5;b.position.x=info.baseX;}
      }
    }
    camera.position.x=T.MathUtils.lerp(camera.position.x,yaw*3.1,.02);
    camera.position.y=T.MathUtils.lerp(camera.position.y,(isSmall()?3.3:1.1)+pitch*4,.02);
    camera.lookAt(0,isSmall()?1.45:0,0);
    renderer.render(scene,camera);
    if(!reducedMotion)requestAnimationFrame(render);
  }
  render();
}

function mulberry32(a){
  return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}
