const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function token(){ if(typeof window==="undefined") return ""; return localStorage.getItem("reporthub_token") || ""; }

export async function api(path:string, options:RequestInit={}) {
  const headers = new Headers(options.headers);
  if(!(options.body instanceof FormData)) headers.set("Content-Type","application/json");
  const t=token(); if(t) headers.set("Authorization",`Bearer ${t}`);
  const res=await fetch(`${API}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
