const url=new URL('k2tree.wasm',import.meta.url);
const mod=await WebAssembly.compileStreaming(await fetch(url));
const wasm=(await WebAssembly.instantiate(mod)).exports;
const malloc=wasm.__wbindgen_malloc;const free=wasm.__wbindgen_free;

export function build(points,latf,lonf){
  const arr=new Float32Array(points.length*2);
  let index=0;
  for(const pt of points){
    const lo=latf(pt);
    const hi=lonf(pt);
    arr[index++]=lo;
    arr[index++]=hi;
  }
  try{
    const r=wasm.__wbindgen_add_to_stack_pointer(-16);
    const p=malloc(points.length*8);
    new Float32Array(wasm.memory.buffer).set(arr,p/8);
    wasm.build(r,p,points.length);
    const mem=new Int32Array(wasm.memory.buffer);
    const i=mem[r/4];
    const j=mem[r/4+1];
    try{
      return new BigUint64Array(wasm.memory.buffer).subarray(i/8,i/8+j).slice();
    }finally{
      free(i,j*8);
    }
  }finally{
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

export function nearest(tree,lat,lon){
  const p=malloc(tree.length*8);
  new BigUint64Array(wasm.memory.buffer).set(tree,p/8);
  const r=wasm.nearest(p,tree.length,lat,lon);
  console.log(`result: ${r}`);
  return BigInt.asUintN(64,r);
}

export function inRadius(tree,lat,lon,radius){
  try{
    const r=wasm.__wbindgen_add_to_stack_pointer(-16);
    const p=malloc(tree.length*8);
    new BigUint64Array(wasm.memory.buffer).set(tree,p/8);
    wasm.in_radius(r,p,tree.length,lat,lon,radius);
    const mem=new Int32Array(wasm.memory.buffer);
    const i=mem[r/4];
    const j=mem[r/4+1];
    const tmp=new BigUint64Array(1);
    const arr=new Array(j);
    new BigUint64Array(wasm.memory.buffer).subarray(i/8,i/8+j).forEach(it=>{
      tmp[0]=it;
      arr.push([...new Float32Array(tmp.buffer)]);
    });
    free(i,j*8);
    return arr;
  }finally{
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
