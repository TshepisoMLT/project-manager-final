import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { Activity as ActivityIcon, Archive, ArrowDownUp, ArrowLeft, Bell, CalendarDays, Check, CheckSquare2, ChevronDown, CircleAlert, CircleHelp, ClipboardList, Clock3, FilePlus2, FolderKanban, LayoutDashboard, ListFilter, Menu, MessageCircle, MoreHorizontal, Plus, Search, Settings2, Sparkles, Trash2, Undo2, UserRound, X } from 'lucide-react';
import { DataProvider, dateAfter, dateLabel, daysUntil, isOverdue, newId, statusLabel, todayKey, useStore, type Activity, type Priority, type Project, type ProjectTemplate, type Reminder, type Status, type Task } from './store';
import './index.css';

const STATUSES: Status[]=['todo','in_progress','review','done'];
const PRIORITIES: Priority[]=['low','medium','high'];
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).map(s=>s[0]).join('').slice(0,2).toUpperCase()||'—';
const shortTime=(date:string)=>{const diff=Math.max(0,Date.now()-new Date(date).getTime());const m=Math.floor(diff/60000);if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`;};

function App(){
  return <DataProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Shell/></WouterRouter></DataProvider>;
}
function Shell(){
  const [location,setLocation]=useLocation(); const store=useStore();
  const [query,setQuery]=useState('');
  const [noticeOpen,setNoticeOpen]=useState(false);const [mobileNav,setMobileNav]=useState(false);
  const visibleReminders=useMemo(()=>{
    const generated:Reminder[]=store.tasks.filter(t=>t.status!=='done'&&t.dueDate).flatMap((t):Reminder[]=>{
       const days=daysUntil(t.dueDate);
      if(days<0&&!store.reminders.some(r=>r.taskId===t.id&&r.kind==='overdue'))return [{id:`auto-overdue-${t.id}`,kind:'overdue' as const,projectId:t.projectId,taskId:t.id,message:`${t.title} is overdue by ${Math.abs(days)} ${Math.abs(days)===1?'day':'days'}`,date:t.dueDate,read:false,dismissed:false}];
      if(days>=0&&days<=2&&!store.reminders.some(r=>r.taskId===t.id&&(r.kind==='due_soon'||r.kind==='overdue')))return [{id:`auto-due-${t.id}`,kind:'due_soon' as const,projectId:t.projectId,taskId:t.id,message:`${t.title} is due ${days===0?'today':days===1?'tomorrow':`in ${days} days`}`,date:t.dueDate,read:false,dismissed:false}];
      return [];
    });
    return [...store.reminders.filter(r=>!r.dismissed),...generated].sort((a,b)=>b.date.localeCompare(a.date));
  },[store.reminders,store.tasks]);
  const unread=visibleReminders.filter(r=>!r.read).length;
  function doSearch(e:FormEvent){e.preventDefault();setLocation(`/search?q=${encodeURIComponent(query)}`);setNoticeOpen(false);}
  const activeProjectCount=store.projects.filter(p=>!p.archived).length;
  return <div className="app-shell">
    <aside className="sidebar">
       <Link href="/dashboard" className="brand"><span className="brand-mark"><FolderKanban size={17}/></span><span>Project Manager<span style={{color:'#d98b68'}}>.</span></span></Link>
      <div className="workspace-label">Workspace / Studio North</div>
      <Link href="/dashboard" className={`nav-link ${location==='/dashboard'||location==='/'?'active':''}`}><LayoutDashboard size={16}/> Overview</Link>
      <Link href="/projects" className={`nav-link ${location.startsWith('/projects')?'active':''}`}><FolderKanban size={16}/> Projects <span className="nav-count">{activeProjectCount}</span></Link>
      <Link href="/search" className={`nav-link ${location.startsWith('/search')?'active':''}`}><Search size={16}/> Search</Link>
      <button className="nav-link" onClick={()=>setNoticeOpen(v=>!v)}><Bell size={16}/> Reminders {unread>0&&<span className="nav-count">{unread}</span>}</button>
      <div className="sidebar-spacer"/>
      <div className="local-note"><strong>Just your workspace</strong>Demo data stays in this browser. It does not sync to other people or devices.</div>
      <div className="profile-mini"><div className="avatar">SN</div><div><div style={{fontWeight:700,color:'#f3efe5'}}>Studio North</div><div style={{fontSize:10,color:'#95a19d'}}>Local workspace</div></div><Settings2 size={15} style={{marginLeft:'auto',color:'#8d9a96'}}/></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left"><span style={{color:'hsl(var(--foreground))',fontWeight:650}}>Studio North</span><span>/</span><span>{location.startsWith('/projects/')?'Project board':location==='/projects'?'Projects':location==='/search'?'Search':'Overview'}</span></div>
        <div className="topbar-right">
          <button className="icon-btn mobile-menu" aria-label="Open navigation" onClick={()=>setMobileNav(v=>!v)}><Menu size={16}/></button>
          <form className="global-search" onSubmit={doSearch}><Search size={15}/><input aria-label="Search all work" placeholder="Search all work…" value={query} onChange={e=>setQuery(e.target.value)} data-testid="input-global-search"/><span className="mono" style={{fontSize:9,whiteSpace:'nowrap'}}>↵</span></form>
          <button className="icon-btn" aria-label="Open reminder center" onClick={()=>setNoticeOpen(v=>!v)} data-testid="button-reminder-center"><Bell size={16}/>{unread>0&&<i className="notification-dot"/>}</button>
        </div>
        {mobileNav&&<div className="panel mobile-nav-pop">{[['/dashboard','Overview'],['/projects','Projects'],['/search','Search']].map(([href,label])=><Link key={href} href={href} className="nav-link" style={{color:'hsl(var(--foreground))'}} onClick={()=>setMobileNav(false)}>{label}</Link>)}</div>}
        {noticeOpen&&<ReminderCenter reminders={visibleReminders} onMark={store.markReminder} onNavigate={id=>{setLocation(`/projects/${id}`);setNoticeOpen(false);}} onClose={()=>setNoticeOpen(false)}/>}
      </header>
      <Switch>
        <Route path="/"><Dashboard/></Route>
        <Route path="/dashboard"><Dashboard/></Route>
        <Route path="/projects"><ProjectsPage/></Route>
        <Route path="/projects/:projectId"><ProjectPage/></Route>
        <Route path="/search"><SearchPage/></Route>
        <Route><NotFound/></Route>
      </Switch>
    </main>
  </div>;
}

function ReminderCenter({reminders,onMark,onNavigate,onClose}:{reminders:ReturnType<typeof useStore>['reminders'];onMark:(id:string,dismissed?:boolean)=>void;onNavigate:(id:string)=>void;onClose:()=>void}){
  const store=useStore();
  return <div className="panel reminder-pop"><div className="section-title" style={{marginBottom:8}}><div><div className="eyebrow" style={{marginBottom:4}}>Local reminders</div><h2>On your radar</h2></div><button className="btn btn-quiet" onClick={onClose}><X size={15}/></button></div>
    <p style={{fontSize:10,color:'hsl(var(--muted-foreground))',margin:'0 0 9px'}}>Due dates and assignment updates, stored in this browser only.</p>
    {reminders.length===0?<div className="empty-state" style={{padding:'22px 8px'}}><div className="empty-mark"><Check size={18}/></div><h3>All caught up</h3><p>No due-soon or overdue work right now.</p></div>:reminders.slice(0,8).map(r=>{
      const t=store.tasks.find(x=>x.id===r.taskId);const project=store.projects.find(x=>x.id===r.projectId);
      return <div className="reminder-item" key={r.id}><div className="activity-icon">{r.kind==='overdue'?<CircleAlert size={14}/>:r.kind==='assignment'?<UserRound size={14}/>:<Clock3 size={14}/>}</div><div style={{flex:1,cursor:'pointer'}} onClick={()=>{onMark(r.id);onNavigate(r.projectId);}}><div style={{fontWeight:650}}>{r.message} {!r.read&&<span style={{color:'hsl(var(--accent))'}}>•</span>}</div><div style={{color:'hsl(var(--muted-foreground))',fontSize:10,marginTop:3}}>{project?.name||'Project'} · {shortTime(r.date)}</div></div><button className="btn btn-quiet" aria-label="Dismiss reminder" onClick={()=>onMark(r.id,true)}><X size={13}/></button></div>;
    })}
    {reminders.length>0&&<button className="text-link" onClick={()=>reminders.forEach(r=>!r.id.startsWith('auto-')&&onMark(r.id,true))}>Dismiss saved reminders</button>}
  </div>;
}

function Dashboard(){
  const store=useStore();const [,setLocation]=useLocation();
  const active=store.projects.filter(p=>!p.archived);
  const activeTasks=store.tasks.filter(t=>active.some(p=>p.id===t.projectId));
  const overdue=activeTasks.filter(isOverdue);
   const upcoming=activeTasks.filter(t=>t.status!=='done'&&t.dueDate>=todayKey()).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5);
   const dueThisWeek=activeTasks.filter(t=>t.status!=='done'&&daysUntil(t.dueDate)>=0&&daysUntil(t.dueDate)<=7).length;
  const recent=store.tasks.flatMap(t=>t.activity.map(a=>({a,t}))).sort((a,b)=>b.a.createdAt.localeCompare(a.a.createdAt)).slice(0,5);
  const percent=(p:Project)=>{const ts=store.tasks.filter(t=>t.projectId===p.id);return ts.length?Math.round(ts.filter(t=>t.status==='done').length/ts.length*100):0;};
  return <div className="page-wrap">
     <div className="page-heading"><div><div className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · Your studio at a glance</div><h1>Good work, in view.</h1><p className="subhead">A clear read on what’s moving, what’s next, and what needs a nudge.</p></div><button className="btn btn-primary" onClick={()=>setLocation('/projects')}><Plus size={15}/> New project</button></div>
    {!store.ready?<div className="stat-grid">{[0,1,2,3].map(i=><div className="panel stat-card skeleton" key={i} style={{height:112}}/>)}</div>:<>
      <div className="stat-grid">
        <Stat label="Active projects" value={active.length} foot="Across your workspace" icon={<FolderKanban size={16}/>}/>
        <Stat label="Open tasks" value={activeTasks.filter(t=>t.status!=='done').length} foot={`${activeTasks.filter(t=>t.status==='in_progress').length} in progress`} icon={<CheckSquare2 size={16}/>}/>
        <Stat label="Overdue" value={overdue.length} foot={overdue.length?'Needs a little attention':'Nothing slipping'} icon={<CircleAlert size={16}/>} tone={overdue.length?'warm':''}/>
         <Stat label="Due this week" value={dueThisWeek} foot="Across active projects" icon={<CalendarDays size={16}/>}/>
      </div>
      <div className="dashboard-grid">
        <section className="panel section-panel"><div className="section-title"><h2>Active projects</h2><Link href="/projects" className="text-link">All projects <span aria-hidden="true">→</span></Link></div>
          {active.length===0?<Empty title="A fresh page" copy="Create a project to give your next piece of work a home." action={<Link href="/projects" className="btn btn-primary"><Plus size={14}/> Start a project</Link>}/>:active.slice(0,5).map(p=>{
            const tasks=store.tasks.filter(t=>t.projectId===p.id);const next=tasks.filter(t=>t.status!=='done'&&t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate))[0];
            return <div className="project-row" key={p.id}><div><Link href={`/projects/${p.id}`} className="project-name">{p.name}</Link><div className="project-desc">{p.description}</div></div><div className="progress-cell"><div className="progress-label"><span>{tasks.filter(t=>t.status==='done').length} of {tasks.length} done</span><span>{percent(p)}%</span></div><div className="progress-line"><div className="progress-fill" style={{width:`${percent(p)}%`}}/></div></div><span className="row-date due-date">{next?dateLabel(next.dueDate):'No dates'}</span><span className="pill">{tasks.filter(t=>t.status!=='done').length} open</span></div>;
          })}
        </section>
        <section className="panel section-panel"><div className="section-title"><h2>Coming up</h2><CalendarDays size={16} color="hsl(var(--muted-foreground))"/></div>
          {upcoming.length===0?<div className="empty-state" style={{padding:'25px 8px'}}><div className="empty-mark"><Check size={18}/></div><h3>Room to breathe</h3><p>No upcoming due dates in active work.</p></div>:upcoming.map(t=><TaskLine key={t.id} task={t}/>)}
        </section>
        <section className="panel section-panel"><div className="section-title"><h2>Overdue work</h2><span className={`pill ${overdue.length?'priority-high':''}`}>{overdue.length} {overdue.length===1?'task':'tasks'}</span></div>
          {overdue.length===0?<div className="empty-state" style={{padding:'25px 8px'}}><div className="empty-mark"><Check size={18}/></div><h3>Nothing overdue</h3><p>You’re keeping the important things moving.</p></div>:overdue.slice(0,4).map(t=><TaskLine key={t.id} task={t} overdue/>)}
        </section>
        <section className="panel section-panel"><div className="section-title"><h2>Recent activity</h2><ActivityIcon size={16} color="hsl(var(--muted-foreground))"/></div>
          {recent.map(({a,t})=><ActivityLine key={a.id} activity={a} task={t}/>)}
        </section>
      </div>
    </>}
  </div>;
}
function Stat({label,value,foot,icon,tone}:{label:string;value:number|string;foot:string;icon:ReactNode;tone?:string}){return <div className="panel stat-card"><div className="stat-label">{label}<span style={{color:tone?'hsl(var(--destructive))':'hsl(var(--primary))'}}>{icon}</span></div><div className="stat-value" style={{color:tone?'hsl(var(--destructive))':undefined}}>{value}</div><div className="stat-foot">{foot}</div></div>;}
function TaskLine({task,overdue}:{task:Task;overdue?:boolean}){const store=useStore();const p=store.projects.find(x=>x.id===task.projectId);return <Link href={`/projects/${task.projectId}`} className="task-line" style={{textDecoration:'none',color:'inherit'}}><span className="task-dot" style={{background:overdue?'hsl(var(--destructive))':undefined}}/><div style={{flex:1,minWidth:0}}><div className="task-line-title">{task.title}</div><div className="task-meta"><span>{p?.name}</span><span>·</span><span style={{color:overdue?'hsl(var(--destructive))':undefined}}>{overdue?'Overdue':dateLabel(task.dueDate)}</span></div></div><span className={`pill priority-${task.priority}`}>{task.priority}</span></Link>;}
function ActivityLine({activity,task}:{activity:Activity;task:Task}){const p=useStore().projects.find(x=>x.id===task.projectId);return <div className="activity-item"><div className="activity-icon"><ActivityIcon size={13}/></div><div><strong>{activity.action}</strong> · {activity.detail}<div className="activity-time">{task.title} · {p?.name} · {shortTime(activity.createdAt)}</div></div></div>;}
function Empty({title,copy,action}:{title:string;copy:string;action?:ReactNode}){return <div className="empty-state"><div className="empty-mark"><Sparkles size={19}/></div><h3>{title}</h3><p>{copy}</p>{action}</div>;}

function ProjectsPage(){
  const store=useStore();const [,setLocation]=useLocation();const [query,setQuery]=useState('');const [view,setView]=useState<'active'|'archived'>('active');
  const [projectModal,setProjectModal]=useState<{project?:Project;template?:ProjectTemplate}|null>(null);
  const [templateMenu,setTemplateMenu]=useState(false);const [toast,setToast]=useState('');
  const projects=store.projects.filter(p=>p.archived===(view==='archived')&&(p.name+' '+p.description).toLowerCase().includes(query.toLowerCase()));
  function saveAsTemplate(project:Project){const tasks=store.tasks.filter(t=>t.projectId===project.id).map((t,i)=>({title:t.title,description:t.description,priority:t.priority,dueDaysFromStart:Math.max(1,Math.round((new Date(t.dueDate+'T12:00:00').getTime()-new Date(project.createdAt).getTime())/86400000))||i+1}));store.saveTemplate({id:newId(),name:`${project.name} template`,description:project.description,tasks});setToast('Template saved to your browser');setTimeout(()=>setToast(''),2600);}
  function createFromTemplate(t:ProjectTemplate){setProjectModal({template:t});setTemplateMenu(false);}
  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">The work, organized</div><h1>Projects</h1><p className="subhead">Small teams, clear ownership, no extra machinery.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><div style={{position:'relative'}}><button className="btn" onClick={()=>setTemplateMenu(v=>!v)}><FilePlus2 size={15}/> Start from template <ChevronDown size={13}/></button>{templateMenu&&<div className="panel" style={{position:'absolute',right:0,top:44,zIndex:5,width:270,padding:8,boxShadow:'0 12px 30px #17252220'}}>{store.templates.map(t=><button key={t.id} onClick={()=>createFromTemplate(t)} style={{display:'block',width:'100%',border:0,textAlign:'left',background:'transparent',padding:'10px',borderRadius:7}}><b style={{fontSize:12}}>{t.name}</b><div style={{fontSize:10,color:'hsl(var(--muted-foreground))',marginTop:3}}>{t.tasks.length} starter tasks · {t.description}</div></button>)}</div>}</div><button className="btn btn-primary" onClick={()=>setProjectModal({})}><Plus size={15}/> New project</button></div></div>
    <div className="toolbar"><label className="search-field"><Search size={14}/><input placeholder="Find a project…" value={query} onChange={e=>setQuery(e.target.value)} data-testid="input-project-search"/></label><button className={`btn ${view==='active'?'':'btn-quiet'}`} onClick={()=>setView('active')}>Active <span className="mono">{store.projects.filter(p=>!p.archived).length}</span></button><button className={`btn ${view==='archived'?'':'btn-quiet'}`} onClick={()=>setView('archived')}><Archive size={13}/> Archived</button><span style={{marginLeft:'auto',fontSize:10,color:'hsl(var(--muted-foreground))'}}>{projects.length} {projects.length===1?'project':'projects'}</span></div>
    {!store.ready?<div className="projects-grid">{[0,1,2,3].map(i=><div key={i} className="panel skeleton" style={{height:180}}/>)}</div>:projects.length===0?<div className="panel"><Empty title={query?'No matches':'Nothing here yet'} copy={query?'Try another project name or description.':'Start with a blank project or borrow a useful template.'} action={!query&&view==='active'?<button className="btn btn-primary" onClick={()=>setProjectModal({})}><Plus size={14}/> Create project</button>:undefined}/></div>:<div className="projects-grid">{projects.map(p=>{
      const tasks=store.tasks.filter(t=>t.projectId===p.id);const done=tasks.filter(t=>t.status==='done').length;const overdue=tasks.filter(isOverdue).length;
      return <article className="panel project-card" key={p.id}><div className="project-card-head"><div><h3>{p.name}</h3></div><div className="card-actions"><button className="btn btn-quiet" title="Edit project" onClick={()=>setProjectModal({project:p})}><Settings2 size={15}/></button><button className="btn btn-quiet" title={p.archived?'Restore project':'Archive project'} onClick={()=>store.archiveProject(p.id,!p.archived)}>{p.archived?<Undo2 size={15}/>:<Archive size={15}/>}</button></div></div><p>{p.description||'A project without a description yet.'}</p>
        <div className="progress-label"><span>{done} of {tasks.length} tasks complete</span><span>{tasks.length?Math.round(done/tasks.length*100):0}%</span></div><div className="progress-line"><div className="progress-fill" style={{width:`${tasks.length?done/tasks.length*100:0}%`}}/></div>
        <div className="card-footer"><span>{tasks.filter(t=>t.status!=='done').length} open{overdue>0&&<span style={{color:'hsl(var(--destructive))'}}> · {overdue} overdue</span>}</span><div style={{display:'flex',gap:4}}><button className="text-link" onClick={()=>saveAsTemplate(p)}>Save as template</button><button className="btn btn-quiet" onClick={()=>setLocation(`/projects/${p.id}`)} aria-label={`Open ${p.name}`}><ArrowLeft size={14} style={{transform:'rotate(180deg)'}}/></button></div></div>
      </article>;
    })}</div>}
    {projectModal&&<ProjectModal initial={projectModal.project} template={projectModal.template} onClose={()=>setProjectModal(null)} onSave={(projectId)=>{setProjectModal(null);if(projectId)setLocation(`/projects/${projectId}`);}}/>}
    {toast&&<div className="toast-message">{toast}</div>}
  </div>;
}

function ProjectModal({initial,template,onClose,onSave}:{initial?:Project;template?:ProjectTemplate;onClose:()=>void;onSave:(id?:string)=>void}){
  const store=useStore();const [name,setName]=useState(initial?.name||'');const [description,setDescription]=useState(initial?.description||template?.description||'');const [error,setError]=useState('');
   function submit(e:FormEvent){e.preventDefault();if(!name.trim()){setError('Give this project a name to get started.');return;}const id=store.saveProject({name:name.trim(),description:description.trim()},initial?.id);if(template){template.tasks.forEach((t,i)=>store.saveTask({projectId:id,title:t.title,description:t.description,status:'todo',priority:t.priority,assignee:'',dueDate:dateAfter(t.dueDaysFromStart||i+1)}));}onSave(id);}
  return <Modal title={initial?'Edit project':template?`Use ${template.name}`:'New project'} subtitle={template?'A project and its starter tasks will be added to this workspace.':'Give the work a useful name and a little context.'} onClose={onClose}><form onSubmit={submit}><div className="form-grid"><Field label="Project name" full><input autoFocus className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Spring campaign" data-testid="input-project-name"/></Field><Field label="What is this project about?" full><textarea className="textarea-field" value={description} onChange={e=>setDescription(e.target.value)} placeholder="A sentence to help everyone get oriented." data-testid="input-project-description"/></Field></div>{error&&<p style={{color:'hsl(var(--destructive))',fontSize:11,marginTop:10}}>{error}</p>}<div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">{initial?'Save changes':template?'Create from template':'Create project'}</button></div></form></Modal>;
}

function ProjectPage(){
  const [,params]=useRoute('/projects/:projectId');const id=params?.projectId||'';const store=useStore();const project=store.projects.find(p=>p.id===id);
  const [priority,setPriority]=useState('all');const [assignee,setAssignee]=useState('all');const [sort,setSort]=useState('due');const [modal,setModal]=useState<{task?:Task;detail?:Task}|null>(null);const [toast,setToast]=useState('');
  const members=Array.from(new Set(store.tasks.filter(t=>t.projectId===id&&t.assignee).map(t=>t.assignee)));
  const tasks=store.tasks.filter(t=>t.projectId===id&& (priority==='all'||t.priority===priority)&&(assignee==='all'||t.assignee===assignee)).sort((a,b)=>sort==='priority'?PRIORITIES.indexOf(b.priority)-PRIORITIES.indexOf(a.priority):sort==='created'?b.createdAt.localeCompare(a.createdAt):a.dueDate.localeCompare(b.dueDate));
  if(!project)return <div className="page-wrap"><Link href="/projects" className="back-link"><ArrowLeft size={13}/> All projects</Link><div className="panel"><Empty title="Project not found" copy="It may have been removed, or the link may be out of date." action={<Link href="/projects" className="btn">Back to projects</Link>}/></div></div>;
  const completed=store.tasks.filter(t=>t.projectId===id&&t.status==='done').length;const total=store.tasks.filter(t=>t.projectId===id).length;
  const activity=store.tasks.filter(t=>t.projectId===id).flatMap(t=>t.activity.map(a=>({a,t}))).sort((a,b)=>b.a.createdAt.localeCompare(a.a.createdAt)).slice(0,4);
  function drop(e:React.DragEvent,status:Status){e.preventDefault();const taskId=e.dataTransfer.getData('text/task');if(taskId){store.moveTask(taskId,status);setToast(`Moved to ${statusLabel(status)}`);setTimeout(()=>setToast(''),1800);}}
  return <div className="page-wrap">
    <Link href="/projects" className="back-link"><ArrowLeft size={13}/> All projects</Link>
    <div className="page-heading"><div><div className="eyebrow">Project board · {completed}/{total} complete</div><h1>{project.name}</h1><p className="subhead">{project.description}</p></div><button className="btn btn-primary" onClick={()=>setModal({})}><Plus size={15}/> Add task</button></div>
    <div className="board-toolbar"><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><label style={{display:'flex',alignItems:'center',gap:7}}><ListFilter size={14} color="hsl(var(--muted-foreground))"/><select className="select-field" aria-label="Filter priority" value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All priorities</option>{PRIORITIES.map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)} priority</option>)}</select></label><select className="select-field" aria-label="Filter assignee" value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="all">All assignees</option>{members.map(m=><option key={m}>{m}</option>)}</select><label style={{display:'flex',alignItems:'center',gap:7,color:'hsl(var(--muted-foreground))',fontSize:11}}><ArrowDownUp size={13}/><select className="select-field" aria-label="Sort tasks" value={sort} onChange={e=>setSort(e.target.value)}><option value="due">Due date</option><option value="priority">Priority</option><option value="created">Recently added</option></select></label></div><span style={{fontSize:10,color:'hsl(var(--muted-foreground))'}}>Drag cards between columns, or use Move to on each card.</span></div>
    <div className="board">{STATUSES.map(status=>{const list=tasks.filter(t=>t.status===status);return <section className="board-column" key={status} onDragOver={e=>e.preventDefault()} onDragEnter={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over');}} onDragLeave={e=>e.currentTarget.classList.remove('drag-over')} onDrop={e=>{e.currentTarget.classList.remove('drag-over');drop(e,status);}} data-testid={`column-${status}`}><div className="column-head"><span>{statusLabel(status)}</span><span className="column-count">{list.length}</span></div>{list.map(t=><TaskCard key={t.id} task={t} onDetail={()=>setModal({detail:t})} onEdit={()=>setModal({task:t})} onDelete={()=>{if(window.confirm(`Delete “${t.title}”? This cannot be undone.`))store.removeTask(t.id);}}/>)}{list.length===0&&<div style={{textAlign:'center',fontSize:10,color:'hsl(var(--muted-foreground))',padding:'23px 8px'}}>Drop a task here</div>}<button className="btn btn-quiet" style={{width:'100%',justifyContent:'flex-start',marginTop:2}} onClick={()=>setModal({task:{projectId:id} as Task})}><Plus size={13}/> Add a task</button></section>;})}</div>
    <section className="panel section-panel" style={{marginTop:10}}><div className="section-title"><h2>Latest in this project</h2><ActivityIcon size={15}/></div>{activity.map(({a,t})=><ActivityLine key={a.id} activity={a} task={t}/>)}</section>
    {modal?.task&&<TaskModal projectId={id} initial={modal.task.id?modal.task:undefined} onClose={()=>setModal(null)}/>}
    {modal?.detail&&<TaskDetail task={store.tasks.find(t=>t.id===modal.detail?.id)||modal.detail} onEdit={()=>setModal({task:store.tasks.find(t=>t.id===modal.detail?.id)})} onClose={()=>setModal(null)}/>}
    {toast&&<div className="toast-message">{toast}</div>}
  </div>;
}
function TaskCard({task,onDetail,onEdit,onDelete}:{task:Task;onDetail:()=>void;onEdit:()=>void;onDelete:()=>void}){
  const store=useStore();const overdue=isOverdue(task);
  return <article className={`panel task-card ${overdue?'overdue':''}`} draggable onDragStart={e=>{e.dataTransfer.setData('text/task',task.id);e.dataTransfer.effectAllowed='move';}} onClick={onDetail} data-testid={`card-task-${task.id}`}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span className={`pill priority-${task.priority}`}>{task.priority}</span><button className="btn btn-quiet" aria-label={`Edit ${task.title}`} onClick={e=>{e.stopPropagation();onEdit();}}><MoreHorizontal size={15}/></button></div>
    <div className="task-card-title">{task.title}</div>{task.description&&<p className="task-card-desc">{task.description}</p>}
    {(task.checklist.length>0||task.comments.length>0)&&<div style={{display:'flex',gap:9,color:'hsl(var(--muted-foreground))',fontSize:10}}>{task.checklist.length>0&&<span><CheckSquare2 size={11} style={{verticalAlign:'-2px'}}/> {task.checklist.filter(c=>c.done).length}/{task.checklist.length}</span>}{task.comments.length>0&&<span><MessageCircle size={11} style={{verticalAlign:'-2px'}}/> {task.comments.length}</span>}</div>}
    <div className="task-card-footer"><span className="task-assignee"><span className="avatar" style={{width:20,height:20,fontSize:8}}>{initials(task.assignee)}</span>{task.assignee||'Unassigned'}</span><span className="task-date" style={{color:overdue?'hsl(var(--destructive))':undefined}}>{overdue?'Overdue · ':''}{dateLabel(task.dueDate)}</span></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}><select aria-label={`Move ${task.title} to status`} className="move-select" value={task.status} onClick={e=>e.stopPropagation()} onChange={e=>store.moveTask(task.id,e.target.value as Status)}>{STATUSES.map(s=><option value={s} key={s}>Move to {statusLabel(s)}</option>)}</select><button className="btn btn-quiet btn-danger" aria-label={`Delete ${task.title}`} onClick={e=>{e.stopPropagation();onDelete();}}><Trash2 size={13}/></button></div>
  </article>;
}

function TaskModal({projectId,initial,onClose}:{projectId:string;initial?:Task;onClose:()=>void}){
  const store=useStore();const [title,setTitle]=useState(initial?.title||'');const [description,setDescription]=useState(initial?.description||'');const [status,setStatus]=useState<Status>(initial?.status||'todo');const [priority,setPriority]=useState<Priority>(initial?.priority||'medium');const [assignee,setAssignee]=useState(initial?.assignee||'');const [dueDate,setDueDate]=useState(initial?.dueDate||'');const [checks,setChecks]=useState((initial?.checklist||[]).map(c=>c.title).join('\n'));const [error,setError]=useState('');
  function submit(e:FormEvent){e.preventDefault();if(!title.trim()){setError('A task needs a name.');return;}store.saveTask({projectId,title:title.trim(),description,status,priority,assignee:assignee.trim(),dueDate,checklist:checks.split('\n').map(s=>s.trim()).filter(Boolean).map((s,i)=>({id:initial?.checklist[i]?.id||newId(),title:s,done:initial?.checklist[i]?.done||false})),comments:initial?.comments},initial?.id);onClose();}
  return <Modal title={initial?'Edit task':'New task'} subtitle="Keep the handoff useful: who, what, and when." onClose={onClose}><form onSubmit={submit}><div className="form-grid">
    <Field label="Task name" full><input autoFocus className="input-field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs doing?" data-testid="input-task-title"/></Field>
    <Field label="Description" full><textarea className="textarea-field" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Add context, expectations, or a useful link." data-testid="input-task-description"/></Field>
    <Field label="Status"><select className="input-field" value={status} onChange={e=>setStatus(e.target.value as Status)}>{STATUSES.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></Field>
    <Field label="Priority"><select className="input-field" value={priority} onChange={e=>setPriority(e.target.value as Priority)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></Field>
    <Field label="Assignee"><input className="input-field" value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="Name or leave unassigned"/></Field>
    <Field label="Due date"><input type="date" className="input-field" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></Field>
    <Field label="Checklist · one item per line" full><textarea className="textarea-field" style={{minHeight:65}} value={checks} onChange={e=>setChecks(e.target.value)} placeholder={'Gather references\nShare a first pass'}/></Field>
  </div>{error&&<p style={{color:'hsl(var(--destructive))',fontSize:11,marginTop:10}}>{error}</p>}<div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">{initial?'Save task':'Create task'}</button></div></form></Modal>;
}

function TaskDetail({task,onEdit,onClose}:{task:Task;onEdit:()=>void;onClose:()=>void}){
  const store=useStore();const [comment,setComment]=useState('');const [confirmDelete,setConfirmDelete]=useState(false);
  const project=store.projects.find(p=>p.id===task.projectId);
  const timeline=task.activity.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  function add(e:FormEvent){e.preventDefault();if(comment.trim()){store.addComment(task.id,comment.trim());setComment('');}}
  return <Modal title={task.title} subtitle={<span>{project?.name} · <span className={`pill priority-${task.priority}`}>{task.priority}</span> · {statusLabel(task.status)}</span>} onClose={onClose} wide><div className="detail-columns"><div>
    <div className="detail-section"><h3>Task context</h3><p style={{fontSize:12,lineHeight:1.6,color:'hsl(var(--muted-foreground))'}}>{task.description||'No description yet. Add context so the next person can pick this up.'}</p><div style={{display:'flex',gap:18,fontSize:10,color:'hsl(var(--muted-foreground))'}}><span><UserRound size={12} style={{verticalAlign:'-2px'}}/> {task.assignee||'Unassigned'}</span><span><CalendarDays size={12} style={{verticalAlign:'-2px'}}/> {dateLabel(task.dueDate)}</span></div><button className="btn" style={{marginTop:12}} onClick={onEdit}><Settings2 size={13}/> Edit task</button></div>
    <div className="detail-section"><h3>Checklist <span style={{fontWeight:400,color:'hsl(var(--muted-foreground))'}}>{task.checklist.filter(c=>c.done).length}/{task.checklist.length}</span></h3>{task.checklist.length===0?<p style={{fontSize:11,color:'hsl(var(--muted-foreground))'}}>No checklist items. Add them when editing this task.</p>:task.checklist.map(c=><label key={c.id} className="check-row"><input type="checkbox" checked={c.done} onChange={()=>store.toggleCheck(task.id,c.id)}/><span style={{textDecoration:c.done?'line-through':'none',color:c.done?'hsl(var(--muted-foreground))':undefined}}>{c.title}</span></label>)}</div>
    <div className="detail-section"><h3>Comments <span style={{fontWeight:400,color:'hsl(var(--muted-foreground))'}}>{task.comments.length}</span></h3>{task.comments.map(c=><div className="comment" key={c.id}><div className="comment-meta"><strong>{c.author}</strong> · {shortTime(c.createdAt)}</div>{c.body}</div>)}<form onSubmit={add} style={{display:'flex',gap:7,marginTop:10}}><input className="input-field" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a useful note…" aria-label="Write a comment"/><button className="btn btn-primary" type="submit" aria-label="Post comment"><MessageCircle size={14}/></button></form></div>
    </div><div><div className="detail-section"><h3>Activity</h3>{timeline.map(a=><div className="timeline-item" key={a.id}><strong>{a.action}</strong> · {a.detail}<div className="timeline-time">{shortTime(a.createdAt)}</div></div>)}</div><div className="detail-section"><h3>Task controls</h3><label style={{fontSize:10,color:'hsl(var(--muted-foreground))'}}>Move to</label><select className="input-field" style={{marginTop:6}} value={task.status} onChange={e=>store.moveTask(task.id,e.target.value as Status)}>{STATUSES.map(s=><option value={s} key={s}>{statusLabel(s)}</option>)}</select><button className="btn btn-danger" style={{marginTop:14}} onClick={()=>setConfirmDelete(true)}><Trash2 size={13}/> Delete task</button>{confirmDelete&&<div style={{marginTop:8,fontSize:10}}>Delete this task? <button className="text-link" onClick={()=>{store.removeTask(task.id);onClose();}}>Yes, delete</button> <button className="text-link" onClick={()=>setConfirmDelete(false)}>Keep it</button></div>}</div></div></div></Modal>;
}

function SearchPage(){const [location]=useLocation();const params=new URLSearchParams(location.split('?')[1]||'');const [query,setQuery]=useState(params.get('q')||'');const store=useStore();const q=query.toLowerCase().trim();
  const results=useMemo(()=>{if(!q)return [];const projects=store.projects.filter(p=>(p.name+' '+p.description).toLowerCase().includes(q)).map(p=>({type:'Project',title:p.name,subtitle:p.description,href:`/projects/${p.id}`}));const tasks=store.tasks.filter(t=>(t.title+' '+t.description+' '+t.assignee+' '+t.comments.map(c=>c.body).join(' ')).toLowerCase().includes(q)).map(t=>({type:'Task',title:t.title,subtitle:`${store.projects.find(p=>p.id===t.projectId)?.name||'Project'} · ${statusLabel(t.status)} · ${t.assignee||'Unassigned'}`,href:`/projects/${t.projectId}`}));return [...projects,...tasks];},[q,store.projects,store.tasks]);
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">Across your workspace</div><h1>Search</h1><p className="subhead">Find a project, task, description, or assignee.</p></div></div><label className="search-field" style={{width:'min(560px,100%)',height:46,marginBottom:22}}><Search size={16}/><input autoFocus placeholder="Try “Maya” or “handoff”…" value={query} onChange={e=>setQuery(e.target.value)} data-testid="input-search-everything"/></label>
    {!q?<div className="panel"><Empty title="Find the thread" copy="Search checks project names, task context, comments, and assignees." action={<span className="pill">Local workspace only</span>}/></div>:results.length===0?<div className="panel"><Empty title="No results found" copy={`Nothing matched “${query}”. Try a shorter phrase or another name.`}/></div>:<><div className="eyebrow" style={{marginBottom:10}}>{results.length} matches</div><div className="search-results">{results.map((r,i)=><Link href={r.href} className="panel result-row" key={`${r.type}-${i}`}><div className="activity-icon">{r.type==='Project'?<FolderKanban size={15}/>:<CheckSquare2 size={15}/>}</div><div style={{flex:1}}><div className="result-type">{r.type}</div><div className="result-title">{r.title}</div><div className="result-sub">{r.subtitle}</div></div><ArrowLeft size={14} style={{transform:'rotate(180deg)',color:'hsl(var(--muted-foreground))'}}/></Link>)}</div></>}
  </div>;
}

function Field({label,children,full}:{label:string;children:ReactNode;full?:boolean}){return <div className={`form-field ${full?'full':''}`}><label>{label}</label>{children}</div>;}
function Modal({title,subtitle,children,onClose,wide}:{title:string;subtitle?:ReactNode;children:ReactNode;onClose:()=>void;wide?:boolean}){
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<div style={{fontSize:11,color:'hsl(var(--muted-foreground))',lineHeight:1.5}}>{subtitle}</div>}</div><button className="icon-btn" onClick={onClose} aria-label="Close dialog"><X size={15}/></button></div>{children}</div></div>;
}
function NotFound(){return <div className="page-wrap"><div className="panel"><Empty title="That page wandered off" copy="The page you’re looking for isn’t in this workspace." action={<Link href="/dashboard" className="btn btn-primary">Back to overview</Link>}/></div></div>;}

export default App;
