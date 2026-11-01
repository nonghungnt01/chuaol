export const CAPACITY=160,MAX_CAPACITY=200;
export function normalizeCapacity(value=CAPACITY){const n=Number(value);return Number.isFinite(n)?Math.max(1,Math.min(MAX_CAPACITY,Math.round(n))):CAPACITY;}
export function migrateSeating(people,cursor=0,previousCapacity=240,requested=CAPACITY){
 const capacity=normalizeCapacity(requested);
 if(previousCapacity<capacity&&people.length>=previousCapacity){const ordered=[...people.slice(cursor),...people.slice(0,cursor)];return {people:ordered.slice(-capacity),cursor:ordered.length%capacity};}
 if(people.length<=capacity)return {people:people.slice(),cursor:people.length<capacity?people.length:cursor%capacity};
 const ordered=people.length>=previousCapacity?[...people.slice(cursor),...people.slice(0,cursor)]:people;
 return {people:ordered.slice(-capacity),cursor:0};
}
export function assignComment(people,p,cursor=0,requested=CAPACITY){
 const capacity=normalizeCapacity(requested),existing=people.find(x=>x.id===p.id);
 if(existing){Object.assign(existing,{id:p.id,name:p.name,avatar:p.avatar});return cursor;}
 const person={id:p.id,name:p.name,avatar:p.avatar},vacant=people.findIndex(x=>x.vacant);
 if(vacant>=0){people[vacant]=person;return cursor;}
 if(people.length<capacity){people.push(person);return people.length%capacity;}
 people[cursor%capacity]=person;return(cursor+1)%capacity;
}
export function fixedSeats(people,requested=CAPACITY){return Array.from({length:normalizeCapacity(requested)},(_,i)=>people[i]||{id:'anonymous-seat-'+i,name:'',avatar:'',anonymous:true});}
