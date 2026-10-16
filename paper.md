---
# JOSS paper for the Canals workbench — prepared 2026-10-17.
# Finalization steps before submission (see SUBMISSION_CHECKLIST.md):
#   1. Mint the Zenodo DOI (checklist step C) and uncomment/replace `archive-doi`.
#   2. Confirm author affiliation (Sana'a University vs. Iran University of
#      Science and Technology) and add co-authors if applicable.
#   3. Keep `date:` equal to the actual v1.4.0 release/submission date.
title: 'Canals: an open-source Python workbench for open-channel hydraulic design'
tags:
  - Python
  - open-channel flow
  - hydraulics
  - irrigation
  - hydraulic structures
  - water hammer
authors:
  - name: Abbas Ahmed Mohammed Hebah
    orcid: 0009-0000-5689-2157
    affiliation: 1
affiliations:
  - name: Sana'a University
    index: 1
date: 17 October 2026
bibliography: paper.bib
repository-code: https://github.com/darwishdasty-oss/Canals-
# archive-doi: 10.5281/zenodo.XXXXXXX   # <-- fill in after minting the Zenodo deposit
---

# Summary

Canals is a free, open-source workbench for the classical design tasks of open-channel hydraulics, released under the MIT license. It is written in Python 3 with a PySide6 multiple-document-interface (MDI) graphical shell and exposes the same functionality through a command-line interface (`canals-cli`) and an importable Python API. The workbench covers six coupled workflows: (1) optimal hydraulic section design for trapezoidal, rectangular, triangular, and circular channels with the Manning equation, critical and normal depths, and specific-energy analysis; (2) hydraulic structures, including sluice and radial gates with discharge coefficients and hydrostatic forces, siphons with an explicit cavitation-index check, and pressure breakers with automatic type selection; (3) regime design of silt-carrying earth canals by the Lacey and Kennedy theories side-by-side with a general Manning design; (4) gradually varied flow (GVF) profiles integrated with `scipy.integrate.solve_ivp` (RK45) and classified with the standard twelve-curve M/S/C/H/A scheme; (5) hydraulic jumps with Bélanger conjugate depths and selection of USBR Type I-IV stilling basins including appurtenance dimensions; and (6) water-hammer screening with the Korteweg wave speed, Joukowsky pressure rise, hoop stress, and pipeline safety factor.

All results can be exported as JSON, CSV, or PDF, and every CLI command emits structured JSON to standard output so that the tool can be embedded in scripted or batch workflows. The algorithm layer is covered by a suite of unit tests, including analytic gates such as the exact critical depth of a rectangular section and the Joukowsky pressure relation, and the suite runs in continuous integration on Linux, Windows, and macOS across Python 3.10-3.12 with offscreen Qt. Six standard design cases, pre-validated against hand calculations, ship in the README and the bundled user guide so that a new user can verify an installation in minutes. The package is the standalone open-channel component of the author's broader Cavitation and Channel Workbench; it shares no functionality with the companion Spillway Workbench, which covers the spillway-design and cavitation-analysis side of that project.

# Statement of need

The design of open channels -- irrigation canals, drainage ditches, and conveyance or floodway channels -- remains a daily task in hydraulic engineering practice and a core component of civil engineering curricula. The governing theories are classical and firmly established: uniform-flow resistance through the Manning equation [@manning1891]; regime design of silt-carrying earth canals through Kennedy's critical-velocity ratio [@kennedy1895] and Lacey's regime theory [@lacey1930]; gradually varied flow profiles and their standard twelve-curve classification [@chow1959; @henderson1966]; the Bélanger momentum relation for hydraulic jumps [@belanger1828] with the USBR stilling-basin layouts of *Design of Small Dams* [@usbr1987]; and transient surge screening through the Korteweg wave-speed and Joukowsky pressure-rise relations [@korteweg1878; @joukowsky1900; @simin1904]. These calculations decide the geometry, lining, energy dissipation, and structural safety of thousands of kilometres of canal networks, particularly in irrigation systems of water-scarce regions.

Despite this shared toolbox, the software landscape available to practitioners is fragmented. Commercial hydraulic suites bundle some of these calculations inside closed, licensed products whose implementations cannot be inspected or extended. General-purpose river models such as HEC-RAS address long-profile routing and two-dimensional hydraulics rather than optimal-section design, regime earth-canal design, stilling-basin selection, or pipe-surge screening. Spreadsheets, still the most common medium for these tasks in practice, are difficult to test, version, review, or integrate into reproducible pipelines, and small errors in cell formulas routinely propagate into design documents. To our knowledge, no maintained, open-source, cross-platform package brings these six classical workflows together behind both a graphical interface and a scriptable, machine-readable command line.

Canals fills this gap. Each workflow is implemented as an independently importable Python module with documented inputs and outputs, so the algorithms can be reused headlessly in larger analysis pipelines; the MDI shell and the CLI wrap exactly the same functions, which keeps the interactive and scripted paths from diverging. The GVF solver builds on SciPy's initial-value-problem machinery [@virtanen2020] rather than a bespoke integrator, and its normal-depth and critical-depth roots feed the twelve-curve classification directly. Correctness is addressed by construction and by evidence: the test suite asserts analytic gates -- the exact critical depth of a rectangular section and the Joukowsky surge of an idealised pipe -- alongside range and behaviour checks for gates, siphons, regime designs, jumps, and forms; the continuous-integration pipeline lints the code and runs the full suite on three operating systems and three Python versions before building the release binaries. Six standard cases with hand-verified expected values are documented in the repository, allowing reviewers and instructors to validate an installation without writing any code.

The package is intended for irrigation and drainage engineers preparing or reviewing channel designs, dam-safety and canal-inspection engineers who need a defensible, scriptable baseline, and educators teaching open-channel hydraulics who want students to experiment with section optimisation, regime theories, GVF profiles, jumps, and water hammer in a single free tool. It is distributed as the standalone open-channel component of the author's broader Cavitation and Channel Workbench project; the spillway-design and cavitation-analysis component is published separately as the Spillway Workbench, so the scopes of the two packages do not overlap.

# References
<!-- citations are rendered automatically from paper.bib -->
