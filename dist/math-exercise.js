'use strict';

const mathExerciseExamples = [
  {number:596,parts:[500,90,6],options:[9,600,6,50,90,500]},
  {number:358,parts:[300,50,8],options:[30,50,800,8,300,5]},
  {number:742,parts:[700,40,2],options:[70,700,4,40,400,2]}
];
const mathPlaces = ['hundreds','tens','ones'];
const mathPlaceNames = ['Сотни','Десятки','Единицы'];

class MathExerciseSession {
  constructor(){this.index=0;this.answers={};this.finished=false;}
  get example(){return mathExerciseExamples[this.index];}
  get solved(){return mathPlaces.every((place,i)=>this.answers[place]===this.example.parts[i]);}
  get progress(){return this.finished?3:this.index+(this.solved?1:0);}
  place(value,place){
    const index=mathPlaces.indexOf(place);
    if(this.finished||this.solved||index<0||this.answers[place]!==undefined)return false;
    if(!this.example.options.includes(value)||value!==this.example.parts[index])return false;
    this.answers[place]=value;return true;
  }
  remove(place){
    if(this.finished||this.solved||this.answers[place]===undefined)return false;
    delete this.answers[place];return true;
  }
  next(){
    if(this.finished||!this.solved)return false;
    if(this.index===mathExerciseExamples.length-1){this.finished=true;return 'finished';}
    this.index++;this.answers={};return 'next';
  }
}

let mathSession=null,mathActive=false,mathInitialized=false,mathCompletion=null;
let mathAdvanceTimer=0,mathErrorTimer=0,mathSelected=null,mathDrag=null,mathHover=null,mathClickBlockUntil=0;
const mathElement=id=>document.getElementById(id);
const mathPlaceFor=value=>value>=100?'hundreds':value>=10?'tens':'ones';

