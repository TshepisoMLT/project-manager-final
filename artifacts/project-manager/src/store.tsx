import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Status = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type ChecklistItem = { id: string; title: string; done: boolean };
export type Comment = { id: string; author: string; body: string; createdAt: string };
export type Activity = { id: string; action: string; detail: string; createdAt: string };
export type Project = { id: string; name: string; description: string; archived: boolean; createdAt: string };
export type Task = { id: string; projectId: string; title: string; description: string; status: Status; priority: Priority; assignee: string; dueDate: string; createdAt: string; updatedAt: string; checklist: ChecklistItem[]; comments: Comment[]; activity: Activity[] };
export type ProjectTemplate = { id: string; name: string; description: string; tasks: { title: string; description: string; priority: Priority; dueDaysFromStart: number }[] };
export type Reminder = { id: string; kind: 'due_soon' | 'overdue' | 'assignment'; projectId: string; taskId: string; message: string; date: string; read: boolean; dismissed: boolean };
type DataState = { projects: Project[]; tasks: Task[]; templates: ProjectTemplate[]; reminders: Reminder[] };
type Store = DataState & {
  ready: boolean;
  saveProject: (input: Partial<Project> & Pick<Project, 'name' | 'description'>, id?: string) => string;
  archiveProject: (id: string, archived: boolean) => void;
  saveTask: (input: Partial<Task> & Pick<Task, 'projectId' | 'title'>, id?: string) => string;
  removeTask: (id: string) => void;
  moveTask: (id: string, status: Status) => void;
  toggleCheck: (taskId: string, checkId: string) => void;
  addComment: (taskId: string, body: string) => void;
  saveTemplate: (template: ProjectTemplate) => void;
  addReminder: (task: Task, message: string) => void;
  markReminder: (id: string, dismissed?: boolean) => void;
};
const KEY = 'fieldnotes.project-manager.v1';
const ctx = createContext<Store | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isoDay = (delta: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + delta); return localDay(d); };
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
const event = (action: string, detail: string): Activity => ({ id: uid(), action, detail, createdAt: new Date().toISOString() });

