import { useState } from 'react';
import {
  FUNCTIONAL_REQUIREMENTS,
  NON_FUNCTIONAL_REQUIREMENTS,
  TEAM_MEMBERS,
} from '../data/experimentsData';

type ExpId = 'exp2' | 'exp3' | 'exp4' | 'exp5' | 'exp6' | 'exp7' | 'exp8' | 'exp9';

const EXPERIMENTS: { id: ExpId; num: string; title: string; date: string; summary: string }[] = [
  {
    id: 'exp2',
    num: 'Exp 2',
    title: 'Software Requirements Specification (SRS)',
    date: 'Version 1.0',
    summary: '69 functional requirements, 23 non-functional requirements, lifecycle states, privacy rules, and team plan.',
  },
  {
    id: 'exp3',
    num: 'Exp 3',
    title: 'Data Flow Diagrams (DFD 0, 1 & 2)',
    date: '11/09/2026',
    summary: 'Function-oriented data flow modeling across Student/User, Admin, processes, and data stores D1–D5.',
  },
  {
    id: 'exp4',
    num: 'Exp 4',
    title: 'Use Case Diagram',
    date: '18/09/2026',
    summary: 'User-view analysis with Student/User and Admin actors, 16 use cases, and <<include>> dependencies.',
  },
  {
    id: 'exp5',
    num: 'Exp 5',
    title: 'Class & Object Diagrams',
    date: '09/10/2026',
    summary: 'Static OOP class blueprint (Student, Item, LostItem, FoundItem, Claim, Admin, Department) and runtime snapshot.',
  },
  {
    id: 'exp6',
    num: 'Exp 6',
    title: 'Behavioral Diagrams (Activity, Swimlane & State)',
    date: '16/10/2026',
    summary: 'Operational step-by-step control flow, cross-role swimlane hand-offs, and item lifecycle state machine.',
  },
  {
    id: 'exp7',
    num: 'Exp 7',
    title: 'Interaction Diagrams (Sequence & Collaboration)',
    date: '23/09/2026',
    summary: 'Chronological message sequence and structural object collaboration links across system actors.',
  },
  {
    id: 'exp8',
    num: 'Exp 8',
    title: 'Component Diagram',
    date: '14/10/2026',
    summary: 'Modular implementation architecture wired via lollipop/socket interfaces (IUser, INotification, IRepository, IEmail, ICloud).',
  },
  {
    id: 'exp9',
    num: 'Exp 9',
    title: 'Deployment Diagram',
    date: 'CS3CO40',
    summary: 'Physical hardware nodes (Student/Finder Device, Admin Device, Application Server, Database Server) and communication paths.',
  },
];

