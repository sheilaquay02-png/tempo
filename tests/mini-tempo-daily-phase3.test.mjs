import test from "node:test";
import assert from "node:assert/strict";
import {miniTaskRows,nextUpcomingEvent} from "../utils/miniTempoDaily.js";

test("Mini lists every task due today, unfinished first by priority, then completed",()=>{
  const input=[
    {id:"a",title:"Low",priority:"low",done:false},
    {id:"b",title:"High",priority:"high",done:false},
    {id:"c",title:"Medium",priority:"medium",done:false},
    {id:"d",title:"Extra",priority:"low",done:false},
    {id:"e",title:"Completed today",done:true},
  ];
  assert.deepEqual(miniTaskRows(input).map(t=>t.id),["b","c","a","d","e"]);
  assert.deepEqual(input.map(t=>t.id),["a","b","c","d","e"],"Input order must not change");
});

test("Checking a task keeps it in Mini for Undo without hiding other tasks",()=>{
  const tasks=[
    {id:"a",title:"Done just now",done:true,priority:"high"},
    {id:"b",title:"Plan",done:false,priority:"medium"},
    {id:"c",title:"Read",done:false,priority:"medium"},
    {id:"d",title:"Stretch",done:false,priority:"low"},
  ];
  const rows=miniTaskRows(tasks,"a");
  assert.deepEqual(rows.map(t=>t.id),["a","b","c","d"]);
  assert.equal(rows[0].done,true);
  assert.deepEqual(miniTaskRows(tasks,"missing").map(t=>t.id),["b","c","d","a"]);
  const undone=tasks.map(t=>t.id==="a"?{...t,done:false}:t);
  assert.equal(miniTaskRows(undone,"a")[0].id,"a");
});

test("Mini renders more than three tasks and retains completed ones without a limit",()=>{
  const many=Array.from({length:18},(_,i)=>({
    id:`task-${i}`,title:`Task ${i}`,priority:i%3===0?"high":"low",done:i>=12
  }));
  const rendered=miniTaskRows(many);
  assert.equal(rendered.length,18);
  assert.equal(new Set(rendered.map(t=>t.id)).size,18);
  assert.equal(rendered.filter(t=>t.done).length,6);
  assert.deepEqual(miniTaskRows(many,"task-17").map(t=>t.id).slice(0,1),["task-17"]);
  assert.deepEqual(miniTaskRows(many.filter(t=>t.done)).map(t=>t.id),many.filter(t=>t.done).map(t=>t.id));
  assert.deepEqual(miniTaskRows([]),[]);
});

test("Mini next event searches future days and skips expired events",()=>{
  const events=[
    {id:"past",title:"Past",start:new Date("2026-11-17T09:00:00+08:00"),end:new Date("2026-11-17T10:00:00+08:00")},
    {id:"tomorrow",title:"Tomorrow",start:new Date("2026-11-18T09:00:00+08:00"),end:new Date("2026-11-18T10:00:00+08:00")},
    {id:"next-week",title:"Next week",start:new Date("2026-11-25T09:00:00+08:00"),end:new Date("2026-11-25T10:00:00+08:00")},
  ];
  assert.equal(nextUpcomingEvent(events,new Date("2026-11-17T16:00:00+08:00")).id,"tomorrow");
  assert.equal(nextUpcomingEvent(events,new Date("2026-11-26T16:00:00+08:00")),null);
});
