'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { CarFront, Boxes, Hash, GitCompareArrows, ShieldCheck, QrCode, Search, RefreshCw } from 'lucide-react';

type Row = Record<string, any>;
const menus = [
  ['vehicles','Master Kendaraan',CarFront],['parts','Master Sparepart',Boxes],['numbers','OEM & Aftermarket Reference',Hash],
  ['cross','Cross-Reference Part',GitCompareArrows],['fitments','Vehicle Compatibility',ShieldCheck],['codes','Barcode & QR Generator',QrCode],['search','Vehicle-Based Parts Search',Search]
] as const;
const panel:React.CSSProperties={background:'#fff',border:'1px solid #e7ebf0',borderRadius:14,padding:18,marginBottom:14};
const input:React.CSSProperties={width:'100%',height:42,border:'1px solid #dce2e8',borderRadius:9,padding:'0 11px',background:'#fff'};
function Table({headers,rows,empty}:{headers:string[];rows:any[][];empty:string}){return <div style={{overflowX:'auto'}}>{rows.length?<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{headers.map(h=><th key={h} style={{textAlign:'left',padding:11,color:'#84909d',borderBottom:'1px solid #e7ebf0'}}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} style={{padding:11,borderBottom:'1px solid #edf0f3'}}>{v||'—'}</td>)}</tr>)}</tbody></table>:<div className="empty">{empty}</div>}</div>}
function Status({value}:{value:string}){return <span style={{fontWeight:700,color:value==='verified'?'#08734f':'#946200'}}>{value==='verified'?'Terverifikasi':value==='rejected'?'Ditolak':'Menunggu verifikasi'}</span>}

