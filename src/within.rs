use crate::K2Point;
use std::cmp::Ordering;

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

pub fn k2_indices_within_by_cmp<P: K2Point>(
    k2tree: &[P],
    compare: impl Fn(P, usize) -> Ordering + Copy,
) -> Vec<usize> {
    let mut results = Vec::new();
    recurse2(&mut results, k2tree, 0, 0, compare);
    results
}

fn recurse2<P: K2Point>(
    results: &mut Vec<usize>,
    k2tree: &[P],
    offset: usize,
    axis: usize,
    compare: impl Fn(P, usize) -> Ordering + Copy,
) {
    if k2tree.is_empty() {
        return;
    }
    let axis = axis % 2;
    let (lower, item, upper) = {
        let mid = k2tree.len() / 2;
        (
            (offset, &k2tree[..mid]),
            (offset + mid, k2tree[mid]),
            (offset + mid + 1, &k2tree[mid + 1..]),
        )
    };
    match compare(item.1, axis) {
        Ordering::Equal => {
            if (1..2).all(|k| compare(item.1, (axis + k) % 2) == Ordering::Equal) {
                results.push(item.0);
            }
            recurse2(results, lower.1, lower.0, axis + 1, compare);
            recurse2(results, upper.1, upper.0, axis + 1, compare);
        }
        Ordering::Less => {
            recurse2(results, upper.1, upper.0, axis + 1, compare);
        }
        Ordering::Greater => {
            recurse2(results, lower.1, lower.0, axis + 1, compare);
        }
    }
}
