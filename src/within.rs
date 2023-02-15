use crate::K2Point;
use std::cmp::Ordering;

pub fn k2_within_by_cmp<P: K2Point>(
    coords: &[P],
    indices: &[u32],
    compare: impl Fn(P, usize) -> Ordering + Copy,
) -> Vec<u32> {
    let mut results = Vec::new();
    recurse(&mut results, coords, indices,0, compare);
    results
}

fn recurse<P: K2Point>(
    results: &mut Vec<u32>,
    coords: &[P],
    indices: &[u32],
    axis: usize,
    compare: impl Fn(P, usize) -> Ordering + Copy,
) {
    if indices.is_empty() {
        return;
    }
    let axis = axis % 2;
    let (lower, index, upper) = {
        let mid = indices.len() / 2;
        (&indices[..mid], indices[mid], &indices[mid + 1..])
    };
    match compare(coords[index as usize], axis) {
        Ordering::Equal => {
            if (1..2).all(|k| compare(coords[index as usize], (axis + k) % 2) == Ordering::Equal) {
                results.push(index);
            }
            recurse(results, coords, lower, axis + 1, compare);
            recurse(results, coords, upper, axis + 1, compare);
        }
        Ordering::Less => {
            recurse(results, coords, upper, axis + 1, compare);
        }
        Ordering::Greater => {
            recurse(results, coords, lower, axis + 1, compare);
        }
    }
}

