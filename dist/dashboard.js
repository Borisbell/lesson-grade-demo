'use strict';
const dashboardAsset = name => `assets/dashboard-${name}`;
function dashboardGrade(complete,row) {
  const card = `<div class="dashboard-grade-slot"><div class="dashboard-grade-circle"><img class="dashboard-circle-base" src="${dashboardAsset('imgEllipse8332.svg')}" alt=""><div class="dashboard-circle-green"><img src="${dashboardAsset(complete?'imgEllipse8334.svg':'imgEllipse8335.svg')}" alt=""></div><div class="dashboard-circle-red"><img src="${dashboardAsset(complete?'imgEllipse8333.svg':'imgEllipse8336.svg')}" alt=""></div>${complete?'<strong>4</strong>':`<div class="dashboard-circle-eggs"><img src="${dashboardAsset(row===3?'imgGroup2043682883.svg':'imgGroup2043682882.svg')}" alt=""></div>`}</div></div><span class="lesson-label">Оценка за урок</span>`;
  return `<div class="lesson-card dashboard-grade" aria-label="${complete?'Оценка за урок — 4':'Оценка за урок пока недоступна'}" ${complete?'':'aria-disabled="true"'}>${card}</div>`;
}
function dashboardLesson(title,asset,state) {
  const picture = `<div class="lesson-picture ${state}"><div class="lesson-preview"><img class="lesson-thumbnail" src="${dashboardAsset(asset)}" alt="">${state==='locked'?`<img class="lesson-bw" src="${dashboardAsset('imgBwFilter.svg')}" alt="">`:''}${state==='active'?`<img class="lesson-active-overlay" src="${dashboardAsset('imgPreview1.svg')}" alt="">`:''}</div>${state==='done'?`<img class="lesson-state-icon" src="${dashboardAsset('imgIconCheckCircle.svg')}" alt="Пройдено">`:''}${state==='locked'?`<img class="lesson-state-icon" src="${dashboardAsset('imgIconCircleLock.svg')}" alt="Недоступно">`:''}${state==='active'?`<span class="lesson-play"><img src="${dashboardAsset('imgPlay.svg')}" alt=""></span><img class="lesson-grisha" src="${dashboardAsset('imgGrisha.svg')}" alt="">`:''}</div>`;
  const content = `${picture}<span class="lesson-label">${title}</span>`;
  return state === 'active' ? `<button type="button" id="start-lesson-result" data-start-lesson class="lesson-card active-lesson" aria-label="Начать урок ${title}">${content}</button>` : `<div class="lesson-card" data-state="${state}">${content}</div>`;
}
const dashboardModules = [
  {title:'Космическое приключение',lessons:[['Старт','imgProperty101.png','done'],['Пройденный урок','imgProperty101.png','done'],['Пройденный урок','imgProperty101.png','done'],['Исследуй планету','imgPreview.png','active']]},
  {title:'Первый, второй, третий',lessons:[['Порядковые числительные','imgPreview2.png','locked'],['Кто в каком вагоне?','imgPreview3.png','locked'],['Выбери ответ','imgPreview4.png','locked']]},
  {title:'Числовой ряд и числовая ось',lessons:[['Учим порядок чисел. Заполни пропуски','imgPreview5.png','locked'],['Знакомимся с числовой осью. Посади...','imgPreview6.png','locked'],['Знакомимся с числовой осью. На какой точке...','imgPreview7.png','locked'],['Учим числа в обратном порядке. Заполн...','imgPreview8.png','locked']]},
  {title:'Количество до 10',lessons:[['Учимся считать. Сколько кубиков?','imgPreview9.png','locked'],['Учимся считать. Посчитай апельсины','imgPreview10.png','locked'],['Учимся считать. Покрась и посчитай бусины','imgPreview11.png','locked'],['Учимся считать. Фрукты в банке','imgPreview12.png','locked']]}
];
function getDashboardModules(completed) {
  return dashboardModules.map((module,row)=>({...module,lessons:module.lessons.map(([title,asset,state],index)=>[title,asset,completed&&row===0?'done':completed&&row===1&&index===0?'active':state])}));
}
function renderDashboard(completed = false) {
  const modules = getDashboardModules(completed);
  document.getElementById('dashboard-tutor-promo').hidden = !completed;
  document.body.dataset.completed = String(completed);
  document.getElementById('lesson-modules').innerHTML = modules.map((module,row)=>`<section class="lesson-module ${row>1?'long-module':''}" aria-labelledby="module-${row}"><h3 id="module-${row}">${module.title}</h3><div class="lesson-row-scroll"><div class="lesson-row">${module.lessons.map(lesson=>dashboardLesson(...lesson)).join('')}${dashboardGrade(completed&&row===0,row)}</div></div></section>`).join('');
  document.getElementById('grades-topic-list').innerHTML = modules.map(module=>{
    const done = module.lessons.filter(lesson=>lesson[2]==='done').length;
    const active = module.lessons.some(lesson=>lesson[2]==='active');
    if (done===module.lessons.length) return `<div class="grades-completed" aria-label="${module.title}: пройдено, оценка 4"><span><img src="${dashboardAsset('imgCheck.svg')}" alt="">${module.title}</span><strong>4</strong></div>`;
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
function resetDashboard(completed = false) {
  renderDashboard(completed);
  document.getElementById('grades-scroll').scrollTop=0;
  document.getElementById('dashboard-tabs').scrollLeft=0;
  document.querySelectorAll('.grades-section').forEach((section,index)=>{section.open=index===0;});
}
