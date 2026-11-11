import * as THREE from './three.module.js';
export async function createScene(host, button, media){
 let renderer;
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'})||canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!context)return;
 try{renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 const scene=new THREE.Scene();
 const envScene=new THREE.Scene();envScene.background=new THREE.Color(0xa99785);
 const panels=[];
 for(const [x,y,z,w,h] of [[-3,1,2,3,6],[3,2,1,2,5],[0,5,-1,6,2]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);envScene.add(panel);panels.push(panel);}
 const pmrem=new THREE.PMREMGenerator(renderer);const envTarget=pmrem.fromScene(envScene,.04);scene.environment=envTarget.texture;pmrem.dispose();panels.forEach(p=>{p.geometry.dispose();p.material.dispose();});
 const camera=new THREE.PerspectiveCamera(33,1,.1,100);camera.position.set(0,.2,8.3);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshStandardMaterial({color:0xc8c0b5,metalness:.82,roughness:.23});
 const edge=new THREE.MeshStandardMaterial({color:0xf0ece3,metalness:.7,roughness:.18});
 scene.add(new THREE.HemisphereLight(0xffffff,0x685342,3));
 for(const [x,y,z,intensity,color] of [[3,5,4,65,0xffffff],[-3,2,2,40,0xffe4bc],[0,-3,4,25,0xffffff]]){const light=new THREE.PointLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
 const group=new THREE.Group();scene.add(group);group.rotation.set(.2,-.3,-.38);
 const blades=[];
 for(let side=0;side<2;side++){
  const arm=new THREE.Group();arm.position.z=side*.055;group.add(arm);blades.push(arm);
  const shape=new THREE.Shape();shape.moveTo(-.1,0);shape.lineTo(-.04,2.18);shape.quadraticCurveTo(.12,2.03,.22,1.3);shape.lineTo(.15,0);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025});
  arm.add(new THREE.Mesh(geo,material));
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,.85,14),material);neck.position.set(-.14,-.4,.05);neck.rotation.z=-.22;arm.add(neck);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.37,.075,12,48),edge);handle.scale.y=1.25;handle.position.set(-.3,-1.18,.05);arm.add(handle);
  if(side===1){arm.scale.x=-1;}
 }
 const screw=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.23,24),edge);screw.rotation.x=Math.PI/2;screw.position.z=.07;group.add(screw);
 const slit=new THREE.Mesh(new THREE.BoxGeometry(.13,.022,.014),new THREE.MeshStandardMaterial({color:0x756f64,metalness:.7,roughness:.3}));slit.position.z=.19;group.add(slit);
 group.position.y=-.3;
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 resize();host.dataset.scene='ready';host.append(renderer.domElement);host.querySelector('svg').style.visibility='hidden';button.hidden=false;
 let paused=false,visible=true,destroyed=false,frame=0,pointerX=0,pointerY=0,currentX=0,currentY=0,scroll=0,last=0,slow=0;
 const pointer=e=>{pointerX=(e.clientX/innerWidth-.5)*.45;pointerY=(e.clientY/innerHeight-.5)*.2;};
 const onScroll=()=>{scroll=Math.min(scrollY/innerHeight,1);};
 window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('scroll',onScroll,{passive:true});
 const ro=new ResizeObserver(resize);ro.observe(host);
 function render(t){frame=0;if(destroyed||paused||!visible||document.hidden)return;
  if(last&&t-last>45&&++slow>45){renderer.setPixelRatio(1);resize();slow=0;}last=t;
  currentX+=(pointerX-currentX)*.04;currentY+=(pointerY-currentY)*.04;
  group.rotation.y=-.3+currentX+Math.sin(t*.0003)*.22;
  group.rotation.x=.2+currentY;group.rotation.z=-.38+scroll*.3;
  const open=.23+Math.sin(t*.0006)*.065;blades[0].rotation.z=-open;blades[1].rotation.z=open;
  renderer.render(scene,camera);host.dataset.animation="running";frame=requestAnimationFrame(render);
 }
 function resume(){if(!frame&&!destroyed&&!paused&&visible&&!document.hidden){last=0;host.dataset.animation="running";frame=requestAnimationFrame(render);}}
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;host.dataset.animation='paused';}});intersection.observe(host);
 const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;host.dataset.animation='paused';}else resume();};document.addEventListener('visibilitychange',onVisibility);
 button.addEventListener('click',()=>{paused=!paused;button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Включить 3D-анимацию':'Приостановить 3D-анимацию');button.innerHTML=paused?'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>':'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2"/></svg>';if(paused){cancelAnimationFrame(frame);frame=0;host.dataset.animation='paused';}else resume();});
 function dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);ro.disconnect();intersection.disconnect();window.removeEventListener('pointermove',pointer);window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',onVisibility);scene.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}});envTarget.dispose();renderer.dispose();renderer.domElement.remove();host.dataset.scene='disposed';host.dataset.animation='disposed';host.querySelector('svg').style.visibility='';button.hidden=true;}
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();dispose();},{once:true});
 media.addEventListener('change',e=>{if(e.matches)dispose();},{once:true});window.addEventListener('pagehide',dispose,{once:true});
 renderer.render(scene,camera);resume();
}
