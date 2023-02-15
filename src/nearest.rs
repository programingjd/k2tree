use crate::{IndexAndDistance, K2Point};

pub fn k2_nearest<P: K2Point>(
    coords: &[P],
    indices: &[u32],
    query: P,
    distance_squared: &impl Fn(P, P) -> P::Scalar
) -> IndexAndDistance<P::Scalar> {
    assert!(!indices.is_empty());
    let mut nearest = IndexAndDistance {
        index: indices[0],
        squared_distance: distance_squared(query, coords[0]),
    };
    recurse(&mut nearest, coords, indices, query, 0, distance_squared);
    nearest
}

fn recurse<P: K2Point>(
    nearest: &mut IndexAndDistance<P::Scalar>,
    coords: &[P],
    indices: &[u32],
    query: P,
    axis: usize,
    distance_squared: &impl Fn(P, P) -> P::Scalar
) {
    let mid_idx = indices.len() / 2;
    let index = indices[mid_idx];
    let item = coords[index as usize];
    let squared_distance = distance_squared(query, item);
    if squared_distance < nearest.squared_distance {
        nearest.index = index;
        nearest.squared_distance = squared_distance;
        use num_traits::Zero;
        if nearest.squared_distance.is_zero() {
            return;
        }
    }
    let mid_pos = item.get(axis);
    let [branch1, branch2] = if query.get(axis) < mid_pos {
        [&indices[..mid_idx], &indices[mid_idx + 1..]]
    } else {
        [&indices[mid_idx + 1..], &indices[..mid_idx]]
    };
    if !branch1.is_empty() {
        recurse(nearest, coords, branch1, query, (axis + 1) % 2, distance_squared);
    }
    if !branch2.is_empty() {
        let diff = query.get(axis) - mid_pos;
        if diff * diff < nearest.squared_distance {
            recurse(nearest, coords, branch2, query, (axis + 1) % 2, distance_squared);
        }
    }
}
