'use client';
import { Loader2 } from "lucide-react";

export function Button({children, loading=false, variant='primary', ...props}: any){
  return <button {...props} className={'btn ' + (variant==='secondary' ? 'btn-secondary' : 'btn-primary')}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{children}
  </button>
}
export function Card({children, className=''}:{children:any, className?:string}){
  return <div className={'card p-4 ' + className}>{children}</div>
}
export function Input(props:any){ return <input {...props} className={'input '+(props.className??'')} /> }
export function Textarea(props:any){ return <textarea {...props} className={'textarea '+(props.className??'')} /> }
export function Select(props:any){ return <select {...props} className={'select '+(props.className??'')} /> }
export function Badge({children}:{children:any}){ return <span className="badge">{children}</span> }
export function Progress({value}:{value:number}){ return <div className="progress"><div style={{width: `${Math.round(value)}%`}}/></div> }
