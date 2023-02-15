const url=new URL('k2tree.wasm',import.meta.url);
const mod=await WebAssembly.compileStreaming(await fetch(url));
const imports={
  wbg:{
    __wbindgen_throw:function(a,b){
      throw new Error(new TextDecoder().decode(new Uint8Array(wasm.memory.buffer).subarray(a,a+b)));
    }
  }
};
const wasm=(await WebAssembly.instantiate(mod,imports)).exports;
export class Tree {
  /**
   * @param {LatLon|{lat:number,lng:number}} point
   * @return {LatLonArray}
   */
  static __latlon=point=>{
    if(Array.isArray(point)) return point;
    return [point.lon??point.lng,point.lat];
  }
  static __wrap(ptr){
    const o=Object.create(Tree.prototype);
    o.ptr=ptr;
    return o;
  }
  __destroy_into_raw(){
    const ptr=this.ptr;
    this.ptr=0;
    return ptr;
  }
  free() {
    wasm.__wbg_tree_free(this.__destroy_into_raw());
  }
  /**
   * @param {Points} points
   */
  constructor(points){
    const arr=points instanceof BigUint64Array?points:(()=>{
      const arr=new Float32Array(points.length*2);
      let i=0;
      for(const pt of points){
        const [lon,lat]=Tree.__latlon(pt);
        arr[i++]=lat;
        arr[i++]=lon;
      }
      return new BigUint64Array(arr.buffer);
    })();
    const p=wasm.__wbindgen_malloc(arr.length*8);
    new BigUint64Array(wasm.memory.buffer).set(arr,p/8);
    const ret=wasm.tree_new(p,arr.length);
    return Tree.__wrap(ret);
  }
  /**
   * @param {LatLon} point
   * @return {number}
   */
  nearest(point){
    const [lon,lat]=Tree.__latlon(point);
    return wasm.tree_nearest(this.ptr,lat,lon) >>> 0;
  }
  /**
   * @param {LatLon} point
   * @param {number} distance
   * @return {number[]}
   */
  withinDistance(point, distance) {
    const [lon,lat]=Tree.__latlon(point);
    try{
      const r=wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_within_distance(r,this.ptr,lat,lon,distance);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0=mem[r/4];
      const r1=mem[r/4+1];
      const v0=new Uint32Array(wasm.memory.buffer).subarray(r0/4,r0/4+r1);
      const w=[...v0];
      wasm.__wbindgen_free(r0,r1*4);
      return w;
    }finally{wasm.__wbindgen_add_to_stack_pointer(16)}
  }
  /**
   * @param {LatLon} ne
   * @param {LatLon} sw
   * @return {number[]}
   */
  withinBounds(ne, sw) {
    const [neLon,neLat]=Tree.__latlon(ne);
    const [swLon,swLat]=Tree.__latlon(sw);
    try{
      const r=wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_within_bounds(r,this.ptr,neLat,neLon,swLat,swLon);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0=mem[r/4];
      const r1=mem[r/4+1];
      const v0=new Uint32Array(wasm.memory.buffer).subarray(r0/4,r0/4+r1);
      const w=[...v0];
      wasm.__wbindgen_free(r0,r1*4);
      return w;
    }finally{wasm.__wbindgen_add_to_stack_pointer(16)}
  }
  /**
   * @param {number} distance
   * @return {LatLonArray[][]}
   */
  clusterify(distance) {
    try {
      const r=wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_clusterify(r, this.ptr, distance);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0=mem[r/4];
      const r1=mem[r/4+1];
      const flat=new Uint32Array(wasm.memory.buffer).subarray(r0/4,r0/4+r1);
      const clusters=[];
      let i=0;
      while(i<flat.length){
        const sub=flat.subarray(i+1,i+1+Number(flat[i]));
        i+=sub.length+1;
        const cluster=new Array(sub.length);
        let j=0;
        for(const it of sub){
          cluster[j++]=it;
        }
        clusters.push(cluster);
      }
      wasm.__wbindgen_free(r0,r1*4);
      return clusters;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
