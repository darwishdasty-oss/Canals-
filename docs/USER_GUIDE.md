# Canals Workbench — User Guide v1.4

A standalone Python 3 / PySide6 workbench for open-channel hydraulic design.

---

## 1. Quick Start

After installation, launch the GUI:

```bash
canals             # GUI mode
canals-cli --help  # CLI mode
```

The MDI shell opens with 6 menus along the top. The first form (Open Channel Design) opens automatically as a welcome screen.

**All input fields are free-form** — you can enter any value with no preset min/max limits. You can enter a 0.1 m wide ditch or a 100 m wide floodway.

## 2. The 6 Menus

### 2.1 Open Channel Design

The optimal hydraulic section design tool.

**Inputs:**
- Channel type: trapezoidal / rectangular / triangular / circular
- Geometry: bottom width b, side slope z, diameter D
- Flow: discharge Q, Manning n, bed slope S, initial depth y₀

**Action:** Click the big blue **"Optimal Section Design"** button.

**Output:** bottom width b, side slope z, depth y, area A, velocity V, hydraulic radius R, top width T. Cross-section drawn to scale.

**Standard test case:** Q = 15 m³/s, n = 0.025, S = 0.0008 → Trapezoidal: b = 2.88 m, z = 0.61, y = 2.55 m, A = 11.3 m², V = 1.33 m/s.

### 2.2 Hydraulic Structures

3 tabs:

**Gates:**
- Sluice / radial gate selector
- Inputs: Q, H_up, H_down, b (gate width), a (gate opening)
- Outputs: discharge coefficient Cd, hydrostatic force F, lifting force
- For Q=15, H_up=4, H_down=1, b=3, a=0.4: Cd = 0.58, F = 573 kN

**Siphons:**
- Inputs: pipe length L, diameter D, wall thickness e, friction factor f, gradient g, height h, deflection Δz
- Outputs: head loss, σ_siphon cavitation index, risk flag

**Pressure Breakers:**
- Inputs: Q, V, y, Fr
- Output: recommended breaker type (stilling well / impact basin / cascade)

### 2.3 Earth Canal Design

Three classical theories for silt-stable earth canal design.

**Lacey (1930):** Empirical silt theory widely used in India and Pakistan.
y = 1.3·(f²·Q/2)^(1/3), b = 4.83·√Q.

**Kennedy (1895):** Critical velocity ratio (CVR). V_0 = 0.84·D^0.64.

**Manning:** Most general. Q = (1/n)·A·R^(2/3)·S^(1/2), solved iteratively.

4 buttons: Lacey / Kennedy / Manning / Side-by-Side Compare. Pick the most conservative (deepest) design.

**Standard test case (Lacey):** Q = 15, f = 1, z = 0.5 → y = 5.21 m, b = 4.32 m, A = 49.7 m², V = 0.30 m/s.

### 2.4 Flow Profile Analyzer

Solves the GVF equation dy/dx = (S₀ - S_f)/(1 - Fr²) using scipy.integrate.solve_ivp (RK45).

Supports rectangular, trapezoidal, triangular, and circular sections. Computes:
- Critical depth y_c (where Fr = 1)
- Normal depth y_n (where S_f = S_0)
- Classifies flow regime using the standard 12-curve classification:
  - Mild slope (M1, M2, M3) — S < S_c
  - Steep slope (S1, S2, S3) — S > S_c
  - Critical slope (C1, C3) — S = S_c
  - Horizontal (H2, H3) — S = 0
  - Adverse (A2, A3) — S < 0

**Standard test case:** Q = 15, S = 0.0008, b = 5, y_0 = 2.5, L = 1000 → y_c = 0.97 m, y_n = 2.34 m, mild slope M1 curve.

### 2.5 Hydraulic Jump + Stilling Basin

Computes the conjugate depth y₂ using Bélanger:
y₂/y₁ = ½(√(1+8·Fr₁²)-1)

Energy loss: ΔE = (y₂-y₁)³/(4·y₁·y₂)
Jump length: L_j = 6.1·y₂ (USBR empirical)

