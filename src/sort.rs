use std::cmp::Ordering;
use crate::K2Point;

pub fn k2_sort_by<P: K2Point>(
    items: &mut [P],
    k2_compare: impl Fn(P, P, usize) -> Ordering + Copy,
) {
    recurse(items, 0, k2_compare);
}

fn recurse<P: K2Point>(
    items: &mut [P],
    axis: usize,
    k2_compare: impl Fn(P, P, usize) -> Ordering + Copy,
) {
    if items.len() >= 2 {
        pdqselect::select_by(items, items.len() / 2, |x, y| k2_compare(*x, *y, axis));
        let mid = items.len() / 2;
        let axis = (axis + 1) % 2;
        recurse(&mut items[..mid], axis, k2_compare);
        recurse(&mut items[mid + 1..], axis, k2_compare);
    }
}