export default function AutomotiveCatalog({businessId,role}:{businessId:string;role:string}){
 const [menu,setMenu]=useState<(typeof menus)[number][0]>('search');
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [brands,setBrands]=useState<Row[]>([]),[models,setModels]=useState<Row[]>([]),[engines,setEngines]=useState<Row[]>([]);
 const [parts,setParts]=useState<Row[]>([]),[numbers,setNumbers]=useState<Row[]>([]),[cross,setCross]=useState<Row[]>([]),[fitments,setFitments]=useState<Row[]>([]),[sources,setSources]=useState<Row[]>([]),[codes,setCodes]=useState<Row[]>([]),[verified,setVerified]=useState<Row[]>([]);
 const [brand,setBrand]=useState(''),[model,setModel]=useState(''),[engine,setEngine]=useState(''),[year,setYear]=useState(String(new Date().getFullYear())),[query,setQuery]=useState('');
 async function load(){setLoading(true);setError('');try{
  const specs:any[]=[
   supabase.from('vehicle_brands').select('*').order('name'),
   supabase.from('vehicle_models').select('*').order('name'),
   supabase.from('vehicle_engines').select('*').order('engine_code'),
   supabase.from('part_catalog').select('*').order('part_name'),
   supabase.from('part_numbers').select('*,part_catalog(part_name),part_manufacturers(name)').order('part_number'),
   supabase.from('part_cross_references').select('*,from_part_number:part_numbers!part_cross_references_from_part_number_id_fkey(part_number),to_part_number:part_numbers!part_cross_references_to_part_number_id_fkey(part_number)'),
   supabase.from('part_vehicle_fitments').select('*,part_catalog(part_name),vehicle_brands(name),vehicle_models(name),fitment_sources(source_name)').order('created_at',{ascending:false}),
   supabase.from('fitment_sources').select('*').order('source_name'),
   supabase.from('product_barcodes').select('*,products(product_name,sku)').eq('business_id',businessId),
   supabase.from('v_verified_part_fitments').select('*').order('part_name')
  ];
  const res=await Promise.all(specs);for(const r of res)if(r.error)throw r.error;
  setBrands(res[0].data||[]);setModels(res[1].data||[]);setEngines(res[2].data||[]);setParts(res[3].data||[]);setNumbers(res[4].data||[]);setCross(res[5].data||[]);setFitments(res[6].data||[]);setSources(res[7].data||[]);setCodes(res[8].data||[]);setVerified(res[9].data||[]);
 }catch(e:any){setError(e.message||'Gagal memuat katalog')}finally{setLoading(false)}}
 useEffect(()=>{load()},[businessId]);
 const filteredModels=models.filter(x=>x.brand_id===brand);
 const filteredEngines=engines.filter(x=>x.model_id===model);
 const results=useMemo(()=>verified.filter(x=>x.vehicle_brand_id===brand&&x.vehicle_model_id===model&&(!engine||x.engine_id===engine)&&(!year||(x.year_from==null||Number(year)>=x.year_from)&&(x.year_to==null||Number(year)<=x.year_to))&&(!query||String(x.part_name).toLowerCase().includes(query.toLowerCase()))),[verified,brand,model,engine,year,query]);
 const select=(value:string,onChange:(v:string)=>void,options:Row[],label:(x:Row)=>string)=><select value={value} onChange={e=>onChange(e.target.value)} style={input}><option value="">Pilih {label===undefined?'': '...'}</option>{options.map(x=><option key={x.id} value={x.id}>{label(x)}</option>)}</select>;
 return <div>
  <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>{menus.map(([id,title,Icon])=><button key={id} className={menu===id?'primary':'outline-btn'} onClick={()=>setMenu(id)} style={{fontSize:11}}><Icon size={15}/>{title}</button>)}</div>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><div><div className="eyebrow">AUTOMOTIVE AC PARTS CATALOG</div><p className="muted">Katalog teknis terpusat · hasil kompatibilitas hanya data verified</p></div><button className="outline-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
  {error&&<div className="alert error">{error}</div>}
  {loading?<section style={panel}>Memuat katalog kendaraan dan sparepart…</section>:null}
  {!loading&&menu==='vehicles'&&<section style={panel}><h3>Master Kendaraan</h3><Table headers={['Merek','Model','Jenis','Kode mesin','CC']} rows={models.map(m=>[brands.find(b=>b.id===m.brand_id)?.name,m.name,m.vehicle_type,engines.filter(e=>e.model_id===m.id).map(e=>e.engine_code).join(', '),engines.filter(e=>e.model_id===m.id).map(e=>e.displacement_cc).filter(Boolean).join(', ')])} empty="Belum ada master kendaraan. Data kendaraan perlu dimasukkan dari referensi resmi."/><p className="tiny">Master merek, model, generasi, dan mesin terhubung ke vehicle_brands, vehicle_models, vehicle_generations, dan vehicle_engines.</p></section>}
  {!loading&&menu==='parts'&&<section style={panel}><h3>Master Sparepart</h3><Table headers={['Nama sparepart','Kategori','Subkategori','Sistem','Deskripsi']} rows={parts.map(x=>[x.part_name,x.category,x.subcategory,x.system_name,x.description])} empty="Master sparepart belum tersedia."/></section>}
  {!loading&&menu==='numbers'&&<section style={panel}><h3>OEM & Aftermarket Reference</h3><Table headers={['Nomor part','Jenis','Master sparepart','Produsen','Status']} rows={numbers.map(x=>[x.part_number,x.number_type,x.part_catalog?.part_name,x.part_manufacturers?.name,<Status value={x.verification_status}/>])} empty="Nomor OEM / aftermarket belum tersedia."/></section>}
  {!loading&&menu==='cross'&&<section style={panel}><h3>Cross-Reference Part</h3><Table headers={['Nomor asal','Nomor tujuan','Relasi','Status']} rows={cross.map(x=>[x.from_part_number?.part_number,x.to_part_number?.part_number,x.relationship_type,<Status value={x.verification_status}/>])} empty="Cross-reference belum tersedia."/></section>}
  {!loading&&menu==='fitments'&&<section style={panel}><h3>Vehicle Compatibility Register</h3><Table headers={['Sparepart','Kendaraan','Tahun','Status','Sumber teknis']} rows={fitments.map(x=>[x.part_catalog?.part_name,(x.vehicle_brands?.name||'')+' '+(x.vehicle_models?.name||''),[x.year_from,x.year_to].filter(Boolean).join('–'),<Status value={x.verification_status}/>,x.fitment_sources?.source_name])} empty="Belum ada data kandidat kompatibilitas."/></section>}
  {!loading&&menu==='codes'&&<section style={panel}><h3>Barcode & QR Generator</h3><p className="muted">Menampilkan identifier produk bisnis yang dibuat otomatis oleh database.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginTop:15}}>{codes.map(c=><div key={c.id} style={{border:'1px solid #e7ebf0',borderRadius:12,padding:14,display:'flex',alignItems:'center',flexDirection:'column',gap:7}}><QRCodeSVG value={c.code_value} size={120}/><b>{c.products?.product_name||'Produk'}</b><small>{c.products?.sku}</small><code style={{fontSize:10,wordBreak:'break-all'}}>{c.code_value}</code><small>{String(c.symbology).toUpperCase()}</small></div>)}</div>{!codes.length&&<div className="empty">Belum ada produk pada bisnis ini.</div>}</section>}
  {!loading&&menu==='search'&&<><section style={panel}><h3>Vehicle-Based Parts Search</h3><p className="muted" style={{marginBottom:14}}>Pilih kendaraan untuk mencari sparepart AC yang telah diverifikasi.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><label>Merek{select(brand,setBrand,brands,x=>x.name)}</label><label>Model{select(model,v=>{setModel(v);setEngine('')},filteredModels,x=>x.name)}</label><label>Mesin{select(engine,setEngine,filteredEngines,x=>x.engine_code)}</label><label>Tahun<input type="number" value={year} onChange={e=>setYear(e.target.value)} style={input}/></label><label>Nama sparepart<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari komponen…" style={input}/></label></div></section><section style={panel}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><h3>Hasil kompatibilitas terverifikasi</h3><p className="muted">Hanya data dari v_verified_part_fitments. PENDING dan REJECTED dikecualikan.</p></div><b style={{fontSize:24,color:'#138a62'}}>{results.length}</b></div>{brand&&model&&results.length?<Table headers={['Sparepart','Kategori','Tahun','Mesin','Sumber','Diverifikasi oleh']} rows={results.map(x=>[x.part_name,x.category,[x.year_from,x.year_to].filter(Boolean).join('–')||'—',x.engine_code||'Tidak dispesifikasikan',x.source_name,x.verified_by])} empty="Tidak ada hasil."/>:<div className="empty">{brand&&model?'Tidak ada sparepart terverifikasi untuk kendaraan ini. Sistem tidak menebak kecocokan teknis.':'Pilih merek dan model kendaraan terlebih dahulu.'}</div>}</section></>}
 </div>
}
