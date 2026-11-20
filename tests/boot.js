const {JSDOM}=require('/tmp/t/node_modules/jsdom');const fs=require('fs');
const root='/home/claude/mini-idle/';
function boot(opts={}){
 let html=fs.readFileSync(root+'index.html','utf8');
 (opts.extra||[]).forEach(f=>{ html=html.replace('</body>','<script>'+fs.readFileSync(f,'utf8')+'</script></body>'); });
 html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,s)=>'<script>'+fs.readFileSync(root+s,'utf8').replace(/<\/script>/g,'<\\/script>')+'</script>');
 const errs=[];
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){
   w.console.error=(...a)=>errs.push(a.map(String).join(' '));
   const c=w.HTMLCanvasElement.prototype; c.getContext=()=>new Proxy(function(){},{get:(t,p)=>p==='measureText'?()=>({width:5}):(p==='createLinearGradient'||p==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}) ,set:()=>true});
   w.requestAnimationFrame=()=>0; if(opts.save) w.localStorage.setItem('miniidle-v2',opts.save);
   if(opts.before) opts.before(w);
 }});
 return {dom,w:dom.window,errs};
}
module.exports={boot,root};
