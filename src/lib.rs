mod nearest;
mod sort;
mod within;

use std::cmp::Ordering;
use nearest::*;
use sort::*;
use wasm_bindgen::prelude::wasm_bindgen;
use within::*;

#[wasm_bindgen]
pub fn build(points: Vec<u64>) -> Vec<u64> {
    K2Tree::build_by(points, |item1, item2, k| item1.get(k).total_cmp(&item2.get(k))).0
}

#[wasm_bindgen]
pub fn nearest(tree: Vec<u64>, lat: f32, lon: f32) -> u64 {
    let tree = K2Tree(tree);
    let point = Utils::from(lat, lon);
    tree.nearest(point, &Utils::geo_fast_distance_squared).unwrap().item
}

#[wasm_bindgen]
pub fn in_radius(tree: Vec<u64>, lat: f32, lon: f32, radius: f32) -> Vec<u64> {
    let tree = K2Tree(tree);
    let center = Utils::from(lat, lon);
    tree.within_radius(center, radius, &Utils::geo_fast_distance_squared)
}

impl K2Point for u64 {
    type Scalar = f32;
    fn get(&self, i: usize) -> Self::Scalar {
        let bytes = self.to_le_bytes();
        let slice: [u8;4] = match i {
            0 => [ bytes[0], bytes[1], bytes[2], bytes[3] ],
            1 => [ bytes[4], bytes[5], bytes[6], bytes[7] ],
            _ => unreachable!()
        };
        f32::from_le_bytes(slice)
    }
}

struct Utils {}
impl Utils {
    fn geo_fast_distance_squared(p1: u64, p2: u64) -> f32 {
        let lat1 = p1.get(0);
        let lat2 = p2.get(0);
        let lon1 = p1.get(1);
        let lon2 = p2.get(1);
        let x = lat2 - lat1;
        let y = (lon2 - lon1) * ((lat1+lat2)*0.00872664626f32).cos();
        12351.655f32 * (x*x+y*y)
    }
    fn from(lat: f32, lon: f32) -> u64 {
        let lo = lat.to_le_bytes();
        let hi = lon.to_le_bytes();
        u64::from_le_bytes([ lo[0], lo[1], lo[2], lo[3], hi[0], hi[1], hi[2], hi[3] ])
    }
}

pub trait K2Point: Copy {
    type Scalar: num_traits::NumAssign + Copy + PartialOrd;
    fn get(&self, size: usize) -> Self::Scalar;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ItemAndDistance<T, Scalar> {
    pub item: T,
    pub squared_distance: Scalar,
}

#[derive(Debug, PartialEq, Eq)]
pub struct K2Slice<T>([T]);
impl<T> std::ops::Deref for K2Slice<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        &self.0
    }
}

impl<P: K2Point> K2Slice<P> {
    pub fn items(&self) -> &[P] {
        &self.0
    }

    unsafe fn new_unchecked(items: &[P]) -> &Self {
        &*(items as *const _ as *const Self)
    }

    pub fn nearest(
        &self,
        query: P,
        distance_squared: &impl Fn(P, P) -> P::Scalar
    ) -> Option<ItemAndDistance<P, P::Scalar>> {
        if self.is_empty() {
            None
        } else {
            Some(k2_nearest(self.items(), query, distance_squared))
        }
    }

    pub fn within_by_cmp(&self, compare: impl Fn(P, usize) -> Ordering + Copy) -> Vec<P> {
        k2_within_by_cmp(self, compare)
    }

    pub fn within_radius(
        &self,
        query: P,
        radius: P::Scalar,
        distance_squared: &impl Fn(P, P) -> P::Scalar
    ) -> Vec<P> {
        let mut results = self.within_by_cmp(|item, k| {
            let coord = item.get(k);
            if coord < query.get(k) - radius {
                Ordering::Less
            } else if coord > query.get(k) + radius {
                Ordering::Greater
            } else {
                Ordering::Equal
            }
        });
        results.retain(|item| {
            distance_squared(*item, query) < radius * radius
        });
        results
    }
}

/// An owned kd-tree.
/// This type implements [`std::ops::Deref`] to [`KdSlice`].
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct K2Tree<P: K2Point>(Vec<P>);
impl<P: K2Point> std::ops::Deref for K2Tree<P> {
    type Target = K2Slice<P>;
    fn deref(&self) -> &Self::Target {
        unsafe { K2Slice::new_unchecked(&self.0) }
    }
}
impl<P: K2Point> AsRef<K2Slice<P>> for K2Tree<P> {
    fn as_ref(&self) -> &K2Slice<P> {
        self
    }
}
impl<P: K2Point> std::borrow::Borrow<K2Slice<P>> for K2Tree<P> {
    fn borrow(&self) -> &K2Slice<P> {
        self
    }
}
impl<P: K2Point> From<K2Tree<P>> for Vec<P> {
    fn from(src: K2Tree<P>) -> Self {
        src.0
    }
}
impl<P: K2Point> K2Tree<P> {
    pub fn build_by<F>(mut items: Vec<P>, compare: F) -> Self
    where
        F: Fn(P, P, usize) -> Ordering + Copy,
    {
        k2_sort_by(&mut items, compare);
        Self(items)
    }
}

