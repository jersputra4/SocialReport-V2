"use client";
import { useState } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

export default function Login(){
 const router=useRouter(); const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setError("");try{const d=await api("/auth/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem("reporthub_token",d.accessToken);localStorage.setItem("reporthub_user",JSON.stringify(d.user));router.push(d.user.role==="ADMIN"?"/admin":"/user")}catch(e:any){setError(e.message)}}
 return <main className="login"><div className="card"><div className="brand"><div className="logo">RH</div><div><h2 style={{margin:0}}>ReportHub</h2><span className="muted">Social Media Reporting System</span></div></div><form onSubmit={submit}><div className="field"><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} required/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<div className="error">{error}</div>}<button className="primary" style={{width:"100%"}}>Masuk</button></form><div className="panel" style={{marginTop:18,fontSize:12}}>Demo: <b>admin/admin123</b> atau <b>user/user123</b></div></div></main>
}
