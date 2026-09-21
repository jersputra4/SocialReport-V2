"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";

type Report={id:string;reportCode:string;platform:{name:string};url:string;status:string;createdAt:string;description:string};

export default function UserPage(){
 const router=useRouter(); const [reports,setReports]=useState<Report[]>([]); const [platforms,setPlatforms]=useState<any[]>([]); const [tab,setTab]=useState("dashboard"); const [error,setError]=useState("");
 const [form,setForm]=useState({platformCode:"INSTAGRAM",contentType:"POST",url:"",description:"",priority:2});
 async function load(){try{const [r,p]=await Promise.all([api("/reports"),api("/platforms")]);setReports(r);setPlatforms(p)}catch(e:any){setError(e.message);if(e.message.toLowerCase().includes("unauthorized"))router.push("/")}}
 useEffect(()=>{load()},[]);
 function logout(){localStorage.clear();router.push("/")}
 async function create(e:React.FormEvent){e.preventDefault();try{await api("/reports",{method:"POST",body:JSON.stringify(form)});setForm({...form,url:"",description:""});setTab("reports");load()}catch(e:any){setError(e.message)}}
 const counts=(s:string)=>reports.filter(r=>r.status===s).length;
 return <div className="layout"><aside className="side"><div className="brand"><div className="logo">RH</div><b>ReportHub</b></div><a href="#" onClick={()=>setTab("dashboard")}>Dashboard</a><a href="#" onClick={()=>setTab("create")}>Buat Report</a><a href="#" onClick={()=>setTab("reports")}>Laporan Saya</a><button onClick={logout}>Keluar</button></aside><main className="main">
 {error&&<div className="error">{error}</div>}
 {tab==="dashboard"&&<><div className="top"><div><h1>Dashboard User</h1><div className="muted">Kelola dan pantau laporan Anda.</div></div><button className="primary" onClick={()=>setTab("create")}>+ Buat Report</button></div><div className="stats"><div className="stat">Total<div className="n">{reports.length}</div></div><div className="stat">Submitted<div className="n">{counts("SUBMITTED")}</div></div><div className="stat">Review<div className="n">{counts("UNDER_REVIEW")}</div></div><div className="stat">Resolved<div className="n">{counts("RESOLVED")}</div></div></div><ReportTable reports={reports.slice(0,8)}/></>}
 {tab==="reports"&&<><div className="top"><div><h1>Laporan Saya</h1><div className="muted">Semua laporan yang Anda buat.</div></div></div><ReportTable reports={reports}/></>}
 {tab==="create"&&<><div className="top"><div><h1>Buat Report</h1><div className="muted">Masukkan URL dan informasi laporan.</div></div></div><div className="panel"><form onSubmit={create}><div className="field"><label>Platform</label><select value={form.platformCode} onChange={e=>setForm({...form,platformCode:e.target.value})}>{platforms.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></div><div className="field"><label>Jenis Konten</label><select value={form.contentType} onChange={e=>setForm({...form,contentType:e.target.value})}><option>POST</option><option>ACCOUNT</option><option>VIDEO</option><option>PHOTO</option><option>OTHER</option></select></div><div className="field"><label>URL</label><input type="url" required value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/></div><div className="field"><label>Deskripsi</label><textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><button className="primary">Submit Report</button></form></div></>}
 </main></div>
}
function ReportTable({reports}:{reports:Report[]}){return <div className="panel"><h2>Reports</h2><table><thead><tr><th>Report</th><th>Platform</th><th>URL</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td>{r.reportCode}</td><td>{r.platform.name}</td><td>{r.url}</td><td><span className="badge">{r.status}</span></td><td>{new Date(r.createdAt).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table></div>}