function isMathExerciseComplete(){return !!mathSession?.finished;}
function updateMathBoardScale(){
  if(mathActive)mathElement('assembly-scene').style.setProperty('--assembly-scale',String(mathElement('assembly-board').clientWidth/565));
}
function mathMessage(text){mathElement('exercise-status').textContent=text;}
function renderMathExercise(){
  const example=mathSession.example,solved=mathSession.solved;
  mathElement('exercise-count').textContent=(mathSession.index+1)+' из 3';
  mathElement('exercise-progress').setAttribute('aria-valuenow',String(mathSession.progress));
  mathElement('exercise-progress').setAttribute('aria-valuetext','Решено '+mathSession.progress+' из 3 заданий');
  mathElement('exercise-dots').innerHTML=mathExerciseExamples.map((_,i)=>'<span class="exercise-dot '+(i<mathSession.progress?'done':i===mathSession.index?'current':'')+'" aria-hidden="true"></span>').join('');
  mathElement('machine-number').textContent=String(example.number);
  mathElement('assembly-board').dataset.state=solved?'correct':'active';
  mathElement('assembly-board').setAttribute('aria-label','Собери число '+example.number+' из сотен, десятков и единиц');
  mathElement('assembly-slots').innerHTML=mathPlaces.map((place,i)=>{
    const value=mathSession.answers[place],cells=3-i;
    return '<button type="button" class="assembly-slot part-shape '+(value===undefined?'':'is-filled')+'" style="--cells:'+cells+'" data-drop-place="'+place+'" aria-label="'+mathPlaceNames[i]+(value===undefined?': положи деталь':': '+value+'. Нажми, чтобы вернуть деталь')+'" '+(solved?'disabled':'')+'>'+(value===undefined?'':value)+'</button>';
  }).join('');
  mathElement('exercise-parts').innerHTML=example.options.map(value=>{
    const used=Object.values(mathSession.answers).includes(value);
    return '<button type="button" class="exercise-part part-shape '+(used?'is-used':'')+' '+(mathSelected===value?'is-selected':'')+'" style="--cells:'+String(value).length+'" data-piece="'+value+'" aria-label="Деталь '+value+'" aria-pressed="'+String(mathSelected===value)+'" '+(used||solved?'disabled':'')+'>'+value+'</button>';
  }).join('');
  updateMathBoardScale();
}
function clearMathHover(){if(mathHover){mathHover.classList.remove('is-drop-hover');mathHover=null;}}
function clearMathDrag(){
  if(!mathDrag)return;
  try{mathDrag.source.releasePointerCapture(mathDrag.pointerId);}catch{}
  mathDrag.source.classList.remove('is-dragging');mathDrag.ghost?.remove();mathDrag=null;
  clearMathHover();document.body.classList.remove('math-dragging');
}
function stopMathExercise(){
  mathActive=false;clearTimeout(mathAdvanceTimer);clearTimeout(mathErrorTimer);
  mathAdvanceTimer=0;mathErrorTimer=0;mathSelected=null;mathCompletion=null;clearMathDrag();
}
function chooseMathPart(value){
  if(!mathActive||mathSession.solved||Object.values(mathSession.answers).includes(value))return;
  mathSelected=value;renderMathExercise();
  mathMessage('Выбрана деталь '+value+'. Положи её в серый контейнер.');
  mathElement('assembly-slots').querySelector('[data-drop-place="'+mathPlaceFor(value)+'"]').focus({preventScroll:true});
}
function placeMathPart(value,place){
  if(!mathActive||mathSession.solved)return;
  clearTimeout(mathErrorTimer);mathSelected=null;
  const accepted=mathSession.place(value,place);
  renderMathExercise();
  if(!accepted){
    mathElement('assembly-board').dataset.state='wrong';
    mathMessage('Эта деталь не подходит. Попробуй другую.');
    mathErrorTimer=setTimeout(()=>{if(mathActive&&!mathSession.solved)mathElement('assembly-board').dataset.state='active';},650);
    return;
  }
  if(!mathSession.solved){mathMessage('Верно! Найди остальные детали.');return;}
  mathMessage('Верно! '+mathSession.example.number+' = '+mathSession.example.parts.join(' + '));
  mathAdvanceTimer=setTimeout(()=>{
    if(!mathActive)return;
    mathAdvanceTimer=0;
    if(mathSession.next()==='finished'){mathCompletion?.();return;}
    renderMathExercise();mathMessage('Следующий пример. Собери число '+mathSession.example.number+'.');
    mathElement('exercise-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  },950);
}
function beginMathDrag(event){
  const source=event.target.closest('[data-piece]');
  if(!mathActive||!source||source.disabled||mathSession.solved||event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
  event.preventDefault();clearMathDrag();mathSelected=null;
  const rect=source.getBoundingClientRect();
  mathDrag={source,value:Number(source.dataset.piece),pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,width:rect.width,height:rect.height,moved:false,ghost:null};
  source.setPointerCapture(event.pointerId);
}
function moveMathDrag(event){
  if(!mathDrag||event.pointerId!==mathDrag.pointerId)return;
  event.preventDefault();
  if(!mathDrag.moved&&Math.hypot(event.clientX-mathDrag.startX,event.clientY-mathDrag.startY)<6)return;
  mathDrag.moved=true;
  if(!mathDrag.ghost){
    const ghost=mathDrag.source.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('data-piece');
    ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.classList.add('part-ghost');
    ghost.style.width=mathDrag.width+'px';ghost.style.height=mathDrag.height+'px';
    document.body.append(ghost);mathDrag.ghost=ghost;
    mathDrag.source.classList.add('is-dragging');document.body.classList.add('math-dragging');
  }
  mathDrag.ghost.style.transform='translate3d('+(event.clientX-mathDrag.offsetX)+'px,'+(event.clientY-mathDrag.offsetY)+'px,0) rotate(-3deg)';
  const target=document.elementFromPoint(event.clientX,event.clientY);
  const hover=target?.closest('[data-drop-place]')||target?.closest('#assembly-board');
  if(hover!==mathHover){clearMathHover();mathHover=hover;if(mathHover)mathHover.classList.add('is-drop-hover');}
}
function endMathDrag(event){
  if(!mathDrag||event.pointerId!==mathDrag.pointerId)return;
  const {value,moved}=mathDrag;
  const target=document.elementFromPoint(event.clientX,event.clientY);
  const slot=target?.closest('[data-drop-place]'),board=target?.closest('#assembly-board');
  clearMathDrag();mathClickBlockUntil=performance.now()+100;
  if(!moved){chooseMathPart(value);return;}
  if(slot||board)placeMathPart(value,slot?slot.dataset.dropPlace:mathPlaceFor(value));
}
function initializeMathExercise(){
  if(mathInitialized)return;
  mathInitialized=true;
  mathElement('exercise-back').addEventListener('click',returnToMath);
  mathElement('exercise-parts').addEventListener('pointerdown',beginMathDrag);
  window.addEventListener('pointermove',moveMathDrag,{passive:false});
  window.addEventListener('pointerup',endMathDrag);
  window.addEventListener('pointercancel',()=>clearMathDrag());
  window.addEventListener('blur',()=>clearMathDrag());
  window.addEventListener('resize',updateMathBoardScale);
  mathElement('exercise-screen').addEventListener('click',event=>{
    if(!mathActive||mathSession.solved)return;
    const piece=event.target.closest('[data-piece]');
    if(piece){if(event.detail>0&&performance.now()<mathClickBlockUntil)return;chooseMathPart(Number(piece.dataset.piece));return;}
    const slot=event.target.closest('[data-drop-place]');
    if(slot){
      if(mathSelected!==null)placeMathPart(mathSelected,slot.dataset.dropPlace);
      else if(mathSession.remove(slot.dataset.dropPlace)){renderMathExercise();mathMessage('Деталь возвращена. Попробуй собрать число снова.');}
    }else if(mathSelected!==null&&event.target.closest('#assembly-board'))placeMathPart(mathSelected,mathPlaceFor(mathSelected));
  });
}
function startMathExercise(onComplete){
  stopMathExercise();mathSession=new MathExerciseSession();mathActive=true;mathCompletion=onComplete;
  initializeMathExercise();renderMathExercise();mathMessage('Перетащи подходящие детали в серый контейнер.');
}