function seed(): DataState {
  const projects: Project[] = [
    { id: 'p-aurora', name: 'Aurora identity', description: 'A new visual language for an independent climate journal.', archived: false, createdAt: ago(24 * 24) },
    { id: 'p-morrow', name: 'Morrow storefront', description: 'A considered online home for everyday objects.', archived: false, createdAt: ago(24 * 18) },
    { id: 'p-field', name: 'Fieldwork editorial', description: 'Six stories about the people shaping our cities.', archived: false, createdAt: ago(24 * 10) },
    { id: 'p-north', name: 'Northline pitch', description: 'Campaign concept and presentation for a new client.', archived: false, createdAt: ago(24 * 7) },
    { id: 'p-old', name: 'Studio annual report', description: 'A year in work, people, and ideas.', archived: true, createdAt: ago(24 * 55) },
  ];
  const raw: [string,string,string,Status,Priority,string,number][] = [
    ['p-aurora','Set visual territory','Build three distinct creative routes for the editorial identity.','review','high','Maya Chen',-2],
    ['p-aurora','Audit existing touchpoints','Collect current brand applications and note recurring patterns.','done','medium','Theo Park',-6],
    ['p-aurora','Design mark explorations','Explore a flexible symbol system that works at small sizes.','in_progress','high','Maya Chen',1],
    ['p-aurora','Prepare handoff notes','Document type, color, and spacing decisions for production.','todo','low','Sam Rivera',4],
    ['p-morrow','Product page wireframes','Map a calm, quick path from discovery to checkout.','in_progress','high','Theo Park',0],
    ['p-morrow','Photograph hero objects','Make a daylight still-life set for the opening collection.','todo','medium','Jules Martin',3],
    ['p-morrow','Review shipping states','Confirm edge cases for out-of-stock and split orders.','review','medium','Sam Rivera',2],
    ['p-morrow','Write checkout microcopy','Keep each step direct, reassuring, and brief.','done','low','Maya Chen',-3],
    ['p-field','Interview Imani Wells','Record a conversation about the new public library.','todo','high','Jules Martin',-1],
    ['p-field','Edit the opening essay','Shape the long read around the interview transcript.','in_progress','medium','Maya Chen',5],
    ['p-field','Source archival images','Find rights-cleared images for the story package.','todo','low','Theo Park',8],
    ['p-north','Draft campaign premise','Find a memorable idea rooted in the client’s local story.','in_progress','high','Sam Rivera',1],
    ['p-north','Build presentation flow','Turn the concept into a clear fifteen-minute narrative.','todo','medium','Maya Chen',6],
    ['p-north','Confirm project estimate','Check production scope and delivery assumptions.','todo','low','Theo Park',9],
    ['p-old','Gather studio highlights','Collect the work that defined the year.','done','low','Sam Rivera',-20],
  ];
  const tasks: Task[] = raw.map(([projectId,title,description,status,priority,assignee,days], i) => ({
    id:`t-${i+1}`, projectId, title, description, status: status as Status, priority: priority as Priority, assignee,
    dueDate:isoDay(days as number), createdAt:ago(i + 2), updatedAt:ago((i % 5) + 1),
    checklist:i===0 ? [{id:'c1',title:'Gather reference examples',done:true},{id:'c2',title:'Prepare route rationale',done:false},{id:'c3',title:'Share with the team',done:false}] : [],
    comments:i===0 ? [{id:'cm1',author:'Theo Park',body:'Route two is feeling strong. I added a few references to the shared folder.',createdAt:ago(3)}] : [],
    activity:[event('Created','Task added to the project')],
  }));
  tasks[2].activity.unshift({id:'a2',action:'Assigned',detail:'Maya Chen is on this task',createdAt:ago(4)});
  const templates: ProjectTemplate[] = [
    {id:'tpl-brand',name:'Brand identity sprint',description:'A compact identity project from discovery to handoff.',tasks:[
      {title:'Collect references',description:'Gather visual references and shared inspiration.',priority:'medium',dueDaysFromStart:1},
      {title:'Explore creative routes',description:'Develop a small set of clearly differentiated routes.',priority:'high',dueDaysFromStart:4},
      {title:'Review direction',description:'Share work in progress and agree on a path forward.',priority:'high',dueDaysFromStart:7},
      {title:'Prepare handoff',description:'Package final assets and concise usage notes.',priority:'medium',dueDaysFromStart:12},
    ]},
    {id:'tpl-launch',name:'Product launch',description:'A practical runway for a small, thoughtful launch.',tasks:[
      {title:'Define launch story',description:'Align on audience, message, and launch moment.',priority:'high',dueDaysFromStart:2},
      {title:'Prepare product page',description:'Build and review the product page content.',priority:'high',dueDaysFromStart:7},
      {title:'Final quality check',description:'Test the important paths before launch day.',priority:'medium',dueDaysFromStart:12},
    ]},
    {id:'tpl-editorial',name:'Editorial package',description:'Plan interviews, writing, and image research in one place.',tasks:[
      {title:'Book interview',description:'Confirm the subject and find a time to talk.',priority:'high',dueDaysFromStart:2},
      {title:'Draft the story',description:'Build a clear first draft from notes and interviews.',priority:'medium',dueDaysFromStart:8},
      {title:'Source imagery',description:'Find images with clear rights and strong story fit.',priority:'low',dueDaysFromStart:10},
    ]},
  ];
  return { projects, tasks, templates, reminders:[
    {id:'r-seed-1',kind:'overdue',projectId:'p-aurora',taskId:'t-1',message:'Set visual territory is overdue by 2 days',date:ago(8),read:false,dismissed:false},
    {id:'r-seed-2',kind:'assignment',projectId:'p-aurora',taskId:'t-3',message:'Maya Chen was assigned to Design mark explorations',date:ago(4),read:false,dismissed:false},
    {id:'r-seed-3',kind:'due_soon',projectId:'p-morrow',taskId:'t-5',message:'Product page wireframes is due today',date:ago(2),read:false,dismissed:false},
  ] };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data,setData]=useState<DataState>(()=>seed());
  const [ready,setReady]=useState(false);
  useEffect(()=>{ try { const saved=localStorage.getItem(KEY); if(saved) setData(JSON.parse(saved) as DataState); } catch { /* retain the sample workspace if local storage is unavailable */ } setReady(true); },[]);
  useEffect(()=>{ if(ready) { try { localStorage.setItem(KEY,JSON.stringify(data)); } catch { /* demo remains usable for this session */ } } },[data,ready]);
  const store=useMemo<Store>(()=>({
    ...data,ready,
    saveProject:(input,id)=>{const projectId=id||uid();setData(d=>{const exists=d.projects.some(p=>p.id===projectId);const value:Project={id:projectId,name:input.name,description:input.description,archived:input.archived??false,createdAt:input.createdAt||new Date().toISOString()};return {...d,projects:exists?d.projects.map(p=>p.id===projectId?value:p):[value,...d.projects]};});return projectId;},
    archiveProject:(id,archived)=>setData(d=>({...d,projects:d.projects.map(p=>p.id===id?{...p,archived}:p)})),
     saveTask:(input,id)=>{const taskId=id||uid();setData(d=>{const old=d.tasks.find(t=>t.id===taskId);const now=new Date().toISOString();const assignee=input.assignee??old?.assignee??'';const activity=[...(old?.activity||[]),event(old?'Updated':'Created',old?'Task details updated':'Task added to the project')];if(assignee&&assignee!==(old?.assignee||'')){activity.push(event('Assigned',`${assignee} is now responsible`));}
      const task:Task={id:taskId,projectId:input.projectId,title:input.title,description:input.description??old?.description??'',status:input.status??old?.status??'todo',priority:input.priority??old?.priority??'medium',assignee,dueDate:input.dueDate??old?.dueDate??'',createdAt:old?.createdAt||now,updatedAt:now,checklist:input.checklist??old?.checklist??[],comments:input.comments??old?.comments??[],activity};
       let reminders=d.reminders;if(assignee&&assignee!==(old?.assignee||'')){reminders=[{id:uid(),kind:'assignment',projectId:task.projectId,taskId,message:`${assignee} was assigned to ${task.title}`,date:now,read:false,dismissed:false},...reminders];}
      return {...d,tasks:old?d.tasks.map(t=>t.id===taskId?task:t):[task,...d.tasks],reminders};});return taskId;},
    removeTask:id=>setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==id),reminders:d.reminders.filter(r=>r.taskId!==id)})),
    moveTask:(id,status)=>setData(d=>({...d,tasks:d.tasks.map(t=>t.id===id&&t.status!==status?{...t,status,updatedAt:new Date().toISOString(),activity:[event('Moved',`Moved to ${status.replace('_',' ')}`),...t.activity]}:t)})),
    toggleCheck:(taskId,checkId)=>setData(d=>({...d,tasks:d.tasks.map(t=>t.id===taskId?{...t,updatedAt:new Date().toISOString(),checklist:t.checklist.map(c=>c.id===checkId?{...c,done:!c.done}:c),activity:[event('Checklist','Checklist item updated'),...t.activity]}:t)})),
    addComment:(taskId,body)=>setData(d=>({...d,tasks:d.tasks.map(t=>t.id===taskId?{...t,updatedAt:new Date().toISOString(),comments:[...t.comments,{id:uid(),author:'You',body,createdAt:new Date().toISOString()}],activity:[event('Commented',body),...t.activity]}:t)})),
    saveTemplate:template=>setData(d=>({...d,templates:[template,...d.templates.filter(t=>t.id!==template.id)]})),
    addReminder:(task,message)=>setData(d=>({...d,reminders:[{id:uid(),kind:'assignment',projectId:task.projectId,taskId:task.id,message,date:new Date().toISOString(),read:false,dismissed:false},...d.reminders]})),
    markReminder:(id,dismissed=false)=>setData(d=>{
      if(d.reminders.some(r=>r.id===id))return {...d,reminders:d.reminders.map(r=>r.id===id?{...r,read:true,dismissed}:r)};
      const kind=id.startsWith('auto-overdue-')?'overdue':'due_soon';const taskId=id.replace(/^auto-(overdue|due)-/,'');const task=d.tasks.find(t=>t.id===taskId);
      if(!task)return d;
       const days=daysUntil(task.dueDate);
      const message=kind==='overdue'?`${task.title} is overdue by ${Math.abs(days)} ${Math.abs(days)===1?'day':'days'}`:`${task.title} is due ${days===0?'today':days===1?'tomorrow':`in ${days} days`}`;
      return {...d,reminders:[{id,kind,projectId:task.projectId,taskId,message,date:task.dueDate,read:true,dismissed},...d.reminders]};
    }),
  }),[data,ready]);
  return <ctx.Provider value={store}>{children}</ctx.Provider>;
}
export function useStore(){const value=useContext(ctx);if(!value)throw new Error('DataProvider is missing');return value;}
export const newId=uid;
export const todayKey=()=>localDay(new Date());
export const dateAfter=(days:number)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return localDay(d);};
export const daysUntil=(date:string)=>{const [year,month,day]=date.split('-').map(Number);const now=new Date();return Math.round((Date.UTC(year,month-1,day)-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);};
export const dateLabel=(date:string)=>date?new Date(`${date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'No date';
export const isOverdue=(task:Task)=>task.status!=='done'&&!!task.dueDate&&task.dueDate<todayKey();
export const statusLabel=(status:Status)=>({todo:'To do',in_progress:'In progress',review:'In review',done:'Done'}[status]);
