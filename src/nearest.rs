use crate::{ItemAndDistance, K2Point};

pub fn k2_nearest<P: K2Point>(
    k2tree: &[P],
    query: P,
    distance_squared: &impl Fn(P, P) -> P::Scalar
) -> ItemAndDistance<P, P::Scalar> {
    assert!(!k2tree.is_empty());
    let mut nearest = ItemAndDistance {
        item: k2tree[0],
        squared_distance: distance_squared(query, k2tree[0]),
    };
    recurse(&mut nearest, k2tree, query, 0, distance_squared);
    nearest
}

fn recurse<P: K2Point>(
    nearest: &mut ItemAndDistance<P, P::Scalar>,
    k2tree: &[P],
    query: P,
    axis: usize,
    distance_squared: &impl Fn(P, P) -> P::Scalar
) {
    let mid_idx = k2tree.len() / 2;
    let item = k2tree[mid_idx];
    let squared_distance = distance_squared(query, item);
    if squared_distance < nearest.squared_distance {
        nearest.item = item;
        nearest.squared_distance = squared_distance;
        use num_traits::Zero;
        if nearest.squared_distance.is_zero() {
            return;
        }
    }
    let mid_pos = item.get(axis);
    let [branch1, branch2] = if query.get(axis) < mid_pos {
        [&k2tree[..mid_idx], &k2tree[mid_idx + 1..]]
    } else {
        [&k2tree[mid_idx + 1..], &k2tree[..mid_idx]]
    };
    if !branch1.is_empty() {
        recurse(nearest, branch1, query, (axis + 1) % 2, distance_squared);
    }
    if !branch2.is_empty() {
        let diff = query.get(axis) - mid_pos;
        if diff * diff < nearest.squared_distance {
            recurse(nearest, branch2, query, (axis + 1) % 2, distance_squared);
        }
    }
}