export function BlueprintView() {
  const [activeExp, setActiveExp] = useState<ExpId>('exp2');
  const [reqFilter, setReqFilter] = useState('');
  const [dfdLevel, setDfdLevel] = useState<'0' | '1' | '2'>('0');
  const [exp5Tab, setExp5Tab] = useState<'class' | 'object'>('class');
  const [exp6Tab, setExp6Tab] = useState<'activity' | 'swimlane' | 'state'>('swimlane');
  const [exp7Tab, setExp7Tab] = useState<'sequence' | 'collaboration'>('sequence');

  const filteredFunctional = FUNCTIONAL_REQUIREMENTS.filter(
    (r) =>
      !reqFilter ||
      r.id.toLowerCase().includes(reqFilter.toLowerCase()) ||
      r.module.toLowerCase().includes(reqFilter.toLowerCase()) ||
      r.statement.toLowerCase().includes(reqFilter.toLowerCase())
  );

  const currentMeta = EXPERIMENTS.find((e) => e.id === activeExp)!;

  return (
    <div className="space-y-8">
      {/* Header & Team Credits */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-blue-900">Software Engineering (CS3CO40) · Project Documentation</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
              SRS &amp; UML Architecture Blueprint
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Interactive reference of Experiments 2 through 9 defining the Campus Lost and Found System requirements, data flows, static structure, dynamic behavior, components, and deployment topology.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 text-xs">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <div className="font-bold text-slate-900">{member.name}</div>
                <div className="font-mono text-[11px] text-slate-500">{member.enrollment}</div>
                <div className="mt-1 text-[11px] text-slate-600">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiment Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {EXPERIMENTS.map((exp) => {
          const active = activeExp === exp.id;
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => setActiveExp(exp.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                active
                  ? 'border-blue-900 bg-blue-900 text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`font-mono text-[11px] font-semibold ${active ? 'text-blue-200' : 'text-slate-500'}`}>
                {exp.num}
              </div>
              <div className="mt-0.5 text-xs font-bold line-clamp-2">{exp.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Experiment Panel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-mono text-slate-500">
              {currentMeta.num} · {currentMeta.date}
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">{currentMeta.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{currentMeta.summary}</p>
          </div>
        </div>

        {/* EXP 2: SRS */}
        {activeExp === 'exp2' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                Functional Requirements Registry ({filteredFunctional.length} / {FUNCTIONAL_REQUIREMENTS.length})
              </h3>
              <input
                type="text"
                value={reqFilter}
                onChange={(e) => setReqFilter(e.target.value)}
                placeholder="Filter REQ-ID, module, or keyword..."
                className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">ID</th>
                    <th className="px-4 py-2.5 font-semibold">Module</th>
                    <th className="px-4 py-2.5 font-semibold">Priority</th>
                    <th className="px-4 py-2.5 font-semibold">Requirement Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFunctional.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono font-semibold text-blue-900 whitespace-nowrap">{req.id}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{req.module}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{req.priority}</td>
                      <td className="px-4 py-2.5 text-slate-700">{req.statement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Non-Functional Requirements ({NON_FUNCTIONAL_REQUIREMENTS.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {NON_FUNCTIONAL_REQUIREMENTS.map((nf) => (
                  <div key={nf.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-slate-700">
                      <span>{nf.id}</span>
                      <span className="text-slate-500">{nf.category}</span>
                    </div>
                    <p className="mt-1 text-slate-700">{nf.statement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXP 3: DFD */}
        {activeExp === 'exp3' && (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(['0', '1', '2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDfdLevel(lvl)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                    dfdLevel === lvl ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {lvl}-Level DFD
                </button>
              ))}
            </div>

            {dfdLevel === '0' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
                <svg viewBox="0 0 840 220" className="w-full max-w-4xl mx-auto">
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#1e3a8a" />
                    </marker>
                  </defs>
                  <rect x="30" y="75" width="160" height="70" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="110" y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Student / User</text>

                  <rect x="315" y="60" width="210" height="100" rx="22" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="2" />
                  <text x="420" y="105" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e3a8a">Campus Lost &amp; Found</text>
                  <text x="420" y="125" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1e3a8a">System (0.0)</text>

                  <rect x="650" y="75" width="160" height="70" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="730" y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Administrator</text>

                  <line x1="190" y1="92" x2="313" y2="92" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="252" y="84" textAnchor="middle" fontSize="11" fill="#334155">Report / Search / Claim</text>
                  <line x1="315" y1="128" x2="192" y2="128" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="252" y="146" textAnchor="middle" fontSize="11" fill="#334155">Results / Status</text>

                  <line x1="650" y1="92" x2="527" y2="92" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="588" y="84" textAnchor="middle" fontSize="11" fill="#334155">Manage / Verify</text>
                  <line x1="525" y1="128" x2="648" y2="128" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="588" y="146" textAnchor="middle" fontSize="11" fill="#334155">Updates / Reports</text>
                </svg>
              </div>
            )}

            {dfdLevel === '1' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
                <svg viewBox="0 0 880 490" className="w-full max-w-4xl mx-auto">
                  <defs>
                    <marker id="arrow1" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 9 3, 0 6" fill="#1e3a8a" />
                    </marker>
                  </defs>
                  {/* External Entities */}
                  <rect x="20" y="30" width="125" height="50" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="82" y="59" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Student / User</text>

                  <rect x="20" y="405" width="125" height="50" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="82" y="434" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Admin</text>

                  {/* Processes */}
                  {[
                    { y: 20, id: '1.0', name: 'User Registration', store: 'D1: User Database', flowIn: 'Registration Details', flowStore: 'Store User Data' },
                    { y: 85, id: '2.0', name: 'Login Authentication', store: 'D1: User Database', flowIn: 'Login Credentials', flowStore: 'Verify Credentials' },
                    { y: 150, id: '3.0', name: 'Report Lost Item', store: 'D2: Lost Items DB', flowIn: 'Lost Item Details', flowStore: 'Store Lost Item' },
                    { y: 215, id: '4.0', name: 'Report Found Item', store: 'D3: Found Items DB', flowIn: 'Found Item Details', flowStore: 'Store Found Item' },
                    { y: 280, id: '5.0', name: 'Search & View Item', store: 'D2/D3/D4 Item DBs', flowIn: 'Search / Filter', flowStore: 'Fetch Matching Items' },
                    { y: 345, id: '6.0', name: 'Verify & Match Claim', store: 'D4: Item Status DB', flowIn: 'Claim Request', flowStore: 'Update Claim Status' },
                    { y: 410, id: '7.0', name: 'Admin Management', store: 'D5: Admin Database', flowIn: 'Manage Users/Reports', flowStore: 'Read / Write Audit' },
                  ].map((p) => (
                    <g key={p.id}>
                      <rect x="310" y={p.y} width="210" height="46" rx="18" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="1.5" />
                      <text x="415" y={p.y + 27} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e3a8a">
                        {p.id} {p.name}
                      </text>

                      {/* Data Store */}
                      <line x1="650" y1={p.y + 6} x2="855" y2={p.y + 6} stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="650" y1={p.y + 40} x2="855" y2={p.y + 40} stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="650" y1={p.y + 6} x2="650" y2={p.y + 40} stroke="#0f172a" strokeWidth="1.5" />
                      <text x="752" y={p.y + 27} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">{p.store}</text>

                      {/* Flows */}
                      <line x1="145" y1={p.y + 23} x2="308" y2={p.y + 23} stroke="#1e3a8a" strokeWidth="1.3" markerEnd="url(#arrow1)" />
                      <text x="226" y={p.y + 17} textAnchor="middle" fontSize="10" fill="#475569">{p.flowIn}</text>
                      <line x1="520" y1={p.y + 23} x2="648" y2={p.y + 23} stroke="#1e3a8a" strokeWidth="1.3" markerEnd="url(#arrow1)" />
                      <text x="585" y={p.y + 17} textAnchor="middle" fontSize="10" fill="#475569">{p.flowStore}</text>
                    </g>
                  ))}
                  <line x1="82" y1="80" x2="82" y2="368" stroke="#64748b" strokeWidth="1" strokeDasharray="4 3" />
                </svg>
              </div>
            )}

            {dfdLevel === '2' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { proc: '1.0 User Registration', sub: ['1.1 Validate User Details', '1.2 Create Account'], store: 'D1 User Database' },
                  { proc: '2.0 Login Authentication', sub: ['2.1 Validate Credentials', '2.2 Check User Role'], store: 'D1 User Database' },
                  { proc: '3.0 Report Lost Item', sub: ['3.1 Enter Item Details', '3.2 Validate & Save Report'], store: 'D2 Lost Items DB' },
                  { proc: '4.0 Report Found Item', sub: ['4.1 Enter Item & Image', '4.2 Validate & Save Report'], store: 'D3 Found Items DB' },
                  { proc: '5.0 Search & View Items', sub: ['5.1 Search Item', '5.2 Display Results'], store: 'D2 / D3 Item DBs' },
                  { proc: '6.0 Verify & Match Item', sub: ['6.1 Check Details & Image', '6.2 Match Item'], store: 'D4 Item Status DB' },
                  { proc: '7.0 Return Item', sub: ['7.1 Verify Claimant', '7.2 Update Status & Close'], store: 'D4 Item Status DB' },
                  { proc: '8.0 Admin Management', sub: ['8.1 Manage User Accounts', '8.2 View System Reports'], store: 'D5 Admin Database' },
                ].map((block) => (
                  <div key={block.proc} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>{block.proc}</span>
                      <span className="font-mono text-[11px] text-slate-600">{block.store}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {block.sub.map((s) => (
                        <div key={s} className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXP 4: USE CASE DIAGRAM */}
        {activeExp === 'exp4' && (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
              <svg viewBox="0 0 880 470" className="w-full max-w-4xl mx-auto">
                <defs>
                  <marker id="uc-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#475569" />
                  </marker>
                </defs>
                {/* System Boundary */}
                <rect x="165" y="15" width="550" height="440" rx="10" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                <text x="440" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">
                  Campus Lost and Found System Boundary
                </text>

                {/* Student Actor */}
                <circle cx="65" cy="195" r="14" fill="none" stroke="#0f172a" strokeWidth="2" />
                <line x1="65" y1="209" x2="65" y2="250" stroke="#0f172a" strokeWidth="2" />
                <line x1="40" y1="225" x2="90" y2="225" stroke="#0f172a" strokeWidth="2" />
                <line x1="65" y1="250" x2="45" y2="280" stroke="#0f172a" strokeWidth="2" />
                <line x1="65" y1="250" x2="85" y2="280" stroke="#0f172a" strokeWidth="2" />
                <text x="65" y="302" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Student / User</text>

                {/* Admin Actor */}
                <circle cx="815" cy="195" r="14" fill="none" stroke="#0f172a" strokeWidth="2" />
                <line x1="815" y1="209" x2="815" y2="250" stroke="#0f172a" strokeWidth="2" />
                <line x1="790" y1="225" x2="840" y2="225" stroke="#0f172a" strokeWidth="2" />
                <line x1="815" y1="250" x2="795" y2="280" stroke="#0f172a" strokeWidth="2" />
                <line x1="815" y1="250" x2="835" y2="280" stroke="#0f172a" strokeWidth="2" />
                <text x="815" y="302" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Admin</text>

                {/* Student Use Cases */}
                {[
                  { cx: 265, cy: 78, label: 'User Registration' },
                  { cx: 265, cy: 138, label: 'Login Authentication' },
                  { cx: 265, cy: 198, label: 'Report Lost Item' },
                  { cx: 265, cy: 258, label: 'Report Found Item' },
                  { cx: 265, cy: 318, label: 'Search & View Items' },
                  { cx: 265, cy: 388, label: 'Claim Item' },
                ].map((uc) => (
                  <g key={uc.label}>
                    <line x1="95" y1="230" x2={uc.cx - 72} y2={uc.cy} stroke="#64748b" strokeWidth="1.2" />
                    <ellipse cx={uc.cx} cy={uc.cy} rx="72" ry="22" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="1.4" />
                    <text x={uc.cx} y={uc.cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">{uc.label}</text>
                  </g>
                ))}

                {/* Included Use Cases */}
                {[
                  { cx: 455, cy: 138, label: 'Validate Credentials', from: [337, 138] },
                  { cx: 455, cy: 228, label: 'Store Item Details', from: [337, 200] },
                  { cx: 455, cy: 318, label: 'View Item Details', from: [337, 318] },
                  { cx: 455, cy: 388, label: 'Verify & Match Item', from: [337, 388] },
                ].map((uc) => (
                  <g key={uc.label}>
                    <line x1={uc.from[0]} y1={uc.from[1]} x2={uc.cx - 66} y2={uc.cy} stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#uc-arrow)" />
                    <ellipse cx={uc.cx} cy={uc.cy} rx="66" ry="21" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
                    <text x={uc.cx} y={uc.cy + 4} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#0f172a">{uc.label}</text>
                  </g>
                ))}
                <line x1="337" y1="258" x2="389" y2="232" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#uc-arrow)" />

                {/* Admin Use Cases */}
                {[
                  { cx: 630, cy: 82, label: 'Verify Item Reports' },
                  { cx: 630, cy: 148, label: 'Match Lost & Found' },
                  { cx: 630, cy: 214, label: 'Manage Users' },
                  { cx: 630, cy: 280, label: 'Manage Items' },
                  { cx: 630, cy: 344, label: 'View Reports' },
                  { cx: 630, cy: 408, label: 'Return Item' },
                ].map((uc) => (
                  <g key={uc.label}>
                    <line x1="785" y1="230" x2={uc.cx + 68} y2={uc.cy} stroke="#64748b" strokeWidth="1.2" />
                    <ellipse cx={uc.cx} cy={uc.cy} rx="68" ry="21" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="1.4" />
                    <text x={uc.cx} y={uc.cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">{uc.label}</text>
                  </g>
                ))}
                <line x1="521" y1="392" x2="560" y2="404" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#uc-arrow)" />
              </svg>
            </div>
            <p className="text-xs text-slate-600">
              Dashed arrows denote UML <code className="font-mono">&lt;&lt;include&gt;&gt;</code> relationships: Login Authentication → Validate Credentials, Report Lost/Found → Store Item Details, Search → View Item Details, Claim Item → Verify &amp; Match Item → Return Item.
            </p>
          </div>
        )}

        {/* EXP 5: CLASS & OBJECT DIAGRAMS */}
        {activeExp === 'exp5' && (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setExp5Tab('class')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                  exp5Tab === 'class' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Class Diagram
              </button>
              <button
                type="button"
                onClick={() => setExp5Tab('object')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                  exp5Tab === 'object' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Object Diagram (Runtime Snapshot)
              </button>
            </div>

            {exp5Tab === 'class' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Student',
                    attrs: ['- studentID : String', '- name : String', '- email : String', '- phone : String', '- department : String'],
                    methods: ['+ reportLostItem() : void', '+ reportFoundItem() : void', '+ submitClaim() : void', '+ viewItemStatus() : void'],
                    rel: '1 Student → 0..* Item · 1 Student → 0..* Claim',
                  },
                  {
                    name: 'Item (Base Class)',
                    attrs: ['- itemID : String', '- itemName : String', '- description : String', '- category : String', '- location : String', '- status : String'],
                    methods: ['+ updateStatus() : void', '+ getItemDetails() : void'],
                    rel: 'Generalized superclass for LostItem & FoundItem',
                  },
                  {
                    name: 'Admin',
                    attrs: ['- adminID : String', '- name : String', '- email : String', '- phone : String', '- role : String'],
                    methods: ['+ addItem() : void', '+ verifyItem() : void', '+ manageClaims() : void', '+ generateReport() : void'],
                    rel: '1 Admin → 0..* Item · 1 Admin → 0..* Department',
                  },
                  {
                    name: 'LostItem extends Item',
                    attrs: ['- locationLastSeen : String', '- dateLost : Date'],
                    methods: ['+ markAsFound() : void'],
                    rel: 'Inherits common attributes from Item',
                  },
                  {
                    name: 'FoundItem extends Item',
                    attrs: ['- foundLocation : String', '- dateFound : Date'],
                    methods: ['+ linkToClaim() : void'],
                    rel: 'Inherits from Item · Linked to Claim',
                  },
                  {
                    name: 'Claim & Department',
                    attrs: ['Claim: - claimID, - claimDate, - status, - remarks', 'Department: - deptID, - deptName, - location'],
                    methods: ['+ updateStatus() / + addRemarks()', '+ getDepartmentDetails()'],
                    rel: 'Each Claim associates with Student & Item',
                  },
                ].map((cls) => (
                  <div key={cls.name} className="rounded-xl border border-slate-300 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                      {cls.name}
                    </div>
                    <div className="border-b border-slate-200 px-4 py-2.5 font-mono text-[11px] text-slate-700 space-y-0.5">
                      {cls.attrs.map((a) => (
                        <div key={a}>{a}</div>
                      ))}
                    </div>
                    <div className="border-b border-slate-200 px-4 py-2.5 font-mono text-[11px] text-blue-900 space-y-0.5">
                      {cls.methods.map((m) => (
                        <div key={m}>{m}</div>
                      ))}
                    </div>
                    <div className="bg-slate-50 px-4 py-2 text-[11px] text-slate-600">{cls.rel}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { obj: 'student1 : Student', vals: ['studentID = "EN24CS3011085"', 'name = "Toshnil Kirange"', 'email = "toshnil.k@campus.edu"'] },
                  { obj: 'lostItem1 : LostItem', vals: ['itemID = "CLF-2026-0105"', 'itemName = "Brown Leather Wallet"', 'location = "Central Library"'] },
                  { obj: 'foundItem1 : FoundItem', vals: ['itemID = "CLF-2026-0101"', 'itemName = "Dark Brown Leather Wallet"', 'foundLocation = "Central Library"'] },
                  { obj: 'claim1 : Claim', vals: ['claimID = "CLM-2026-0201"', 'status = "Pending"', 'remarks = "Awaiting verification"'] },
                  { obj: 'admin1 : Admin', vals: ['adminID = "ADM-01"', 'name = "Campus Desk Admin"', 'role = "Verification Officer"'] },
                  { obj: 'department1 : Department', vals: ['deptID = "DEPT-CS"', 'deptName = "Computer Science"', 'location = "Academic Block 3"'] },
                ].map((inst) => (
                  <div key={inst.obj} className="rounded-xl border border-slate-300 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 bg-blue-50 px-4 py-2 font-mono text-xs font-bold underline text-blue-950">
                      {inst.obj}
                    </div>
                    <div className="px-4 py-3 font-mono text-[11px] text-slate-700 space-y-1">
                      {inst.vals.map((v) => (
                        <div key={v}>{v}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXP 6: BEHAVIORAL DIAGRAMS */}
        {activeExp === 'exp6' && (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(['swimlane', 'state', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setExp6Tab(tab)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                    exp6Tab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {tab === 'state' ? 'State Chart Diagram' : `${tab} Diagram`}
                </button>
              ))}
            </div>

            {exp6Tab === 'swimlane' && (
              <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-300 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-white">
                <div className="p-4 space-y-2.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2">
                    Lane 1: Student / User
                  </div>
                  {['1. Register / Login', '2. Search Lost & Found Items', '3. Select Matching Item', '4. Submit Claim Request', '9. Receive Approval / Rejection', '10. Collect Item & Confirm Receipt'].map((step) => (
                    <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                      {step}
                    </div>
                  ))}
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2">
                    Lane 2: Campus Lost &amp; Found System
                  </div>
                  {['Display Matching Items', '5. Record Claim Request', '6. Forward Claim to Admin/Staff', '8. Update Item Status', 'Send Approval / Rejection Notification', '11. Update Status to Claimed/Returned'].map((step) => (
                    <div key={step} className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-slate-800">
                      {step}
                    </div>
                  ))}
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2">
                    Lane 3: Admin / Staff
                  </div>
                  {['7. Review Claim Request', 'Decision: Claim Valid?', 'Approve Claim (Yes) / Reject Claim (No)', 'Instruct System to Update Item Status'].map((step) => (
                    <div key={step} className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-slate-800">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exp6Tab === 'state' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
                <svg viewBox="0 0 880 230" className="w-full max-w-4xl mx-auto">
                  <defs>
                    <marker id="st-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#1e3a8a" />
                    </marker>
                  </defs>
                  <circle cx="30" cy="60" r="10" fill="#0f172a" />
                  <line x1="40" y1="60" x2="72" y2="60" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#st-arrow)" />

                  {[
                    { x: 75, y: 38, w: 110, label: 'Item Reported' },
                    { x: 225, y: 38, w: 115, label: 'Under Verification' },
                    { x: 380, y: 38, w: 115, label: 'Approved / Listed' },
                    { x: 535, y: 38, w: 115, label: 'Claim Requested' },
                    { x: 690, y: 38, w: 120, label: 'Claim Under Review' },
                  ].map((s, i) => (
                    <g key={s.label}>
                      <rect x={s.x} y={s.y} width={s.w} height="44" rx="10" fill="#fff" stroke="#1e3a8a" strokeWidth="1.5" />
                      <text x={s.x + s.w / 2} y={s.y + 26} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">{s.label}</text>
                      {i < 4 && (
                        <line x1={s.x + s.w} y1={60} x2={s.x + s.w + 38} y2={60} stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#st-arrow)" />
                      )}
                    </g>
                  ))}

                  {/* Rejected branch */}
                  <line x1="282" y1="82" x2="282" y2="145" stroke="#dc2626" strokeWidth="1.5" markerEnd="url(#st-arrow)" />
                  <rect x="222" y="148" width="120" height="42" rx="10" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
                  <text x="282" y="173" textAnchor="middle" fontSize="11" fontWeight="600" fill="#991b1b">Rejected Report</text>

                  {/* Handover & Final */}
                  <line x1="750" y1="82" x2="750" y2="145" stroke="#15803d" strokeWidth="1.5" markerEnd="url(#st-arrow)" />
                  <rect x="530" y="148" width="150" height="42" rx="10" fill="#f0fdf4" stroke="#15803d" strokeWidth="1.5" />
                  <text x="605" y="173" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">Ready for Collection</text>
                  <rect x="705" y="148" width="125" height="42" rx="10" fill="#ecfdf5" stroke="#15803d" strokeWidth="1.5" />
                  <text x="767" y="173" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">Returned / Closed</text>
                  <line x1="705" y1="169" x2="682" y2="169" stroke="#15803d" strokeWidth="1.5" markerEnd="url(#st-arrow)" />
                </svg>
              </div>
            )}

            {exp6Tab === 'activity' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer / Student Activity Flow</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
                    <li>Open Campus Lost and Found System → Login / Register</li>
                    <li>Validate Credentials (Loop until valid)</li>
                    <li>Search Found Items → View Item Details</li>
                    <li>Decision: Is This My Item? → Submit Claim Request</li>
                    <li>Wait for Admin Verification</li>
                    <li>If Approved: Receive Approval Notification → Collect Item → Confirm Receipt</li>
                    <li>If Rejected: Receive Rejection Notification → End</li>
                  </ol>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Admin Activity Flow</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
                    <li>Admin Login → Validate Credentials → Open Admin Dashboard</li>
                    <li>Fork: Manage Lost &amp; Found Items OR Review Claim Requests</li>
                    <li>Decision: Claim Valid?</li>
                    <li>If Yes: Approve Claim → Send Approval Notification → Update Status to Claimed</li>
                    <li>If No: Reject Claim → Send Rejection Notification</li>
                    <li>Generate Reports → Log Out</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXP 7: SEQUENCE & COLLABORATION */}
        {activeExp === 'exp7' && (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setExp7Tab('sequence')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                  exp7Tab === 'sequence' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sequence Diagram (12 Messages)
              </button>
              <button
                type="button"
                onClick={() => setExp7Tab('collaboration')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                  exp7Tab === 'collaboration' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Collaboration Diagram (14 Calls)
              </button>
            </div>

            {exp7Tab === 'sequence' ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
                <svg viewBox="0 0 860 440" className="w-full max-w-4xl mx-auto">
                  <defs>
                    <marker id="seq-solid" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#0f172a" />
                    </marker>
                  </defs>
                  {[
                    { x: 110, label: 'Student/User' },
                    { x: 330, label: 'Campus Lost & Found System' },
                    { x: 550, label: 'Database' },
                    { x: 750, label: 'Admin' },
                  ].map((col) => (
                    <g key={col.label}>
                      <rect x={col.x - 80} y="15" width="160" height="36" rx="4" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                      <text x={col.x} y="37" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{col.label}</text>
                      <line x1={col.x} y1="51" x2={col.x} y2="425" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="4 4" />
                    </g>
                  ))}

                  {[
                    { y: 78, x1: 110, x2: 330, text: '1. Submit lost/found item details', dashed: false },
                    { y: 108, x1: 330, x2: 550, text: '2. Validate item information', dashed: false },
                    { y: 138, x1: 550, x2: 330, text: '3. Validation result', dashed: true },
                    { y: 168, x1: 330, x2: 110, text: '4. Display submission status', dashed: true },
                    { y: 198, x1: 110, x2: 330, text: '5. Search reported items', dashed: false },
                    { y: 228, x1: 330, x2: 550, text: '6. Retrieve matching items', dashed: false },
                    { y: 258, x1: 550, x2: 330, text: '7. Matching item list', dashed: true },
                    { y: 288, x1: 110, x2: 330, text: '8. Submit claim request', dashed: false },
                    { y: 318, x1: 330, x2: 750, text: '9. Forward claim for verification', dashed: false },
                    { y: 348, x1: 750, x2: 330, text: '10. Approve / Reject claim', dashed: true },
                    { y: 378, x1: 330, x2: 550, text: '11. Update item and claim status', dashed: false },
                    { y: 408, x1: 330, x2: 110, text: '12. Confirmation / status notification', dashed: true },
                  ].map((m) => (
                    <g key={m.text}>
                      <line
                        x1={m.x1}
                        y1={m.y}
                        x2={m.x2 > m.x1 ? m.x2 - 4 : m.x2 + 4}
                        y2={m.y}
                        stroke="#0f172a"
                        strokeWidth="1.3"
                        strokeDasharray={m.dashed ? '4 3' : undefined}
                        markerEnd="url(#seq-solid)"
                      />
                      <text x={(m.x1 + m.x2) / 2} y={m.y - 5} textAnchor="middle" fontSize="10.5" fill="#1e293b">
                        {m.text}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { link: ':Student/User ↔ :Campus Lost and Found System', calls: ['1: searchItems()', '4: displayItems()', '5: submitLostFoundDetails()', '8: submitClaimRequest()', '12: claimStatusNotification()'] },
                  { link: ':Campus Lost and Found System ↔ :Database', calls: ['2: retrieveItems()', '3: matchingItemList()', '6: saveItemDetails()', '7: itemRecord()', '11: updateClaimStatus()'] },
                  { link: ':Campus Lost and Found System ↔ :Admin', calls: ['9: forwardClaimForVerification()', '10: approveRejectClaim()', '13: manageItemRecords()', '14: generateReport()'] },
                ].map((c) => (
                  <div key={c.link} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-mono text-xs font-bold text-blue-900 mb-2">{c.link}</div>
                    <ul className="space-y-1 font-mono text-xs text-slate-700">
                      {c.calls.map((call) => (
                        <li key={call}>{call}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXP 8: COMPONENT DIAGRAM */}
        {activeExp === 'exp8' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                comp: '<<component>> User Interface (Web/Mobile)',
                provides: 'Consumes IUser',
                ops: ['- Login / Register', '- Post Lost / Found', '- Search & View Items'],
              },
              {
                comp: '<<component>> Notification UI',
                provides: 'Consumes INotification',
                ops: ['- View Alerts', '- Receive Match & Claim Messages'],
              },
              {
                comp: '<<component>> Lost and Found Service',
                provides: 'Provides IUser, INotification · Uses IRepository',
                ops: ['- Manage Items', '- Verify Claims', '- Send Notifications'],
              },
              {
                comp: '<<component>> Repository',
                provides: 'Provides IRepository · Uses Database, IEmail, ICloud',
                ops: ['- CRUD Operations', '- Query Records & Audit Log'],
              },
              {
                comp: '<<database>> Database Layer',
                provides: 'Provides Data Persistence',
                ops: ['- User, Item, Claim & Audit Records'],
              },
              {
                comp: '<<component>> Email / SMS & Cloud Storage',
                provides: 'Provides IEmail & ICloud',
                ops: ['- Send Notifications / OTP', '- Store & Retrieve Item Photographs'],
              },
            ].map((item) => (
              <div key={item.comp} className="rounded-xl border border-slate-300 bg-white p-4 space-y-2">
                <div className="font-mono text-xs font-bold text-blue-900">{item.comp}</div>
                <div className="text-[11px] font-medium text-slate-500">{item.provides}</div>
                <ul className="border-t border-slate-100 pt-2 space-y-1 text-xs text-slate-700">
                  {item.ops.map((op) => (
                    <li key={op}>{op}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* EXP 9: DEPLOYMENT DIAGRAM */}
        {activeExp === 'exp9' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
            <svg viewBox="0 0 820 380" className="w-full max-w-3xl mx-auto">
              <defs>
                <marker id="dep-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#1e3a8a" />
                </marker>
              </defs>
              {/* Student Device Node */}
              <rect x="40" y="25" width="240" height="80" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="160" y="54" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">&lt;&lt;node&gt;&gt; Student / Finder Device</text>
              <text x="160" y="76" textAnchor="middle" fontSize="11" fill="#475569">Web or Mobile Browser</text>

              {/* Admin Device Node */}
              <rect x="540" y="25" width="240" height="80" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="660" y="54" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">&lt;&lt;node&gt;&gt; Admin Device</text>
              <text x="660" y="76" textAnchor="middle" fontSize="11" fill="#475569">Admin Dashboard</text>

              {/* Application Server Node */}
              <rect x="240" y="155" width="340" height="95" rx="6" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="1.8" />
              <text x="410" y="182" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1e3a8a">&lt;&lt;node&gt;&gt; Application Server (Express + Vite)</text>
              <text x="410" y="204" textAnchor="middle" fontSize="11" fill="#1e293b">Login / User Module · Lost &amp; Found Item Module</text>
              <text x="410" y="222" textAnchor="middle" fontSize="11" fill="#1e293b">Claim Verification &amp; Status Module</text>

              {/* Database Server Node */}
              <rect x="240" y="285" width="340" height="75" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="410" y="314" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">&lt;&lt;node&gt;&gt; Database Server</text>
              <text x="410" y="336" textAnchor="middle" fontSize="11" fill="#475569">User DB | Item DB | Claim &amp; Audit Records</text>

              {/* Paths */}
              <line x1="160" y1="105" x2="310" y2="153" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#dep-arrow)" />
              <text x="210" y="140" textAnchor="middle" fontSize="11" fill="#334155">HTTPS Requests</text>

              <line x1="660" y1="105" x2="510" y2="153" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#dep-arrow)" />
              <text x="615" y="140" textAnchor="middle" fontSize="11" fill="#334155">Admin Actions</text>

              <line x1="410" y1="250" x2="410" y2="283" stroke="#1e3a8a" strokeWidth="1.5" markerEnd="url(#dep-arrow)" />
              <text x="470" y="272" textAnchor="middle" fontSize="11" fill="#334155">Read / Write Data</text>
            </svg>
          </div>
        )}
      </section>
    </div>
  );
}
