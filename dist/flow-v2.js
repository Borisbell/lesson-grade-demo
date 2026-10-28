'use strict';
const $ = id => document.getElementById(id);
const screens=['dashboard-screen','reward-screen','parent-screen','result-screen','bonus-screen'];
const resultParts=['statistics','grade','result-reward','tutor','result-details','result-footer'];
let resultKind='excellent';
let metrics=[['minutes',6],['correct',96]];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gradePreparationMs=7000/1.33/2;
let run=0,frame=0,ready=false,parentVerified=false,hasLessonResult=false,hasPendingLessonResult=false,dialogAction=()=>{};
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
function setScoreProgress(progress){
  // Begin before the rounded top cap so it appears at the start, not after a full turn.
  const angle=Math.max(0,Math.min(progress,1))*360;
  const mask=`conic-gradient(from -20deg,#000 ${angle}deg,transparent ${angle}deg)`;
  $('chart-reveal').style.maskImage=mask;
  $('chart-reveal').style.webkitMaskImage=mask;
}
function animateScore(token){
  setScoreProgress(0);
  return animate(reducedMotion?60:1900,p=>{
    const eased=1-Math.pow(1-p,2.3);
    setScoreProgress(eased);
    metrics.forEach(([id,value])=>$(id).textContent=String(Math.round(value*eased)));
    $('result-screen').style.setProperty('--metric-progress',String(eased));
  },token);
}
function resetReward(){
  $('result-reward').dataset.rewardPhase='waiting';
}
async function playReward(token=run){
  const reward=$('result-reward'),count=$('reward-count'),total=resultKind==='excellent'?30:10;
  if(reducedMotion){
    reward.dataset.rewardPhase='settled';count.textContent=String(total);
    reveal('result-reward');return true;
  }
  resetReward();count.textContent='0';
  // Reset CSS keyframes even when the previous reveal was interrupted.
  void reward.offsetWidth;
  reward.dataset.rewardPhase='playing';reveal('result-reward');
  if(!await animate(1700,p=>{
    const progress=Math.max(0,Math.min(1,(p-.73)/.27));
    count.textContent=String(Math.round(total*(1-Math.pow(1-progress,3))));
  },token))return false;
  reward.dataset.rewardPhase='settled';count.textContent=String(total);return true;
}
function syncResultVideo(){
  const video=$('masterclass-video');
  if($('stage').dataset.step==='result'&&resultKind==='excellent'){
    video.muted=true;
    const playback=video.play();
    if(playback)playback.catch(error=>{if(error.name==='NotAllowedError')video.controls=true;});
  }else video.pause();
}
function stopParentNarration(){
  const audio=$('parent-narration');audio.pause();audio.currentTime=0;
}
function playParentNarration(){
  stopParentNarration();
  const playback=$('parent-narration').play();
  // The sound button remains available if a browser requires another user gesture.
  if(playback)playback.catch(()=>{});
}
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
  if(id==='parent-screen')playParentNarration();else stopParentNarration();
  screens.forEach(screen=>{$(screen).hidden=screen!==id;});
  $('stage').dataset.step=step;
  document.body.dataset.view=step==='dashboard'?'dashboard':step==='bonus'?'bonus':step==='result'?'analytics':'lesson';
  syncResultVideo();
  if(step==='result'){$('analytics-scroll').scrollTop=0;updateTeacherScale();}
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
  setScoreProgress(0);resetReward();
  resetTutorForm();toggleTaskDetails(false);$('result-screen').style.setProperty('--metric-progress','0');
}
function clearParentError(){
  $('parent-answer-error').hidden=true;$('parent-answer-error').textContent='';$('parent-answer').removeAttribute('aria-invalid');
}
function returnToMath(){
  run++;cancelAnimationFrame(frame);
  $('demo-dialog').close();$('parent-check').close();$('signup-dialog').close();
  ready=false;parentVerified=false;
  $('parent-answer').value='';clearParentError();resetResults();
  resetDashboard(hasLessonResult,hasPendingLessonResult);
  showScreen('dashboard-screen','dashboard','dashboard-title');
}
function restart(){hasLessonResult=false;hasPendingLessonResult=false;returnToMath();}
function beginLessonResult(){
  if($('stage').dataset.step!=='dashboard')return;
  run++;cancelAnimationFrame(frame);ready=false;parentVerified=false;resetResults();
  hasPendingLessonResult=!hasLessonResult;
  applyResult('excellent');showScreen('reward-screen','reward','reward-title');
}
function resumeLessonResult(){
  if($('stage').dataset.step!=='dashboard'||!hasPendingLessonResult)return;
  ready=false;parentVerified=false;resetResults();applyResult('excellent');prepareGrade();
}
function skipStatistics(){
  if(!['preparing','ready'].includes($('stage').dataset.step))return;
  hasPendingLessonResult=!hasLessonResult;returnToMath();
  $('progress-status').textContent='Оценку можно посмотреть позже. Нажмите на цветной сундук в пройденной теме.';
}
async function prepareGrade(){
  if($('stage').dataset.step!=='reward'&&!($('stage').dataset.step==='dashboard'&&hasPendingLessonResult))return;
  const token=++run;
  $('parent-screen').classList.remove('ready');
  $('parent-title').textContent='Посмотри оценку с родителем';
  $('preparing').hidden=false;$('open-result').hidden=true;
  $('progress-fill').style.transform='scaleX(0)';$('progress-percent').textContent='0%';
  $('grade-progress').setAttribute('aria-valuenow','0');
  showScreen('parent-screen','preparing','parent-title');
  $('progress-status').textContent='Позови родителя, чтобы посмотреть оценку вместе.';
  if(!await animate(gradePreparationMs,p=>{
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
  if(!await animateScore(token))return;
  reveal('grade');
  $('progress-status').textContent='Оценка 4,8. Правильность 96%, время 6 минут.';
  if(!await pause(reducedMotion?60:850,token))return;
  if(!await playReward(token))return;
  ['tutor','result-details','result-footer'].forEach(reveal);
  $('tutor').inert=false;hasLessonResult=true;hasPendingLessonResult=false;
  $('progress-status').textContent='Итоги готовы. Раскройте статистику по заданиям или запишитесь на бесплатный мастер-класс.';
}
function openCalculatedResult(kind='excellent'){
  if(!hasLessonResult||!['dashboard','bonus'].includes($('stage').dataset.step))return;
  applyResult(kind);
  run++;cancelAnimationFrame(frame);
  showScreen('result-screen','result','result-title');resultParts.forEach(reveal);
  metrics.forEach(([id,value])=>$(id).textContent=String(value));
  $('result-screen').style.setProperty('--metric-progress','1');
  setScoreProgress(1);
  playReward(run);
  $('tutor').inert=false;
  $('progress-status').textContent=resultKind==='support'?'Оценка 3,2. Правильность 60%, время 8 минут.':'Оценка 4,8. Правильность 96%, время 6 минут.';
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
$('lesson-modules').addEventListener('click',event=>{
  if(event.target.closest('[data-start-lesson]'))beginLessonResult();
  else if(event.target.closest('[data-resume-grade]'))resumeLessonResult();
  else if(event.target.closest('[data-open-result]'))openCalculatedResult('excellent');
  else if(event.target.closest('[data-open-support]')){openCalculatedResult('support');toggleTaskDetails(true);}
  else if(event.target.closest('[data-section-signup]'))openSignup();
});
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
$('grade-voice').addEventListener('click',playParentNarration);
$('parent-check-voice').addEventListener('click',()=>speak('Решите пример. Двадцать семь плюс тридцать шесть.'));
$('restart').addEventListener('click',restart);
$('later').addEventListener('click',skipStatistics);
$('continue').addEventListener('click',openBonus);
$('bonus-continue').addEventListener('click',returnToMath);
$('dashboard-tutor-details').addEventListener('click',()=>openCalculatedResult());
$('copy-coupon').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText('ПРОМОКОД375');$('copy-coupon-label').textContent='Скопировано!';$('coupon-status').textContent='Промокод скопирован';}
  catch{openDialog('ПРОМОКОД375','Скидка 20% на любые занятия. Сохраните промокод, чтобы использовать его позже.','Понятно',()=>$('demo-dialog').close());}
});
$('use-coupon').addEventListener('click',()=>{
  if(hasLessonResult){openCalculatedResult(resultKind);openSignup();$('progress-status').textContent='Промокод ПРОМОКОД375 выбран. Запишитесь на занятие с репетитором.';}
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
  $('tutor-form').hidden=true;$('tutor-success').hidden=false;
  $('tutor-success-title').focus({preventScroll:true});
});
$('tutor-retry').addEventListener('click',()=>{resetTutorForm();$('phone').focus();});
function applyResult(kind){
  resultKind=kind==='support'?'support':'excellent';const bad=resultKind==='support';
  $('preview-excellent').setAttribute('aria-pressed',String(!bad));
  $('preview-support').setAttribute('aria-pressed',String(bad));
  metrics=[['minutes',bad?8:6],['correct',bad?60:96]];
  $('result-screen').dataset.resultKind=resultKind;
  $('score-value').textContent=bad?'3,2':'4,8';$('score-caption').hidden=false;
  $('score-caption').textContent=bad?'Средне':'Хорошо';
  $('lesson-score').setAttribute('aria-label',bad?'Оценка 3,2, средне':'Оценка 4,8, хорошо');
  $('reward-count').textContent=bad?'10':'30';
  $('result-reward').setAttribute('aria-label',bad?'Награда: 10 яиц':'Награда: 30 яиц');
  const chestGrade=bad?'3':'4';
  $('reward-chest-closed').src='assets/reward-chest-'+chestGrade+'-closed.png';
  $('reward-chest-opened').src='assets/reward-chest-'+chestGrade+'-opened.png';
  resetReward();
  const prefix=bad?'bad':'good';
  $('score-main-arc').src='assets/oct26-'+prefix+'-imgEllipse8334.svg';
  $('score-other-arc').src='assets/oct26-'+prefix+'-imgEllipse8333.svg';
  $('correct-icon').innerHTML='<img src="assets/oct26-'+prefix+'-imgFrame.svg" alt="">';
  $('speed-icon').innerHTML='<img src="assets/oct26-'+prefix+'-imgFrame1.svg" alt="">';
  $('correct-status').textContent=bad?'Ниже среднего':'Выше среднего';$('speed-status').textContent=bad?'Нормальная':'Быстрее среднего';
  $('excellent-recommendation').hidden=bad;$('support-recommendation').hidden=!bad;
  $('lesson-task-list').innerHTML=[0,1,2].map((_,i)=>{const n=bad?5:i===1?8:10;return '<article class="lesson-task"><img src="assets/oct26-'+(bad?'bad-img':i===1?'good-img1':'good-img')+'.png" alt="Превью задания"><div class="lesson-task-content"><h4>'+(bad?'Вычитание':'Сложение')+' в пределах 20</h4><div class="lesson-task-accuracy"><span>Правильно</span><span class="task-track"><i style="--task-value:'+n*10+'%"></i></span><strong>'+n+' из 10</strong></div><p class="lesson-task-time"><span>Время</span><strong>2 мин</strong></p></div></article>';}).join('');
  toggleTaskDetails(false);resetTutorForm();updateTeacherScale();syncResultVideo();
}
async function previewResult(kind){
  if($('stage').dataset.step!=='result'||kind===resultKind)return;
  const token=++run;cancelAnimationFrame(frame);
  const expanded=!$('lesson-task-details').hidden;
  applyResult(kind);resetResults();toggleTaskDetails(expanded);
  resultParts.filter(id=>id!=='grade'&&id!=='result-reward').forEach(reveal);
  $('tutor').inert=false;
  window.scrollTo({top:0,behavior:'instant'});
  if(!await animateScore(token))return;
  reveal('grade');hasLessonResult=true;hasPendingLessonResult=false;
  if(!await playReward(token))return;
  $('progress-status').textContent=resultKind==='support'?'Оценка 3,2. Правильность 60%, время 8 минут.':'Оценка 4,8. Правильность 96%, время 6 минут.';
}
function toggleTaskDetails(expanded){
  $('lesson-task-details').hidden=!expanded;$('toggle-lesson-details').setAttribute('aria-expanded',String(expanded));
  $('toggle-lesson-details').textContent=expanded?'Скрыть':'Подробнее';
}
function updateTeacherScale(){const width=$('teacher-photo').clientWidth;if(width)$('teacher-photo').style.setProperty('--teacher-scale',String(width/550));}
function openSignup(){resetTutorForm();$('signup-dialog').showModal();$('phone').focus();}
$('toggle-lesson-details').addEventListener('click',()=>toggleTaskDetails($('lesson-task-details').hidden));
$('preview-excellent').addEventListener('click',()=>previewResult('excellent'));
$('preview-support').addEventListener('click',()=>previewResult('support'));
$('masterclass-signup').addEventListener('click',openSignup);
$('signup-close').addEventListener('click',()=>$('signup-dialog').close());
window.addEventListener('resize',updateTeacherScale);
window.addEventListener('pagehide',stopParentNarration);
applyResult('excellent');setHeader(false);
