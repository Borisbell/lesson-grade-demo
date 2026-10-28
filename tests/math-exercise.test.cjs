const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/math-exercise.js'),'utf8'),context);
const Session=vm.runInContext('MathExerciseSession',context),lesson=new Session();
assert.equal(lesson.example.number,596);assert.equal(lesson.progress,0);assert.equal(lesson.finished,false);
assert.equal(lesson.next(),false);assert.equal(lesson.place(600,'hundreds'),false);assert.equal(lesson.place(90,'ones'),false);assert.equal(lesson.place(500,'missing'),false);
assert.equal(lesson.place(500,'hundreds'),true);assert.equal(lesson.place(500,'hundreds'),false);assert.equal(lesson.remove('hundreds'),true);assert.equal(lesson.answers.hundreds,undefined);assert.equal(lesson.progress,0);
const cases=[{number:596,parts:[500,90,6]},{number:358,parts:[300,50,8]},{number:742,parts:[700,40,2]}];
for(let i=0;i<cases.length;i++){
  assert.equal(lesson.example.number,cases[i].number);
  for(let j=0;j<3;j++)assert.equal(lesson.place(cases[i].parts[j],['hundreds','tens','ones'][j]),true);
  assert.equal(lesson.solved,true);assert.equal(lesson.progress,i+1);assert.equal(lesson.finished,false);
  assert.equal(lesson.remove('ones'),false);assert.equal(lesson.place(9,'ones'),false);
  assert.equal(lesson.next(),i===2?'finished':'next');assert.equal(lesson.finished,i===2);
}
assert.equal(lesson.progress,3);assert.equal(lesson.next(),false);assert.equal(lesson.place(700,'hundreds'),false);
const restarted=new Session();assert.equal(restarted.index,0);assert.equal(restarted.finished,false);assert.equal(restarted.progress,0);
console.log('PASS: three distinct number decompositions; wrong values/slots and duplicates rejected; undo; no advance before all three parts; finish only after three examples; restart.');