USBR stilling basin selection:
- Fr₁ > 9.0 → Type I (strong)
- 4.5 < Fr₁ ≤ 9.0 → Type II or IV
- 2.5 < Fr₁ ≤ 4.5 → Type III (oscillating)
- Fr₁ ≤ 2.5 → Type IV (weak)
- S₀ > 0.05 → Sloped basin

Appurtenance dimensions:
- Chute blocks: h = y₁
- Baffle blocks: h = y₂/2
- End sill: h = y₂/3.3
- Basin length: L = 6.1·y₂

**Standard test case:** V = 8 m/s, y = 0.5 m, b = 5 m → Fr₁ = 3.61, y₂ = 2.32 m, USBR Type III basin, L = 7.46 m, baffle = 1.16 m, end sill = 0.69 m.

### 2.6 Water Hammer Analyzer

Computes:
- **Wave speed (Korteweg):** a = √((K/ρ) / (1 + (K·D/(E·e))·C))
- **Critical closure time:** t_c = 2L/a
- **Joukowsky pressure rise:** ΔP = ρ·a·ΔV
- **Hoop stress (thin-wall):** σ_h = pD/(2e)
- **Safety factor:** SF = σ_y/σ_h

Material preset auto-fills E, ν, σ_y:
- Steel: E = 200 GPa, ν = 0.30, σ_y = 400 MPa
- Ductile Iron: E = 170 GPa, ν = 0.28, σ_y = 300 MPa
- PVC: E = 3 GPa, ν = 0.40, σ_y = 50 MPa
- HDPE: E = 0.8 GPa, ν = 0.45, σ_y = 25 MPa
- Concrete: E = 30 GPa, ν = 0.20, σ_y = 30 MPa

Engineering recommendations based on SF:
- SF > 2.0: Acceptable
- 1.5 < SF < 2.0: Add surge protection
- SF < 1.5: Redesign pipe or add air valves

**Standard test case:** L = 1500 m, D = 0.6 m, e = 0.012 m, V = 2.5 m/s, t_c = 0.2 s, Steel → a = 1210.9 m/s, ΔP = 30.3 bar, σ_h = 75.6 MPa, SF = 3.30.

## 3. CLI Mode

All 6 forms have CLI equivalents. Output is JSON to stdout.

```bash
canals-cli open-channel --Q 15 --n 0.025 --S 0.0008
canals-cli earth-canal --Q 15 --method lacey --f 1.0
canals-cli flow-profile --Q 15 --b 5 --S 0.0008 --n 0.015 --y0 2.5
canals-cli hydraulic-jump --V1 8 --y1 0.5 --b 5
canals-cli water-hammer --L 1500 --D 0.6 --e 0.012 --V 2.5 --t_c 0.2
canals-cli structures --type sluice --Q 15 --H_up 4 --b 3 --a 0.4
```

Use for batch processing, scripting, integration with other tools.

## 4. Reports

The Reports menu generates:
- **PDF report** — multi-page with cover, charts, and tables
- **JSON export** — full structured output
- **CSV export** — flat table for spreadsheets

## 5. Frequently Asked Questions

### Can I enter any value into the form fields?

Yes. All input fields are free-form — no min/max constraints. You can enter a 0.1 m wide ditch or a 100 m wide floodway.

### How do I run the CLI?

After `pip install canals-workbench`:

```bash
canals-cli open-channel --Q 15 --n 0.025 --S 0.0008
```

### What's the difference between Canals Workbench and CCW v1.4?

CCW v1.4 = Cavitation & Channel Workbench = spillway cavitation analysis + Canals + bridge. Canals Workbench is just the open-channel design half, decoupled. If you also need spillway cavitation analysis, use CCW.

### Why open source (MIT)?

Because hydraulic engineering code should be auditable, reproducible, and free for the global community to improve.

## 6. License

MIT — see LICENSE file.

## 7. Author

Abbas A. Hebah, M.Sc. — Ph.D. Candidate, Department of Civil Engineering, Iran University of Science and Technology. abbas74.hebah@gmail.com
