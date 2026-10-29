'use strict';
const dashboardAsset = name => `assets/${/^imgPreview(?:[2-9]|1[01])?\.png$/.test(name)?'oct26-dash-':'dashboard-'}${name}`;
function dashboardGrade(complete,row,pending=false) {
  if(pending)return '<button type="button" class="lesson-card dashboard-grade available-grade" data-resume-grade aria-label="Узнать оценку за урок"><div class="dashboard-grade-slot"><img class="dashboard-chest" src="assets/oct28-chest-available.png" alt="Цветной сундук: оценка готова"></div><span class="lesson-label">Оценка за урок</span></button>';
  if(!complete)return '<div class="lesson-card dashboard-grade locked-grade" aria-label="Оценка за урок пока недоступна" aria-disabled="true"><div class="dashboard-grade-slot"><img class="dashboard-chest" src="assets/oct28-chest-locked.png" alt="Закрытый сундук с оценкой"></div><span class="lesson-label">Оценка за урок</span></div>';
  return '<button type="button" class="lesson-card dashboard-grade" data-open-result="excellent" aria-label="Оценка за урок — 5"><div class="dashboard-grade-slot"><div class="dashboard-grade-circle"><img class="dashboard-circle-base-new" src="assets/oct26-dash-imgEllipse8332.svg" alt=""><span class="dashboard-grade-arc"><img src="assets/oct26-dash-imgEllipse8334.svg" alt=""><img src="assets/oct26-dash-imgEllipse8333.svg" alt=""></span><strong class="completed-grade-number">5</strong></div></div><span class="lesson-label">Оценка за урок</span></button>';
}
function sectionSummary(){return '<section class="section-summary" aria-labelledby="section-summary-title"><h3 id="section-summary-title">Промежуточный итог раздела</h3><div class="section-summary-card"><button type="button" class="section-summary-score" data-open-support aria-label="Подробнее о промежуточном итоге раздела"><div class="section-mini-score"><span class="score-base"><img src="assets/oct26-dash-imgEllipse8335.svg" alt=""></span><span class="score-arc"><img src="assets/oct26-dash-imgEllipse8336.svg" alt=""></span><span class="score-secondary"><img src="assets/oct26-dash-imgEllipse8337.svg" alt=""></span><strong>3,2</strong></div><div class="section-mini-stat">Верные ответы<div><span class="section-mini-track"><i></i></span><b>60%</b></div></div><div class="section-mini-stat">Средняя скорость<div><span class="section-mini-track"><i></i></span><b>8 мин</b></div></div></button><div class="section-summary-copy"><p class="recommendation-label">3 БЕСПЛАТНЫХ ЗАНЯТИЯ С РЕПЕТИТОРОМ УЧИ.РУ</p><h4>Нужно отработать проблемные темы</h4><p>Разберём ошибки с репетитором.<br>Поможем решать сложные задания увереннее</p><button type="button" data-section-signup class="button masterclass-signup">Записаться на бесплатный мастер-класс</button><div class="masterclass-legal"><p>Нажимая «Записаться», я соглашаюсь на передачу персональных данных в ООО «ПРЕПРЕП.РУ» и принимаю пользовательскую документацию</p><span class="ad">Реклама<img src="assets/v2-ad.svg" alt=""></span></div></div></div></section>';}
function dashboardLesson(title,asset,state) {
  const picture = `<div class="lesson-picture ${state}"><div class="lesson-preview"><img class="lesson-thumbnail" src="${dashboardAsset(asset)}" alt="">${state==='locked'?`<img class="lesson-bw" src="${dashboardAsset('imgBwFilter.svg')}" alt="">`:''}${state==='active'?`<img class="lesson-active-overlay" src="${dashboardAsset('imgPreview1.svg')}" alt="">`:''}</div>${state==='done'?`<img class="lesson-state-icon" src="${dashboardAsset('imgIconCheckCircle.svg')}" alt="Пройдено">`:''}${state==='locked'?`<img class="lesson-state-icon" src="${dashboardAsset('imgIconCircleLock.svg')}" alt="Недоступно">`:''}${state==='active'?`<span class="lesson-play"><img src="${dashboardAsset('imgPlay.svg')}" alt=""></span><img class="lesson-grisha" src="${dashboardAsset('imgGrisha.svg')}" alt="">`:''}</div>`;
  const content = `${picture}<span class="lesson-label">${title}</span>`;
  return state === 'active' ? `<button type="button" id="start-lesson-result" data-start-lesson class="lesson-card active-lesson" aria-label="Начать урок ${title}">${content}</button>` : `<div class="lesson-card" data-state="${state}">${content}</div>`;
}
const dashboardModules = [
  {title:'Космическое приключение',lessons:[['Старт','imgProperty101.png','done'],['Пройденный урок','imgProperty101.png','done'],['Пройденный урок','imgProperty101.png','done'],['Исследуй планету','imgPreview.png','active']]},
  {title:'Первый, второй, третий',lessons:[['Исследуй планету','imgPreview.png','locked'],['Кто в каком вагоне?','imgPreview2.png','locked'],['Выбери ответ','imgPreview3.png','locked']]},
  {title:'Числовой ряд и числовая ось',lessons:[['Учим порядок чисел. Заполни пропуски','imgPreview4.png','locked'],['Знакомимся с числовой осью. Посади...','imgPreview5.png','locked'],['Знакомимся с числовой осью. На какой точке...','imgPreview6.png','locked'],['Учим числа в обратном порядке. Заполн...','imgPreview7.png','locked']]},
  {title:'Количество до 10',lessons:[['Учимся считать. Сколько кубиков?','imgPreview8.png','locked'],['Учимся считать. Посчитай апельсины','imgPreview9.png','locked'],['Учимся считать. Покрась и посчитай бусины','imgPreview10.png','locked'],['Учимся считать. Фрукты в банке','imgPreview11.png','locked']]}
];
function getDashboardModules(completed) {
  return dashboardModules.map((module,row)=>({...module,lessons:module.lessons.map(([title,asset,state],index)=>[completed&&row===0&&index===3?'Пройденный урок':title,completed&&row===0&&index===3?'imgProperty101.png':asset,completed&&row===0?'done':completed&&row===1&&index===0?'active':state])}));
}
function renderDashboard(completed = false,pending = false) {
  const modules = getDashboardModules(completed||pending);
  document.getElementById('dashboard-tutor-promo').hidden = !completed;
  document.body.dataset.completed = String(completed);
  document.body.dataset.gradePending = String(pending);
  document.getElementById('lesson-modules').innerHTML = modules.map((module,row)=>`<section class="lesson-module ${row>1?'long-module':''}" aria-labelledby="module-${row}"><h3 id="module-${row}">${module.title}</h3><div class="lesson-row-scroll"><div class="lesson-row">${module.lessons.map(lesson=>dashboardLesson(...lesson)).join('')}${dashboardGrade(completed&&row===0,row,pending&&row===0)}</div></div></section>${completed&&row===1?sectionSummary():''}`).join('');
  document.getElementById('grades-topic-list').innerHTML = modules.map((module,row)=>{
    const done = module.lessons.filter(lesson=>lesson[2]==='done').length;
    const active = module.lessons.some(lesson=>lesson[2]==='active');
    if (done===module.lessons.length) return `<div class="grades-completed" aria-label="${module.title}: пройдено, ${pending&&row===0?'оценка готова':'оценка 5'}"><span><img src="${dashboardAsset('imgCheck.svg')}" alt="">${module.title}</span><strong>${pending&&row===0?'Оценка готова':'5'}</strong></div>`;
    if (active) {
      const progress = Math.round(done/module.lessons.length*100);
      return `<div class="grades-progress-row"><span>${module.title}</span><div class="grades-progress" role="progressbar" aria-label="Прогресс: ${module.title}, пройдено ${done} из ${module.lessons.length} уроков" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div></div>`;
    }
    return `<p class="grades-future grades-ellipsis" aria-label="${module.title}: пока недоступно">${module.title}</p>`;
  }).join('');
}
renderDashboard();
document.getElementById('dashboard-tabs-next').addEventListener('click',()=>document.getElementById('dashboard-tabs').scrollBy({left:320,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
document.getElementById('dashboard-back').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
function resetDashboard(completed = false,pending = false) {
  renderDashboard(completed,pending);
  document.getElementById('grades-scroll').scrollTop=0;
  document.getElementById('dashboard-tabs').scrollLeft=0;
  document.querySelectorAll('.grades-section').forEach((section,index)=>{section.open=index===0;});
}
