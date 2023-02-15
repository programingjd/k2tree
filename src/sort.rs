use std::cmp::Ordering;
use crate::K2Point;

pub fn k2_sort_by<P: K2Point>(
    coords: &[P],
    indices: &mut [u32],
    k2_compare: impl Fn(P, P, usize) -> Ordering + Copy,
) {
    recurse(coords, indices, 0, k2_compare);
}

fn recurse<P: K2Point>(
    coords: &[P],
    indices: &mut [u32],
    axis: usize,
    k2_compare: impl Fn(P, P, usize) -> Ordering + Copy,
) {
    if indices.len() >= 2 {
        pdqselect::select_by(indices, indices.len() / 2, |x, y| k2_compare(coords[*x as usize], coords[*y as usize], axis));
        let mid = indices.len() / 2;
        let axis = (axis + 1) % 2;
        recurse(coords,&mut indices[..mid], axis, k2_compare);
        recurse(coords, &mut indices[mid + 1..], axis, k2_compare);
    }
}
