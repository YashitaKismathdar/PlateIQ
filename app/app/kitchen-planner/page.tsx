'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, Plus, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react'

type Category = 'Prep & Butchery' | 'HACCP & Line Safety' | 'Equipment & Sanitation' | 'Manager Hand-off'
type Status = 'Pending' | 'In Progress' | 'Completed'
type Task = { id: number; title: string; priority: 'Urgent' | 'High' | 'Normal'; station: string; detail: string; due: string; owner: string; category: Category; progress: number; status: Status }

const categoryOptions: Array<'All Tasks' | Category> = ['All Tasks', 'Prep & Butchery', 'HACCP & Line Safety', 'Equipment & Sanitation', 'Manager Hand-off']
const initialTasks: Task[] = [
  { id: 1, title: 'Complete priority ingredient prep', priority: 'Urgent', station: 'Hot kitchen', detail: 'Finish priority prep and confirm quantities against the service forecast.', due: 'Due in 20 min', owner: 'Kitchen lead', category: 'Prep & Butchery', progress: 64, status: 'In Progress' },
  { id: 2, title: 'Verify chilled ingredient labels', priority: 'High', station: 'Cold prep', detail: 'Check date labels, storage temperatures and shelf-life records before release.', due: 'Due in 35 min', owner: 'Prep team', category: 'HACCP & Line Safety', progress: 0, status: 'Pending' },
  { id: 3, title: 'Record opening temperature checks', priority: 'High', station: 'Walk-in chiller', detail: 'Log opening temperatures and flag any reading outside the approved safe range.', due: 'Due in 15 min', owner: 'Shift supervisor', category: 'HACCP & Line Safety', progress: 50, status: 'In Progress' },
  { id: 4, title: 'Sanitise and reset prep stations', priority: 'Normal', station: 'All stations', detail: 'Complete the cleaning checklist and confirm each station is ready for service.', due: 'Due in 50 min', owner: 'Station team', category: 'Equipment & Sanitation', progress: 0, status: 'Pending' },
  { id: 5, title: 'Confirm hand-off notes for next shift', priority: 'Normal', station: 'Pass', detail: 'Share low-stock items, outstanding prep and service issues with the next lead.', due: 'Before shift end', owner: 'Shift supervisor', category: 'Manager Hand-off', progress: 100, status: 'Completed' },
  { id: 6, title: 'Review low-stock substitutions', priority: 'High', station: 'Store room', detail: 'Confirm approved alternatives for ingredients that may not cover projected demand.', due: 'Due in 40 min', owner: 'Inventory lead', category: 'Prep & Butchery', progress: 0, status: 'Pending' },
]

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof ClipboardCheck }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><Icon size={17} /></div><div className="metric-value">{value}</div><div className="metric-bottom"><span>{detail}</span></div></div>
}

