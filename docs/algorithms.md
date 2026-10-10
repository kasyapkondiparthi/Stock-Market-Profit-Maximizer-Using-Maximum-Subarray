# Algorithmic Foundations & Theoretical Analysis

## 1. Brute Force Approach

### Description
The Brute Force algorithm examines every possible starting index $i$ from $0$ to $n-1$ and ending index $j$ from $i$ to $n-1$. By accumulating the sum incrementally, it determines the maximum subarray sum in $\mathcal{O}(n^2)$ time instead of naive $\mathcal{O}(n^3)$.

### Complexity Analysis
- **Time Complexity**: $\mathcal{O}(n^2)$
  $$\sum_{i=0}^{n-1} \sum_{j=i}^{n-1} 1 = \sum_{i=0}^{n-1} (n - i) = \frac{n(n+1)}{2} = \Theta(n^2)$$
- **Auxiliary Space Complexity**: $\mathcal{O}(1)$

---

## 2. Kadane's Algorithm (Dynamic Programming)

### Description
Kadane's algorithm maintains the optimal solution $M[i]$ ending at index $i$.
$$M[i] = \max(\Delta P[i], M[i-1] + \Delta P[i])$$
The global maximum is $\max_{0 \le i < m} M[i]$.

### Complexity Analysis
- **Time Complexity**: $\mathcal{O}(n)$ (single linear traversal).
- **Auxiliary Space Complexity**: $\mathcal{O}(1)$ (only scalar variables maintained).

---

## 3. Divide and Conquer Approach

### Description
The Divide and Conquer algorithm partitions the array into two halves around the midpoint $\text{mid} = \lfloor (\text{low} + \text{high})/2 \rfloor$.
The maximum subarray must lie in one of three mutually exclusive locations:
1. Entirely in the left subarray $A[\text{low} \dots \text{mid}]$ (Recursive step).
2. Entirely in the right subarray $A[\text{mid}+1 \dots \text{high}]$ (Recursive step).
3. Crossing the midpoint $\text{mid}$ (Linear $\mathcal{O}(n)$ scan from mid leftwards and rightwards).

### Recurrence Relation & Master Theorem Proof
$$T(n) = 2T(n/2) + \Theta(n)$$
Using the **Master Theorem**:
$$T(n) = aT(n/b) + f(n)$$
- $a = 2$ (number of subproblems)
- $b = 2$ (factor by which subproblem size decreases)
- $f(n) = \Theta(n)$ (time to compute crossing subarray)
- $\log_b a = \log_2 2 = 1 \implies n^{\log_b a} = n^1 = n$

Since $f(n) = \Theta(n^{\log_b a}) = \Theta(n)$, **Case 2 of the Master Theorem** applies:
$$T(n) = \Theta(n^{\log_b a} \log n) = \Theta(n \log n)$$

- **Time Complexity**: $\mathcal{O}(n \log n)$
- **Space Complexity**: $\mathcal{O}(\log n)$ Call stack frame recursion depth.
