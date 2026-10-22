'use strict';
const $ = id => document.getElementById(id);
const screens=['dashboard-screen','reward-screen','parent-screen','result-screen','bonus-screen'];
const resultParts=['statistics','grade','result-reward','tutor','result-details','result-footer'];
const metrics=[['minutes',18],['correct',23],['errors',4]];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let run=0,frame=0,ready=false,parentVerified=false,hasLessonResult=false,dialogAction=()=>{};
function animate(duration,update,token=run){
  return new Promise(resolve=>{
    const start=performance.now();
    const tick=now=>{
      if(token!==run)return resolve(false);
      const p=Math.min((now-start)/duration,1);
      update(p);
      if(p<1)frame=requestAnimationFrame(tick);else resolve(true);
    };
    frame=requestAnimationFrame(tick);
  });
}
const pause=(ms,token)=>animate(ms,()=>{},token);
const reveal=id=>$(id).classList.add('shown');
function setHeader(bonus){
  $('nav-profile-name').textContent=bonus?'Ученик':'Константин К.';
  $('nav-logo').src=bonus?'assets/reward-imgUchi.svg':'assets/v2-logo.svg';
  $('nav-quest-icon').src=bonus?'assets/reward-imgGroup3965.svg':'assets/v2-quests.svg';
  $('nav-teacher-icon').src=bonus?'assets/reward-imgGroup1321316219.svg':'assets/v2-homework.svg';
  $('nav-avatar').src=bonus?'assets/reward-imgAvatarRaccoon.svg':'assets/v2-avatar.svg';
  $('nav-coins-icon').src=bonus?'assets/reward-imgGroup1321315931.svg':'assets/v2-coins.svg';
  $('nav-quest-counter').textContent=bonus?'4':'1';
  $('nav-gems-value').textContent='0';
  $('nav-coins-value').textContent=bonus?'123':'1734';
  $('egg-balance').textContent=bonus?'28':'1576';
}
function showScreen(id,step,title){
  screens.forEach(screen=>{$(screen).hidden=screen!==id;});
  $('stage').dataset.step=step;
  document.body.dataset.view=step==='dashboard'?'dashboard':step==='bonus'?'bonus':step==='result'?'analytics':'lesson';
  if(step==='result')$('analytics-scroll').scrollTop=0;
  setHeader(step==='bonus');
  $(title).focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
}
function resetTutorForm(){
  $('phone').value='';$('phone-error').hidden=true;$('phone').removeAttribute('aria-invalid');
  $('tutor-form').hidden=false;$('teacher-photo').hidden=false;$('tutor-success').hidden=true;
}
function resetResults(){
  resultParts.forEach(id=>$(id).classList.remove('shown'));
  $('tutor').inert=true;
  metrics.forEach(([id])=>$(id).textContent='0');
  $('chart-reveal').style.maskImage='conic-gradient(from 0deg,#000 0deg,transparent 0deg)';
  resetTutorForm();
}
function clearParentError(){
  $('parent-answer-error').hidden=true;$('parent-answer-error').textContent='';$('parent-answer').removeAttribute('aria-invalid');
}
function returnToMath(){
  run++;cancelAnimationFrame(frame);
  $('demo-dialog').close();$('parent-check').close();
  ready=false;parentVerified=false;
  $('parent-answer').value='';clearParentError();resetResults();
  resetDashboard(hasLessonResult);
  showScreen('dashboard-screen','dashboard','dashboard-title');
}
function restart(){hasLessonResult=false;returnToMath();}
function beginLessonResult(){
  if($('stage').dataset.step!=='dashboard')return;
  run++;cancelAnimationFrame(frame);ready=false;parentVerified=false;resetResults();
  showScreen('reward-screen','reward','reward-title');
}
async function prepareGrade(){
  if($('stage').dataset.step!=='reward')return;
  const token=++run;
  $('parent-screen').classList.remove('ready');
  $('parent-title').textContent='Посмотри оценку с родителем';
  $('preparing').hidden=false;$('open-result').hidden=true;
  $('progress-fill').style.transform='scaleX(0)';$('progress-percent').textContent='0%';
  $('grade-progress').setAttribute('aria-valuenow','0');
  showScreen('parent-screen','preparing','parent-title');
  $('progress-status').textContent='Позови родителя, чтобы посмотреть оценку вместе.';
  if(!await animate(7000,p=>{
    const value=Math.floor(p*100);
    $('progress-fill').style.transform=`scaleX(${p})`;
    $('progress-percent').textContent=`${value}%`;
    $('grade-progress').setAttribute('aria-valuenow',String(value));
  },token))return;
  ready=true;$('parent-screen').classList.add('ready');
  $('parent-title').textContent='Оценка готова!';
  $('preparing').hidden=true;$('open-result').hidden=false;
  $('stage').dataset.step='ready';
  $('progress-status').textContent='Оценка готова! Откройте её вместе с родителем.';
}
function openParentCheck(){
  if(!ready||$('stage').dataset.step!=='ready')return;
  parentVerified=false;$('parent-answer').value='';clearParentError();
  $('stage').dataset.step='parent-check';$('parent-check').showModal();$('parent-answer').focus();
}
function closeParentCheck(){
  $('parent-check').close();
  if($('stage').dataset.step==='parent-check')$('stage').dataset.step='ready';
}
async function openResults(){
  if(!ready||!parentVerified||$('stage').dataset.step!=='ready')return;
  const token=++run;
  showScreen('result-screen','result','result-title');reveal('statistics');
  if(!await pause(reducedMotion?60:450,token))return;
  if(!await animate(reducedMotion?60:1900,p=>{
    const eased=1-Math.pow(1-p,2.3),angle=eased*360;
    $('chart-reveal').style.maskImage=`conic-gradient(from 0deg,#000 ${angle}deg,transparent ${angle}deg)`;
    metrics.forEach(([id,value])=>$(id).textContent=String(Math.round(value*eased)));
  },token))return;
  reveal('grade');
  $('progress-status').textContent='Оценка 4, хорошо. 18 минут, 23 верных ответа, 4 ошибки.';
  if(!await pause(reducedMotion?60:850,token))return;
  reveal('result-reward');
  if(!await pause(reducedMotion?60:1100,token))return;
  ['tutor','result-details','result-footer'].forEach(reveal);
  $('tutor').inert=false;hasLessonResult=true;
  $('progress-status').textContent='Итоги готовы. Доступны три бесплатных занятия с репетитором и подробные результаты карточек.';
}
function openCalculatedResult(){
  if(!hasLessonResult||!['dashboard','bonus'].includes($('stage').dataset.step))return;
  run++;cancelAnimationFrame(frame);
  showScreen('result-screen','result','result-title');resultParts.forEach(reveal);
  metrics.forEach(([id,value])=>$(id).textContent=String(value));
  $('chart-reveal').style.maskImage='conic-gradient(from 0deg,#000 360deg,transparent 360deg)';
  $('tutor').inert=false;
  $('progress-status').textContent='Оценка 4, хорошо. 18 минут, 23 верных ответа, 4 ошибки.';
}
function openBonus(){
  run++;cancelAnimationFrame(frame);
  $('copy-coupon-label').textContent='ПРОМОКОД375';$('coupon-status').textContent='';
  showScreen('bonus-screen','bonus','bonus-title');
}
function openDialog(title,description,actionLabel,action){
  $('dialog-title').textContent=title;$('dialog-description').textContent=description;
  $('dialog-action').textContent=actionLabel;dialogAction=action;$('demo-dialog').showModal();
}
function speak(text){
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;
  window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(text);speech.lang='ru-RU';window.speechSynthesis.speak(speech);
}
$('lesson-modules').addEventListener('click',event=>{if(event.target.closest('[data-start-lesson]'))beginLessonResult();});
$('learn-grade').addEventListener('click',prepareGrade);
$('open-result').addEventListener('click',openParentCheck);
$('parent-check-close').addEventListener('click',closeParentCheck);
$('parent-check').addEventListener('close',()=>{if($('stage').dataset.step==='parent-check')$('stage').dataset.step='ready';});
$('parent-answer').addEventListener('input',clearParentError);
$('parent-check-form').addEventListener('submit',event=>{
  event.preventDefault();if(!ready||!$('parent-check').open||$('stage').dataset.step!=='parent-check')return;
  const answer=$('parent-answer').value.trim();
  if(!answer||!/^\d+$/.test(answer)||Number(answer)!==63){
    $('parent-answer-error').textContent=answer?'Неверно. Попробуйте ещё раз.':'Введите ответ на пример.';
    $('parent-answer-error').hidden=false;$('parent-answer').setAttribute('aria-invalid','true');$('parent-answer').focus();return;
  }
  parentVerified=true;closeParentCheck();openResults();
});
$('grade-voice').addEventListener('click',()=>speak('Посмотри оценку с родителем. Позови взрослого, чтобы узнать результат вместе.'));
$('parent-check-voice').addEventListener('click',()=>speak('Решите пример. Двадцать семь плюс тридцать шесть.'));
$('restart').addEventListener('click',restart);
$('later').addEventListener('click',openBonus);
$('continue').addEventListener('click',openBonus);
$('bonus-continue').addEventListener('click',returnToMath);
$('dashboard-tutor-details').addEventListener('click',openCalculatedResult);
$('copy-coupon').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText('ПРОМОКОД375');$('copy-coupon-label').textContent='Скопировано!';$('coupon-status').textContent='Промокод скопирован';}
  catch{openDialog('ПРОМОКОД375','Скидка 20% на любые занятия. Сохраните промокод, чтобы использовать его позже.','Понятно',()=>$('demo-dialog').close());}
});
$('use-coupon').addEventListener('click',()=>{
  if(hasLessonResult){openCalculatedResult();$('phone').focus();$('progress-status').textContent='Промокод ПРОМОКОД375 выбран. Запишитесь на занятие с репетитором.';}
  else openDialog('Скидка 20% на занятия','Твой промокод — ПРОМОКОД375. Сохрани его, чтобы использовать при выборе занятий.','Вернуться к урокам',returnToMath);
});
$('close-dialog').addEventListener('click',()=>$('demo-dialog').close());
$('dialog-action').addEventListener('click',()=>dialogAction());
$('phone').addEventListener('input',event=>{
  let digits=event.target.value.replace(/\D/g,'');
  if(digits.startsWith('7')||digits.startsWith('8'))digits=digits.slice(1);
  digits=digits.slice(0,10);
  let value=digits?'+7 ('+digits.slice(0,3):'';
  if(digits.length>=3)value+=') '+digits.slice(3,6);
  if(digits.length>=6)value+='-'+digits.slice(6,8);
  if(digits.length>=8)value+='-'+digits.slice(8,10);
  event.target.value=value;$('phone-error').hidden=true;event.target.removeAttribute('aria-invalid');
});
$('tutor-form').addEventListener('submit',event=>{
  event.preventDefault();
  if($('phone').value.replace(/\D/g,'').length!==11){$('phone-error').hidden=false;$('phone').setAttribute('aria-invalid','true');$('phone').focus();return;}
  $('phone-error').hidden=true;$('phone').removeAttribute('aria-invalid');
  $('tutor-form').hidden=true;$('teacher-photo').hidden=true;$('tutor-success').hidden=false;
  $('tutor-success-title').focus({preventScroll:true});
});
$('tutor-retry').addEventListener('click',()=>{resetTutorForm();$('phone').focus();});
setHeader(false);