export default function KitchenPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [tasksLoaded, setTasksLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('plateiq-kitchen-tasks-v1')
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.every((item) =>
          item && typeof item === 'object'
          && typeof item.id === 'number'
          && typeof item.title === 'string'
          && ['Pending', 'In Progress', 'Completed'].includes(item.status)
        )) {
          setTasks(parsed as Task[])
        }
      }
    } catch {
      // Keep the built-in sample checklist if browser storage is unavailable.
    } finally {
      setTasksLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!tasksLoaded) return
    try {
      window.localStorage.setItem('plateiq-kitchen-tasks-v1', JSON.stringify(tasks))
    } catch {
      // The checklist remains usable for the current session if storage is blocked.
    }
  }, [tasks, tasksLoaded])
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>('All Tasks')
  const [status, setStatus] = useState<'All' | Status>('All')
  const [search, setSearch] = useState('')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('Prep & Butchery')

  const completed = tasks.filter(task => task.status === 'Completed').length
  const inProgress = tasks.filter(task => task.status === 'In Progress').length
  const urgent = tasks.filter(task => task.priority === 'Urgent' && task.status !== 'Completed').length
  const filtered = useMemo(() => tasks.filter(task => {
    const query = search.trim().toLowerCase()
    return (category === 'All Tasks' || task.category === category)
      && (status === 'All' || task.status === status)
      && (!query || [task.title, task.station, task.owner, task.detail].some(value => value.toLowerCase().includes(query)))
  }), [tasks, category, status, search])

  function advanceTask(task: Task) {
    if (task.status === 'Completed') return
    const next: Status = task.status === 'Pending' ? 'In Progress' : 'Completed'
    setTasks(current => current.map(item => item.id === task.id
      ? { ...item, status: next, progress: next === 'Completed' ? 100 : Math.max(item.progress, 50) }
      : item))
  }

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setTasks(current => [...current, { id: Math.max(0, ...current.map(task => task.id)) + 1, title, priority: 'Normal', station: 'Unassigned', detail: 'New task added to the shift checklist.', due: 'Not set', owner: 'Unassigned', category: newCategory, progress: 0, status: 'Pending' }])
    setNewTitle('')
    setNewTaskOpen(false)
    setCategory('All Tasks')
    setStatus('All')
    setSearch('')
  }

  return <AppShell>
    <div className="page-body stitch-workspace-page stitch-page-tasks">
      <div className="stitch-page-intro"><div><div className="stitch-page-kicker"><span className="stitch-live-dot" /> PLATEIQ INTELLIGENCE <span className="separator">/</span> LIVE WORKSPACE</div><h1>Tasks &amp; Checklists</h1><p>Coordinate kitchen prep, food safety checks and shift hand-offs in one workspace.</p></div><div className="stitch-page-status tasks-demo-status"><span className="stitch-live-dot" /> DEMO CHECKLIST · SAVED IN THIS BROWSER</div></div>

      <section className="panel tasks-hero"><div><div className="section-kicker"><ClipboardCheck size={15} /> SHIFT EXECUTION</div><h2>Make every service task visible and accountable.</h2><p className="muted-copy">Track priority, ownership and progress. Changes are saved in this browser; this is not connected to a live kitchen task system.</p></div><button className="tasks-primary-button" onClick={() => setNewTaskOpen(value => !value)}>{newTaskOpen ? <X size={16} /> : <Plus size={16} />}{newTaskOpen ? 'Cancel' : 'New task'}</button></section>

      {newTaskOpen && <form className="panel tasks-new-form" onSubmit={addTask}><label className="tasks-field"><span>Task name</span><input autoFocus required value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="e.g. Check incoming produce" /></label><label className="tasks-field"><span>Category</span><select value={newCategory} onChange={event => setNewCategory(event.target.value as Category)}>{categoryOptions.filter((item): item is Category => item !== 'All Tasks').map(item => <option key={item}>{item}</option>)}</select></label><button className="tasks-primary-button" type="submit"><Plus size={16} /> Add task</button></form>}

      <section className="metrics-grid tasks-metrics">
        <Metric label="Completion rate" value={`${tasks.length ? Math.round(completed / tasks.length * 100) : 0}%`} detail={`${completed} of ${tasks.length} tasks completed`} icon={CheckCircle2} />
        <Metric label="In progress" value={String(inProgress)} detail="Work currently underway" icon={Clock3} />
        <Metric label="Needs attention" value={String(urgent)} detail="Urgent tasks not completed" icon={AlertTriangle} />
        <Metric label="Team checklist" value={String(tasks.length)} detail="Tasks across all categories" icon={Users} />
      </section>

      <section className="panel tasks-list-panel">
        <div className="tasks-panel-heading"><div><div className="section-kicker">SHIFT CHECKLIST</div><h2>Task queue</h2><p className="muted-copy">Start pending work, then mark it complete. Your checklist stays saved in this browser.</p></div><div className="tasks-filter-controls"><label className="tasks-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></label><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="All">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></div></div>
        <div className="tasks-category-tabs" role="tablist" aria-label="Task categories">{categoryOptions.map(item => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}<span>{item === 'All Tasks' ? tasks.length : tasks.filter(task => task.category === item).length}</span></button>)}</div>
        <div className="tasks-list">{filtered.map(task => <article className={`tasks-item ${task.status === 'Completed' ? 'is-completed' : ''}`} key={task.id}>
          <button className={`tasks-check ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => advanceTask(task)} disabled={task.status === 'Completed'} aria-label={task.status === 'Pending' ? `Start ${task.title}` : task.status === 'In Progress' ? `Complete ${task.title}` : `${task.title} completed`} title={task.status === 'Pending' ? 'Start task' : task.status === 'In Progress' ? 'Mark complete' : 'Completed'}>{task.status === 'Completed' ? <Check size={17} /> : <ArrowRight size={16} />}</button>
          <div className="tasks-item-main"><div className="tasks-item-title-row"><h3>{task.title}</h3><span className={`tasks-priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span><span className={`tasks-status status-${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></div><p>{task.detail}</p><div className="tasks-item-meta"><span>{task.station}</span><span><Users size={13} /> {task.owner}</span><span><Clock3 size={13} /> {task.due}</span><span>{task.category}</span></div></div>
          <div className="tasks-progress"><div><span>Progress</span><strong>{task.progress}%</strong></div><div className="tasks-progress-track"><span style={{ width: `${task.progress}%` }} /></div><small>{task.status === 'Completed' ? 'Completed and checked off' : task.status === 'In Progress' ? 'Work underway' : 'Awaiting start'}</small></div>
        </article>)}{filtered.length === 0 && <div className="tasks-empty"><Search size={22} /><strong>No tasks match these filters</strong><span>Try another search term or choose a different status.</span></div>}</div>
      </section>

      <section className="tasks-bottom-grid"><div className="panel tasks-safety-panel"><div className="section-kicker"><ShieldCheck size={15} /> FOOD SAFETY</div><h2>Safety checks to remember</h2><div className="tasks-safety-row"><span><CheckCircle2 size={16} /> Record storage temperatures</span><strong>Every shift</strong></div><div className="tasks-safety-row"><span><CheckCircle2 size={16} /> Label prepared ingredients</span><strong>Before storage</strong></div><div className="tasks-safety-row"><span><AlertTriangle size={16} /> Escalate missing or unsafe readings</span><strong>Immediately</strong></div><p className="muted-copy tasks-disclaimer">Checklist reminders only — these are not live sensor readings or a verified compliance report.</p></div><div className="panel tasks-copilot-panel"><div className="section-kicker"><Sparkles size={15} /> PLATEIQ ASSIST</div><h2>Keep the shift moving</h2><p className="muted-copy">Prioritise urgent prep, clear food-safety checks before service, and make sure every open task has an owner.</p><div className="tasks-assist-tip"><AlertTriangle size={17} /><span><strong>Suggested next step</strong> — filter to Pending and confirm task ownership before the service rush.</span></div></div></section>
    </div>
  </AppShell>
}
