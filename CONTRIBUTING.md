# Contributing to Canals

Thank you for considering a contribution to the Canals open-channel design workbench.
Contributions of all kinds are welcome: bug reports, documentation improvements,
new validation cases, and code for the six design modules or the CLI.

## How to report a bug or request a feature

1. Open an issue at <https://github.com/darwishdasty-oss/Canals-/issues>.
2. Use a short, descriptive title and state the expected result, the actual
   result, and the input values (Q, n, S, geometry, ...).
3. If the discrepancy concerns a standard design case, quote the reference
   (e.g. Chow 1959, USBR *Design of Small Dams* 1987) and the page or table.

## Development setup

```bash
git clone https://github.com/darwishdasty-oss/Canals-.git
cd Canals-
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
pip install PySide6 numpy scipy matplotlib reportlab pytest ruff black
```

## Running the tests

```bash
python -m unittest discover tests -v      # unittest
# or: pytest tests/
```

On headless Linux systems set `QT_QPA_PLATFORM=offscreen` before running the
form-import tests. The same suite runs on Linux, Windows, and macOS across
Python 3.10-3.12 in the repository's continuous integration; please make sure
`pytest` (or `python -m unittest discover tests`) passes locally before
opening a pull request.

## Code style

- Format with `black` and lint with `ruff check canals/ tests/ canals_mdi.py`
  — the CI workflow enforces both.
- Keep every design module (`canals/open_channel.py`, `structures.py`,
  `earth_canal.py`, `flow_profile.py`, `hydraulic_jump.py`, `water_hammer.py`)
  importable without a running display; GUI code belongs in `canals/ui/`.
- New or changed numerical behaviour must be accompanied by tests. Analytic
  gates (exact closed-form solutions) are preferred where they exist.
- When adding a feature backed by a published method, cite the source in the
  docstring and, where appropriate, in the user guide.

## Pull requests

1. Fork the repository and create a topic branch from `main`.
2. Keep commits focused; reference the issue number in the pull request.
3. Describe what changed and why, and list the test cases you ran.
4. All contributions are made under the MIT license that covers the project.
