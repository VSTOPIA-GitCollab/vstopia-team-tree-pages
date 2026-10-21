'use strict';
/* Original procedural canvas artwork, inspired by Council's interactive tree metaphor.
 * NO code/assets have been copied from Marcello's unavailable original renderer.
 * All labels come exclusively from the public demo nodes; GitHub snapshots stay separate. */
(() => {
  const GOLD='#f8dda2', LIME='#bcf29a', MINT='#87edc9';
  const PI2=Math.PI*2;
  const rand = (seed) => {let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};};
  const drawGlow=(ctx,x,y,r,inner,outer='rgba(23,48,33,0)')=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,inner);g.addColorStop(1,outer);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,PI2);ctx.fill();
  };
  function strokeBranch(ctx,x1,y1,x2,y2,width,highlight=false){
    const mx=x1*.42+x2*.58,my=y1*.48+y2*.52;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const shade=ctx.createLinearGradient(x1,y1,x2,y2);
    shade.addColorStop(0,highlight?'#6e5640':'#382a1e');shade.addColorStop(.42,highlight?'#8d6843':'#53402a');shade.addColorStop(1,highlight?'#65502f':'#443e2a');
    ctx.strokeStyle='#101710';ctx.lineWidth=width+3;ctx.beginPath();ctx.moveTo(x1,y1);
    ctx.bezierCurveTo(x1+(x2-x1)*.12,y1+(y2-y1)*.35,mx,my,x2,y2);ctx.stroke();
    ctx.strokeStyle=shade;ctx.lineWidth=width;ctx.stroke();
    ctx.strokeStyle=highlight?'rgba(214,188,116,.38)':'rgba(191,159,94,.20)';ctx.lineWidth=Math.max(.65,width*.12);ctx.stroke();ctx.restore();
  }
  function background(ctx,w,h,t,motion){
    const ambience=ctx.createRadialGradient(w*.5,h*.48,h*.04,w*.5,h*.51,w*.68);
    ambience.addColorStop(0,'rgba(46,104,70,.28)');ambience.addColorStop(.4,'rgba(12,61,49,.17)');ambience.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ambience;ctx.fillRect(0,0,w,h);
    drawGlow(ctx,w*.53,h*.25,w*.43,'rgba(112,200,155,.12)');
    const noise=rand(9071);
    for(let i=0;i<55;i++){
      const x=noise()*w,y=noise()*h*.81;
      const r=noise()*1.2+.25,twinkle=motion?.5+.5*Math.sin(t*.0015+i*1.9):.8;
      ctx.globalAlpha=(.08+noise()*.3)*twinkle;ctx.fillStyle=i%5===0?'#fce6a6':'#abffda';ctx.beginPath();ctx.arc(x,y,r,0,PI2);ctx.fill();
    }ctx.globalAlpha=1;
    // The forest floor softly catches neon reflected from the canopy.
    const ground=ctx.createRadialGradient(w*.5,h*.85,w*.06,w*.5,h*.89,w*.53);
    ground.addColorStop(0,'rgba(69,121,73,.37)');ground.addColorStop(.38,'rgba(21,74,58,.16)');ground.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ground;ctx.beginPath();ctx.ellipse(w*.5,h*.87,w*.5,h*.19,0,0,PI2);ctx.fill();
    ctx.strokeStyle='rgba(102,227,166,.12)';ctx.lineWidth=1;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(w*.5,h*.87,w*(.11+i*.12),h*(.025+i*.019),0,0,PI2);ctx.stroke();}
    const line=ctx.createLinearGradient(0,h*.86,0,h);line.addColorStop(0,'rgba(138,232,152,.10)');line.addColorStop(1,'rgba(6,21,13,0)');
    ctx.fillStyle=line;ctx.fillRect(0,h*.86,w,h*.14);
  }
  function foliageCluster(ctx,x,y,scale,seed,t,motion,back=false){
    const rng=rand(seed+212);
    const palette=back?['#113c30','#154532','#19472e','#214e32','#154638']:
      ['#2f6d47','#398756','#449966','#5da472','#236451','#74a765','#4d8851','#66995f'];
    ctx.save();ctx.translate(x,y);
    const wind=motion?Math.sin(t*.001+seed*.12)*scale*.043:0;
    ctx.translate(wind,0);
    const n=back?75:96;
    for(let i=0;i<n;i++){
      const a=rng()*PI2,dist=Math.sqrt(rng());
      const rx=Math.cos(a)*scale*(.22+dist*.79),ry=Math.sin(a)*scale*(.10+dist*.65);
      const size=(3.8+rng()*10.5)*Math.min(1.2,scale/50);
      ctx.save();ctx.translate(rx,ry);ctx.rotate(a*.46+(rng()-.5)*1.2);
      ctx.globalAlpha=back?.36+rng()*.34:.54+rng()*.44;
      ctx.fillStyle=palette[Math.floor(rng()*palette.length)];
      ctx.beginPath();ctx.moveTo(-size*.85,0);
      ctx.quadraticCurveTo(-size*.15,-size*.85,size*.93,0);
      ctx.quadraticCurveTo(size*.2,size*.59,-size*.85,0);
      ctx.fill();
      if(!back&&i%9===0){ctx.strokeStyle='rgba(217,243,173,.45)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(-size*.6,0);ctx.lineTo(size*.65,0);ctx.stroke();}
      ctx.restore();
    }ctx.restore();
  }
  function tree(ctx,w,h,t,motion,world,projected,selected){
    const root=projected.get('root');if(!root)return;
    const centerX=root.x,rootY=root.y,baseY=Math.min(h*.97,rootY+h*.27);
    const scale=Math.min(w/830,h/720);
    // Atmospheric light behind the densely layered crown.
    drawGlow(ctx,centerX,rootY-h*.37,w*.39,'rgba(94,204,134,.20)');
    const wood=world.filter(x=>x.type==='repo');
    // Far foliage first gives the trunk and branches believable depth.
    for(const item of wood){const p=projected.get(item.id);if(!p)continue;
      foliageCluster(ctx,p.x,p.y,39*scale+12,item.id.length*1327+(item.repo||'').length*89,t,motion,true);
    }
    // Main trunk: multi-layer taper, taper roots and bark veins.
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=23;ctx.shadowColor='rgba(132,245,166,.11)';
    const bark=ctx.createLinearGradient(centerX-38,0,centerX+39,0);
    bark.addColorStop(0,'#171b14');bark.addColorStop(.16,'#493628');bark.addColorStop(.46,'#82613f');bark.addColorStop(.65,'#483729');bark.addColorStop(.94,'#191f18');
    ctx.fillStyle=bark;ctx.beginPath();ctx.moveTo(centerX-9,rootY-h*.17);
    ctx.bezierCurveTo(centerX-17,rootY-h*.09,centerX-27,rootY+h*.13,centerX-31,baseY);
    ctx.lineTo(centerX+31,baseY);ctx.bezierCurveTo(centerX+25,rootY+h*.06,centerX+18,rootY-h*.14,centerX+9,rootY-h*.23);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    const vein=rand(512);ctx.lineWidth=1;
    for(let i=0;i<21;i++){
      const sx=centerX+(vein()-.5)*40,sy=rootY-h*.1+vein()*h*.14;
      ctx.strokeStyle=i%3===0?'rgba(192,160,96,.35)':'rgba(20,18,12,.3)';ctx.beginPath();ctx.moveTo(sx,sy);
      ctx.bezierCurveTo(sx-5,sy+h*.05,sx+8,sy+h*.09,sx+(vein()-.5)*18,baseY);ctx.stroke();
    }
    ctx.restore();
    // Roots disappearing into the lit moss floor.
    for(let i=0;i<7;i++){
      const a=(i/6-.5),endX=centerX+a*w*.22;
      strokeBranch(ctx,centerX+a*18,baseY-12,endX,baseY+h*.025+(i%3)*h*.009,Math.max(1,8-Math.abs(a)*8),false);
    }
    // True woody limbs, each connected to a selectable branch in the projected scene.
    for(const item of wood){
      const end=projected.get(item.id);if(!end)continue;
      const side=end.x<centerX?-1:1;
      const joinX=centerX+side*(10+Math.abs(end.x-centerX)*.09);
      const joinY=rootY-h*(.13+Math.min(.21,(rootY-end.y)/h*.29));
      strokeBranch(ctx,centerX,rootY+h*.02,joinX,joinY,Math.max(3,9.5*scale),true);
      strokeBranch(ctx,joinX,joinY,end.x,end.y,Math.max(2,5.5*scale),true);
      const offsetX=(end.x-joinX)*.5,offsetY=(end.y-joinY)*.55;
      const rng=rand((item.repo||'').length*714);
      for(let twig=0;twig<3;twig++){
        const u=.3+twig*.18;
        const atX=joinX+(end.x-joinX)*u,atY=joinY+(end.y-joinY)*u;
        strokeBranch(ctx,atX,atY,atX+side*(12+rng()*18),atY-(11+rng()*22),1.1+scale*.7);
      }
    }
    // Layered close foliage with copper sun rims, leaves and luminous lichen.
    for(const item of wood){const end=projected.get(item.id);if(!end)continue;
      const seed=(item.repo||'').split('').reduce((s,c)=>Math.imul(s^c.charCodeAt(0),16777619),2166136261)>>>0;
      const radius=(41+seed%33)*scale+16;
      foliageCluster(ctx,end.x,end.y,radius,seed,t,motion,false);
      drawGlow(ctx,end.x,end.y,radius*.95,'rgba(115,225,140,.055)');
    }
  }
  function ornaments(ctx,world,projected,selected,hits,t,motion,w,h){
    const labels=[];
    for(const item of world){if(item.type!=='repo')continue;
      const p=projected.get(item.id);if(!p)continue;
      const active=item.repo===selected;
      const r=active?9:6.5;
      // Firefly orb hanging from the branch, with a bright inner seed.
      drawGlow(ctx,p.x,p.y,active?40:25,active?'rgba(252,214,119,.48)':'rgba(130,246,187,.22)');
      ctx.beginPath();ctx.arc(p.x,p.y,r+3,0,PI2);
      ctx.strokeStyle=active?'rgba(255,217,130,.95)':'rgba(153,238,174,.55)';ctx.lineWidth=1.4;ctx.stroke();
      ctx.fillStyle=active?'#f5d08b':'#a2f6c0';ctx.beginPath();ctx.arc(p.x,p.y,r,0,PI2);ctx.fill();
      ctx.fillStyle='#fff6cb';ctx.beginPath();ctx.arc(p.x-1.7,p.y-2.1,active?2.6:1.9,0,PI2);ctx.fill();
      hits.push({repo:item.repo,x:p.x,y:p.y,r:Math.max(26,r+17),depth:p.depth});
      if(active||w>460)labels.push({repo:item.repo,p,active});
    }
    // Label background capsules have consistent legibility over foliage.
    labels.sort((a,b)=>Number(b.active)-Number(a.active)||b.p.depth-a.p.depth);
    const occupied=[];
    for(const label of labels){
      const font=label.active?'700 12px ui-monospace,monospace':'10px ui-monospace,monospace';
      ctx.font=font;const tw=ctx.measureText(label.repo).width;
      const bw=Math.min(190,tw+19),bh=22;
      const lx=Math.max(8,Math.min(w-bw-8,label.p.x-bw/2)),ly=label.p.y-37;
      if(!label.active&&occupied.some(o=>lx<o.x+o.w&&lx+bw>o.x&&ly<o.y+o.h&&ly+bh>o.y))continue;
      occupied.push({x:lx,y:ly,w:bw,h:bh});
      ctx.fillStyle=label.active?'rgba(22,46,31,.94)':'rgba(7,24,17,.83)';
      ctx.strokeStyle=label.active?'rgba(255,225,145,.75)':'rgba(123,214,156,.32)';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(lx,ly,bw,bh,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=label.active?'#fff0bf':'#d5ead1';ctx.textAlign='center';ctx.font=font;
      ctx.fillText(label.repo,lx+bw/2,ly+14.5,bw-10);
    }
    const rng=rand(1137);
    for(let i=0;i<34;i++){
      const x=w*(.2+rng()*.6),y=h*(.12+rng()*.74);
      const wave=motion?Math.sin(t*.0012+i*1.7):0;
      const xx=x+wave*9,yy=y+(motion?Math.cos(t*.0007+i)*8:0),size=.9+rng()*1.8;
      ctx.globalAlpha=.3+((wave+1)*.29);drawGlow(ctx,xx,yy,size*7,i%4?'rgba(131,255,180,.27)':'rgba(248,193,129,.25)');
      ctx.fillStyle=i%3?'#98ffc1':'#ffe5ad';ctx.beginPath();ctx.arc(xx,yy,size*.62,0,PI2);ctx.fill();
    }ctx.globalAlpha=1;
  }
  function draw(ctx,{w,h,t,motion,world,projected,selected,hits}){
    ctx.clearRect(0,0,w,h);
    background(ctx,w,h,t,motion);
    tree(ctx,w,h,t,motion,world,projected,selected);
    ornaments(ctx,world,projected,selected,hits,t,motion,w,h);
  }
  window.VstopiaForest=Object.freeze({draw});
})();
