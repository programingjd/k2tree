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
    __wbindgen_object_drop_ref:function(arg0){
      drop(arg0);
    },
    __wbg_buffer_cf65c07de34b9a08:function(arg0){
      return add(at(arg0).buffer);
    },
    __wbg_newwithbyteoffsetandlength_3198d2b31342a8de:function(arg0,arg1,arg2){
      return add(new BigUint64Array(at(arg0),arg1>>>0,arg2>>>0));
    },
    __wbg_new_416322ec526e82c1:function(arg0) {
      return add(new BigUint64Array(at(arg0)));
    },
    __wbindgen_throw:function(arg0,arg1){
      throw new Error(new TextDecoder().decode(new Uint8Array(wasm.memory.buffer).subarray(arg0,arg0+arg1)));
    },
    __wbindgen_memory:function(){
      return add(wasm.memory);
    },
  }
};
const wasm=(await WebAssembly.instantiate(mod,imports)).exports;
console.log(wasm);

/**
 */
export class Tree {

  static __wrap(ptr) {
    const obj = Object.create(Tree.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    wasm.__wbg_tree_free(this.__destroy_into_raw());
  }
  /**
   * @param {BigUint64Array} points
   */
  constructor(points) {
    const p=wasm.__wbindgen_malloc(points.length*8);
    new BigUint64Array(wasm.memory.buffer).set(points,p/8);
    const ret = wasm.tree_new(p,points.length);
    return Tree.__wrap(ret);
  }
  /**
   * @param {number} lat
   * @param {number} lon
   * @returns {bigint}
   */
  nearest(lat, lon) {
    const ret = wasm.tree_nearest(this.ptr, lat, lon);
    return BigInt.asUintN(64, ret);
  }
  /**
   * @param {number} lat
   * @param {number} lon
   * @param {number} distance
   * @returns {BigUint64Array}
   */
  within_distance(lat, lon, distance) {
    try {
      const r = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_within_distance(r,this.ptr,lat,lon,distance);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0 = mem[r/4];
      const r1 = mem[r/4+1];
      const v0 = new BigUint64Array(wasm.memory.buffer).subarray(r0/8,r0/8+r1).slice();
      wasm.__wbindgen_free(r0,r1*8);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * @param {number} distance
   * @returns {(BigUint64Array)[]}
   */
  clusterify(distance) {
    try {
      const r = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.tree_clusterify(r, this.ptr, distance);
      const mem=new Int32Array(wasm.memory.buffer);
      const r0 = mem[r/4];
      const r1 = mem[r/4+1];
      const arr=new Uint32Array(wasm.memory.buffer).subarray(r0/4,r0/4+r1);
      const v0=new Array(arr.length);
      for(const i of arr){
        const it=at(i);
        v0.push(it);
        drop(i);
      }
      wasm.__wbindgen_free(r0,r1*4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
