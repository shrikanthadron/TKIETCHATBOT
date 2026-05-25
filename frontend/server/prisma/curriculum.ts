/** Structured curriculum: chapters → topics → subtopics with lesson content */

export interface SubtopicData {
  title: string;
  description: string;
  content: string;
}

export interface TopicData {
  title: string;
  description: string;
  content: string;
  subtopics: SubtopicData[];
}

export interface ChapterData {
  title: string;
  description: string;
  topics: TopicData[];
}

export const CURRICULUM: Record<string, ChapterData[]> = {
  mathematics: [
    {
      title: "Algebra & Functions",
      description: "Equations, inequalities, and function basics",
      topics: [
        {
          title: "Quadratic Equations",
          description: "Solving and analyzing quadratic expressions",
          content:
            "Quadratic equations have the form ax² + bx + c = 0. The discriminant Δ = b² − 4ac determines the nature of roots: positive means two real roots, zero means one repeated root, negative means complex roots.",
          subtopics: [
            {
              title: "Factoring Method",
              description: "Splitting middle term and grouping",
              content:
                "To factor x² + 5x + 6, find two numbers that multiply to 6 and add to 5: 2 and 3. So (x + 2)(x + 3) = 0, giving roots x = −2 and x = −3. Always verify by expanding.",
            },
            {
              title: "Quadratic Formula",
              description: "Universal root formula",
              content:
                "x = (−b ± √(b² − 4ac)) / 2a. Example: for x² − 4x + 3 = 0, a=1, b=−4, c=3, Δ=16−12=4, roots x = (4±2)/2 → 3 and 1.",
            },
          ],
        },
        {
          title: "Sequences & Series",
          description: "AP, GP and summation",
          content:
            "Arithmetic progression (AP): aₙ = a₁ + (n−1)d, sum Sₙ = n/2 (2a₁ + (n−1)d). Geometric progression (GP): aₙ = a₁ r^(n−1), sum Sₙ = a₁(1−rⁿ)/(1−r) for r≠1.",
          subtopics: [
            {
              title: "Arithmetic Progression",
              description: "Constant difference sequences",
              content:
                "If a₁=3 and d=2, then 3, 5, 7, 9… The 10th term is a₁ + 9d = 21. Sum of first n terms links to average of first and last term times n.",
            },
            {
              title: "Geometric Progression",
              description: "Constant ratio sequences",
              content:
                "If a₁=2 and r=3, terms are 2, 6, 18, 54. For |r|<1, infinite GP sum converges to a₁/(1−r). Useful in compound interest and population models.",
            },
          ],
        },
      ],
    },
    {
      title: "Calculus",
      description: "Limits, derivatives, and integrals",
      topics: [
        {
          title: "Limits & Continuity",
          description: "Foundation of calculus",
          content:
            "A limit describes behavior as x approaches a value. lim(x→0) sin x / x = 1. A function is continuous at a if lim(x→a) f(x) = f(a).",
          subtopics: [
            {
              title: "Standard Limits",
              description: "Memorizable limit forms",
              content:
                "Key limits: lim sin x/x = 1, lim (1+x)^(1/x) = e, lim (a^x−1)/x = ln a. Use L'Hôpital's rule for 0/0 or ∞/∞ forms when direct substitution fails.",
            },
            {
              title: "Continuity Tests",
              description: "Checking breaks in graphs",
              content:
                "Removable discontinuity: hole in graph (limit exists ≠ value). Jump discontinuity: one-sided limits differ. Infinite discontinuity: vertical asymptote.",
            },
          ],
        },
        {
          title: "Differentiation",
          description: "Rates of change",
          content:
            "Derivative f′(x) = lim(h→0) [f(x+h)−f(x)]/h. Power rule: d/dx xⁿ = nxⁿ⁻¹. Product, quotient, and chain rules extend this to complex functions.",
          subtopics: [
            {
              title: "Power & Chain Rule",
              description: "Core derivative rules",
              content:
                "d/dx (3x⁴) = 12x³. Chain rule: d/dx f(g(x)) = f′(g(x))·g′(x). Example: d/dx sin(x²) = cos(x²)·2x.",
            },
            {
              title: "Applications of Derivatives",
              description: "Maxima, minima, tangents",
              content:
                "Critical points where f′=0 may be maxima or minima (test with f′′). Tangent slope at x=a is f′(a). Optimization: express quantity as function, find critical points in domain.",
            },
          ],
        },
      ],
    },
  ],
  physics: [
    {
      title: "Mechanics",
      description: "Motion, forces, and energy",
      topics: [
        {
          title: "Kinematics",
          description: "Motion without forces",
          content:
            "Displacement, velocity, and acceleration relate via v = u + at and s = ut + ½at². Projectile motion separates horizontal (constant v) and vertical (a = −g) components.",
          subtopics: [
            {
              title: "1D Motion Equations",
              description: "SUVAT equations",
              content:
                "For uniform acceleration: v² = u² + 2as. Graph slope of s–t gives v; slope of v–t gives a. Area under v–t graph gives displacement.",
            },
            {
              title: "Projectile Motion",
              description: "2D motion under gravity",
              content:
                "Range R = u² sin 2θ / g for level ground. Time of flight T = 2u sin θ / g. Maximum height H = u² sin²θ / 2g. Independence of horizontal and vertical motion is key.",
            },
          ],
        },
        {
          title: "Newton's Laws",
          description: "Force and momentum",
          content:
            "First law: inertia. Second: F = ma. Third: action-reaction pairs. Free-body diagrams isolate forces on one object; net force determines acceleration.",
          subtopics: [
            {
              title: "Free Body Diagrams",
              description: "Visualizing forces",
              content:
                "Draw weight mg downward, normal force perpendicular to surface, friction opposing motion. On incline, resolve weight parallel and perpendicular to plane.",
            },
            {
              title: "Friction & Tension",
              description: "Contact forces",
              content:
                "Static friction fs ≤ μsN; kinetic fk = μkN. Tension is same throughout ideal string. Pulley systems: constraint equations link accelerations of masses.",
            },
          ],
        },
      ],
    },
    {
      title: "Electromagnetism",
      description: "Electric and magnetic fields",
      topics: [
        {
          title: "Electrostatics",
          description: "Charges at rest",
          content:
            "Coulomb's law: F = k q₁q₂/r². Electric field E = F/q. Gauss's law relates flux to enclosed charge. Potential V is work per unit charge.",
          subtopics: [
            {
              title: "Coulomb's Law",
              description: "Force between point charges",
              content:
                "k ≈ 9×10⁹ N·m²/C². Like charges repel; unlike attract. Superposition: net force is vector sum of pairwise forces.",
            },
            {
              title: "Electric Field & Potential",
              description: "Field lines and equipotentials",
              content:
                "Field points from + to −. Uniform field between parallel plates E = V/d. Equipotential surfaces are perpendicular to field lines; no work moving charge along them.",
            },
          ],
        },
      ],
    },
  ],
  chemistry: [
    {
      title: "Physical Chemistry",
      description: "Atomic structure and bonding",
      topics: [
        {
          title: "Atomic Structure",
          description: "Electrons, orbitals, quantum numbers",
          content:
            "Bohr model: quantized orbits. Quantum model: orbitals from n, l, mₗ, mₛ. Aufbau principle fills lowest energy first; Pauli: max 2 electrons per orbital with opposite spin.",
          subtopics: [
            {
              title: "Electronic Configuration",
              description: "Filling orbitals",
              content:
                "Order: 1s 2s 2p 3s 3p 4s 3d… Chromium and copper have exceptions. Valence electrons determine chemical properties and periodic group behavior.",
            },
            {
              title: "Periodic Trends",
              description: "Radius, IE, electronegativity",
              content:
                "Atomic radius decreases across period, increases down group. Ionization energy generally increases across period. Electronegativity highest at top-right (F).",
            },
          ],
        },
        {
          title: "Chemical Bonding",
          description: "Ionic, covalent, metallic",
          content:
            "Ionic: electron transfer, lattice energy. Covalent: shared pairs; VSEPR predicts shape. Metallic: delocalized electrons conduct heat and electricity.",
          subtopics: [
            {
              title: "VSEPR Theory",
              description: "Molecular geometry",
              content:
                "Electron pairs repel; minimize repulsion. AB₂ linear, AB₃ trigonal planar, AB₄ tetrahedral. Lone pairs compress bond angles (H₂O bent ~104.5°).",
            },
            {
              title: "Hybridization",
              description: "sp, sp², sp³ orbitals",
              content:
                "Carbon sp³ in methane (tetrahedral), sp² in ethene (trigonal), sp in ethyne (linear). Explains equivalent bonds in symmetric molecules.",
            },
          ],
        },
      ],
    },
  ],
  biology: [
    {
      title: "Cell Biology",
      description: "Structure and function of cells",
      topics: [
        {
          title: "Cell Structure",
          description: "Organelles and their roles",
          content:
            "Prokaryotes lack nucleus; eukaryotes have membrane-bound organelles. Mitochondria produce ATP; ribosomes synthesize proteins; ER and Golgi process and ship molecules.",
          subtopics: [
            {
              title: "Prokaryotic vs Eukaryotic",
              description: "Comparing cell types",
              content:
                "Bacteria: no nucleus, cell wall often peptidoglycan, single circular DNA. Animal/plant cells: nucleus, mitochondria, ER, Golgi. Plants add chloroplasts and cell wall (cellulose).",
            },
            {
              title: "Mitochondria & Chloroplasts",
              description: "Energy organelles",
              content:
                "Mitochondria: aerobic respiration, inner membrane cristae, matrix has Krebs cycle enzymes. Chloroplasts: photosynthesis, thylakoids for light reactions, stroma for Calvin cycle.",
            },
          ],
        },
        {
          title: "Cell Division",
          description: "Mitosis and meiosis",
          content:
            "Mitosis produces identical diploid cells for growth/repair. Meiosis halves chromosome number for gametes; crossing over increases genetic diversity.",
          subtopics: [
            {
              title: "Mitosis Phases",
              description: "PMAT sequence",
              content:
                "Prophase: chromatin condenses. Metaphase: chromosomes align at equator. Anaphase: sister chromatids separate. Telophase: nuclei reform; cytokinesis splits cytoplasm.",
            },
            {
              title: "Meiosis Overview",
              description: "Reduction division",
              content:
                "Meiosis I separates homologous pairs; Meiosis II separates sister chromatids. Prophase I crossing over. Results in 4 haploid cells genetically unique.",
            },
          ],
        },
      ],
    },
  ],
  cs: [
    {
      title: "Programming Fundamentals",
      description: "Logic, complexity, and data",
      topics: [
        {
          title: "Data Structures",
          description: "Arrays, stacks, queues, trees",
          content:
            "Arrays offer O(1) index access. Stacks LIFO (push/pop); queues FIFO. Trees: hierarchical; BST property left < root < right. Hash tables average O(1) lookup.",
          subtopics: [
            {
              title: "Stacks & Queues",
              description: "Linear ADTs",
              content:
                "Stack uses: expression evaluation, undo, DFS. Queue uses: BFS, scheduling, buffering. Can implement with arrays or linked lists; watch overflow and empty conditions.",
            },
            {
              title: "Trees & BST",
              description: "Hierarchical storage",
              content:
                "BST search/insert average O(log n) if balanced; worst O(n) if skewed. Traversals: inorder (sorted for BST), preorder, postorder. AVL/red-black trees maintain balance.",
            },
          ],
        },
        {
          title: "Algorithms",
          description: "Sorting and searching",
          content:
            "Big-O describes growth rate. Merge sort O(n log n) stable. Quick sort average O(n log n). Binary search O(log n) on sorted array.",
          subtopics: [
            {
              title: "Sorting Algorithms",
              description: "Comparison-based sorts",
              content:
                "Bubble/insertion O(n²) simple. Merge sort divide-conquer O(n log n). Quick sort pivot partition; random pivot avoids worst cases on sorted input.",
            },
            {
              title: "Graph Traversal",
              description: "BFS and DFS",
              content:
                "BFS uses queue; shortest path in unweighted graphs. DFS uses stack/recursion; detects cycles, topological sort. Both O(V+E) with adjacency list.",
            },
          ],
        },
      ],
    },
  ],
};
