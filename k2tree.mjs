const url=new URL('k2tree.wasm',import.meta.url);
const mod=await WebAssembly.compileStreaming(await fetch(url));
const heap=new Array(128).fill(undefined);
heap.push(undefined,null,true,false);
let next=heap.length;
const at=i=>heap[i];
const drop=i=>i<132?heap[i]=next:next=i;
const add=o=>{
  if(next===heap.length) heap.push(heap.length+1);
  const i=next;
  next=heap[i];
  heap[i]=o;
  return i;
};
const imports={
  wbg:{
    __wbindgen_object_drop_ref:function(a){drop(a)},
    __wbg_buffer_cf65c07de34b9a08:function(a){return add(at(a).buffer)},
    __wbg_newwithbyteoffsetandlength_3198d2b31342a8de:function(a,b,c){
      return add(new BigUint64Array(at(a),b>>>0,c>>>0));
    },
    __wbg_new_416322ec526e82c1:function(a){return add(new BigUint64Array(at(a)))},
    __wbindgen_throw:function(a,b){
      throw new Error(new TextDecoder().decode(new Uint8Array(wasm.memory.buffer).subarray(a,a+b)));
    },
    __wbindgen_memory:function(){return add(wasm.memory)}
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
   * @return {LatLonArray}
   */
  nearest(point){
    const [lon,lat]=Tree.__latlon(point);
    console.log(`lat: ${lat}, lon: ${lon}`);
    const ret=wasm.tree_nearest(this.ptr,lat,lon);
    const arr=new Float32Array(new BigUint64Array([BigInt.asUintN(64,ret)]).buffer);
    return [arr[1],arr[0]];
  }
  /**
   * @param {LatLon} point
   * @param {number} distance
   * @return {LatLonArray[]}
   */
  withinDistance(point, distance) {
    try{
      const [lon,lat]=Tree.__latlon(point);
      const r=wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_within_distance(r,this.ptr,lat,lon,distance);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0=mem[r/4];
      const r1=mem[r/4+1];
      const v0=new BigUint64Array(wasm.memory.buffer).subarray(r0/8,r0/8+r1);
      const w=new Array(v0.length);
      let i=0;
      const a=new BigUint64Array(1);
      for(const it of v0){
        a[0]=it;
        const b=new Float32Array(a.buffer);
        w[i++]=[b[1],b[0]];
      }
      wasm.__wbindgen_free(r0,r1*8);
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
      const flat=new BigUint64Array(wasm.memory.buffer).subarray(r0/8,r0/8+r1);
      const clusters=new Array(64);
      let i=0;
      const arr=new BigUint64Array(2);
      while(i<flat.length){
        const sub=flat.subarray(i+1,i+1+Number(flat[i]));
        i+=sub.length+1;
        const cluster=new Array(sub.length);
        for(const it of sub){
          arr[0]=it;
          const a=new Float32Array(arr.buffer);
          cluster.push([a[1],a[0]]);
        }
        clusters.push(cluster);
      }
      wasm.__wbindgen_free(r0,r1*8);
      return clusters;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
