use std::cmp::Ordering;
use crate::K2Point;

pub fn k2_within_by_cmp<P: K2Point>(
    k2tree: &[P],
    compare: impl Fn(P, usize) -> Ordering + Copy,
) -> Vec<P> {
    let mut results = Vec::new();
    recurse(&mut results, k2tree, 0, compare);
    results
}

fn recurse<P: K2Point>(
    results: &mut Vec<P>,
    k2tree: &[P],
    axis: usize,
    compare: impl Fn(P, usize) -> Ordering + Copy,
) {
    if k2tree.is_empty() {
        return;
    }
    let axis = axis % 2;
    let (lower, item, upper) = {
        let mid = k2tree.len() / 2;
        (&k2tree[..mid], k2tree[mid], &k2tree[mid + 1..])
    };
    match compare(item, axis) {
        Ordering::Equal => {
            if (1..2).all(|k| compare(item, (axis + k) % 2) == Ordering::Equal) {
                results.push(item);
            }
            recurse(results, lower, axis + 1, compare);
            recurse(results, upper, axis + 1, compare);
        }
        Ordering::Less => {
            recurse(results, upper, axis + 1, compare);
        }
        Ordering::Greater => {
            recurse(results, lower, axis + 1, compare);
        }
    }
}
