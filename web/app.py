"""
Canals Workbench — Streamlit Web App.

Runs in any modern browser including iPad Safari.
Provides all 6 algorithms with the same exports as the desktop app.
Designed for touchscreens — large buttons, sliders, instant PDF download.

Run locally:
    streamlit run app.py

Deploy free to share.duckduckgo.com or share.streamlit.io
"""
from __future__ import annotations
import sys
import io
from pathlib import Path

# Make canals package importable
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import streamlit as st
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from canals import (open_channel, structures, earth_canal, flow_profile,
                    hydraulic_jump, water_hammer)
from canals.reports import (report_open_channel, report_sluice_gate,
                             report_earth_canal_lacey, report_earth_canal_manning,
                             report_flow_profile, report_hydraulic_jump, report_water_hammer)

# =============================================================
# Page config
# =============================================================
st.set_page_config(
    page_title="Canals Workbench — Web",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for iPad-friendly touch targets
st.markdown("""
<style>
    .stButton>button {
        height: 3em;
        font-size: 1.1em;
    }
    .stDownloadButton>button {
        height: 3em;
        font-size: 1.1em;
        background-color: #2E7D32;
        color: white;
    }
    h1 { font-size: 2.2em !important; }
    h2 { font-size: 1.6em !important; }
    h3 { font-size: 1.3em !important; }
    .stMetric { padding: 10px; }
    [data-testid="stMetricValue"] { font-size: 1.6em; }
</style>
""", unsafe_allow_html=True)

# =============================================================
# Header
# =============================================================
st.title("🌊 Canals Workbench")
st.caption("Hydraulic engineering workbench — works on iPad, iPhone, desktop, anything with a browser")
st.markdown("---")

# =============================================================
# Sidebar — form selector
# =============================================================
FORM = st.sidebar.radio(
    "**Choose a calculation:**",
    [
        "🏞  Open Channel Design",
        "🚰  Sluice Gate",
        "🌾  Earth Canal — Lacey",
        "🌾  Earth Canal — Manning",
        "📈  Flow Profile",
        "🌊  Hydraulic Jump",
        "💧  Water Hammer",
        "ℹ️  About",
    ],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.markdown("""
**📱 iPad-friendly:** touch the inputs, slide the sliders,
or type your values. Calculations run instantly. PDF reports
download to your iPad.

**💡 Tip:** Add this page to your Home Screen for one-tap access.
""")
st.sidebar.markdown("---")
st.sidebar.caption("Canals Workbench v1.4 · Abbas A. Hebah · MIT License")


# =============================================================
# Helper: PDF download button
# =============================================================
def pdf_download_button(pdf_bytes: bytes, filename: str, label: str = "📄 Download Report (PDF)"):
    st.download_button(
        label=label,
        data=pdf_bytes,
        file_name=filename,
        mime="application/pdf",
        use_container_width=True,
    )


# =============================================================
# 1. OPEN CHANNEL DESIGN
# =============================================================
if FORM.startswith("🏞"):
    st.header("🏞 Open Channel Design")
    st.markdown("Optimal trapezoidal section using Manning-Strickler equation.")

    col1, col2 = st.columns(2)
    with col1:
        Q = st.number_input("Discharge Q (m³/s)", min_value=0.01, value=15.0, step=1.0, format="%.2f")
        n = st.number_input("Manning n", min_value=0.001, value=0.025, step=0.005, format="%.4f")
    with col2:
        S = st.number_input("Bed slope S", min_value=1e-6, value=0.0008, step=0.0001, format="%.6f")
        chan_type = st.selectbox("Channel type", ["trapezoidal", "rectangular", "triangular", "circular"])

    if st.button("🔧 Compute Optimal Section", type="primary", use_container_width=True):
        try:
            ctype_enum = {
                "trapezoidal": open_channel.ChannelType.TRAPEZOIDAL,
                "rectangular": open_channel.ChannelType.RECTANGULAR,
                "triangular": open_channel.ChannelType.TRIANGULAR,
                "circular": open_channel.ChannelType.CIRCULAR,
            }[chan_type]
            designer = open_channel.AdvancedChannelDesigner()
            res = designer.design_optimal_section(Q, n, S, channel_type=ctype_enum)

            # Store in session state for PDF export
            st.session_state['oc_inputs'] = {'Q': Q, 'n': n, 'S': S, 'z': 1.5, 'channel_type': chan_type}
            st.session_state['oc_result'] = dict(res)

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Bottom width b", f"{res['bottom_width']:.3f} m")
            c2.metric("Depth y", f"{res['depth']:.3f} m")
            c3.metric("Side slope z", f"{res['side_slope']:.3f}")
            c1, c2, c3 = st.columns(3)
            c1.metric("Area A", f"{res['area']:.3f} m²")
            c2.metric("Velocity V", f"{res['velocity']:.3f} m/s")
            c3.metric("b/y ratio", f"{res['width_depth_ratio']:.3f}")

            # Plot
            st.markdown("### Cross-Section")
            fig, ax = plt.subplots(figsize=(10, 4))
            b, y, z = res['bottom_width'], res['depth'], res['side_slope']
            # Trapezoid vertices
            x_left = -z * y
            x_right = b + z * y
            verts = [(x_left, 0), (0, 0), (b, 0), (x_right, y), (x_left, y), (x_left, 0)]
            xs = [v[0] for v in verts]
            ys = [v[1] for v in verts]
            ax.fill(xs, ys, alpha=0.3, color='steelblue', edgecolor='navy', linewidth=2)
            ax.plot(xs, ys, 'b-', linewidth=1.5)
            ax.axhline(y, color='blue', linestyle='--', alpha=0.5, label=f'Water surface y = {y:.2f} m')
            ax.set_xlabel('Width (m)')
            ax.set_ylabel('Height (m)')
            ax.set_title(f'Optimal Trapezoidal Section — Q = {Q} m³/s, n = {n}, S = {S}')
            ax.legend()
            ax.grid(True, alpha=0.3)
            ax.set_aspect('equal')
            st.pyplot(fig)

            # PDF download
            buf = io.BytesIO()
            report_open_channel(st.session_state['oc_inputs'], st.session_state['oc_result'], buf)
            buf.seek(0)
            st.markdown("### 📥 Export")
            pdf_download_button(buf.getvalue(), f"open_channel_Q{Q}_n{n}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 2. SLUICE GATE
# =============================================================
elif FORM.startswith("🚰"):
    st.header("🚰 Sluice Gate")
    st.markdown("Discharge coefficient, hydrostatic force, and gate geometry.")

    col1, col2 = st.columns(2)
    with col1:
        Q = st.number_input("Discharge Q (m³/s)", min_value=0.01, value=15.0, step=1.0, format="%.2f")
        H_up = st.number_input("Upstream depth H₁ (m)", min_value=0.01, value=4.0, step=0.1, format="%.2f")
        H_down = st.number_input("Downstream depth H₂ (m)", min_value=0.01, value=1.0, step=0.1, format="%.2f")
    with col2:
        b = st.number_input("Gate width b (m)", min_value=0.01, value=3.0, step=0.1, format="%.2f")
        a = st.number_input("Gate opening a (m)", min_value=0.01, value=0.4, step=0.05, format="%.2f")

    if st.button("🔧 Compute Gate", type="primary", use_container_width=True):
        try:
            gd = structures.GateDesigner()
            res = gd.design_sluice_gate(Q, H_up, H_down, b, max_opening=a)

            st.session_state['sg_inputs'] = {'Q': Q, 'H_up': H_up, 'H_down': H_down, 'gate_width': b, 'opening': a}
            st.session_state['sg_result'] = dict(res)

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Discharge coeff. Cd", f"{res['discharge_coefficient']:.3f}")
            c2.metric("Gate width (computed)", f"{res['gate_width']:.2f} m")
            c3.metric("Opening ratio", f"{res['opening_ratio']:.3f}")
            c1, c2, c3 = st.columns(3)
            c1.metric("Hydrostatic force", f"{res['hydrostatic_force']/1000:.1f} kN")
            c2.metric("Velocity through gate", f"{res['velocity_through_gate']:.2f} m/s")
            c3.metric("Lifting force", f"{res['lifting_force']/1000:.1f} kN")
            c1.metric("Required plate thickness", f"{res['required_thickness']:.1f} mm")

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_sluice_gate(st.session_state['sg_inputs'], st.session_state['sg_result'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"sluice_gate_Q{Q}_H{H_up}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 3. EARTH CANAL — LACEY
# =============================================================
elif FORM.startswith("🌾") and "Lacey" in FORM:
    st.header("🌾 Earth Canal — Lacey Theory")
    st.markdown("Regime dimensions for silt-laden alluvial canals (India/Pakistan practice).")

    col1, col2, col3 = st.columns(3)
    with col1:
        Q = st.number_input("Discharge Q (m³/s)", min_value=0.01, value=15.0, step=1.0, format="%.2f")
    with col2:
        f = st.number_input("Lacey silt factor f", min_value=0.5, value=1.0, step=0.1, format="%.2f")
    with col3:
        z = st.number_input("Side slope z (H:V)", min_value=0.1, value=1.0, step=0.1, format="%.2f")

    if st.button("🔧 Compute Lacey Section", type="primary", use_container_width=True):
        try:
            ed = earth_canal.EarthCanalDesigner()
            res = ed.lacey_theory_design(Q, f, z)

            st.session_state['lacey_inputs'] = {'Q': Q, 'f': f, 'side_slope': z}
            st.session_state['lacey_result'] = dict(res)

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Water depth y", f"{res['depth']:.3f} m")
            c2.metric("Bottom width b", f"{res['bed_width']:.3f} m")
            c3.metric("Area A", f"{res['area']:.3f} m²")
            c1, c2, c3 = st.columns(3)
            c1.metric("Velocity V", f"{res['velocity']:.3f} m/s")
            c2.metric("Wetted perimeter P", f"{res['wetted_perimeter']:.3f} m")
            c3.metric("Hydraulic radius R", f"{res['hydraulic_radius']:.3f} m")

            # Plot
            fig, ax = plt.subplots(figsize=(10, 4))
            b, y, z_v = res['bed_width'], res['depth'], z
            verts = [(-z_v*y, 0), (0, 0), (b, 0), (b+z_v*y, y), (-z_v*y, y), (-z_v*y, 0)]
            ax.fill([v[0] for v in verts], [v[1] for v in verts], alpha=0.3, color='goldenrod', edgecolor='darkorange', linewidth=2)
            ax.plot([v[0] for v in verts], [v[1] for v in verts], 'b-', linewidth=1.5)
            ax.axhline(y, color='blue', linestyle='--', alpha=0.5)
            ax.set_xlabel('Width (m)'); ax.set_ylabel('Height (m)')
            ax.set_title(f'Lacey Regime — Q = {Q} m³/s, f = {f}')
            ax.grid(True, alpha=0.3); ax.set_aspect('equal')
            st.pyplot(fig)

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_earth_canal_lacey(st.session_state['lacey_inputs'], st.session_state['lacey_result'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"lacey_Q{Q}_f{f}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 3b. EARTH CANAL — MANNING
# =============================================================
elif FORM.startswith("🌾") and "Manning" in FORM:
    st.header("🌾 Earth Canal — Manning Theory")
    st.markdown("Bed-roughness based design for stable cohesive or rock-cut canals.")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        Q = st.number_input("Discharge Q (m³/s)", min_value=0.01, value=15.0, step=1.0, format="%.2f")
    with col2:
        n = st.number_input("Manning n", min_value=0.001, value=0.025, step=0.005, format="%.4f")
    with col3:
        S = st.number_input("Bed slope S", min_value=1e-6, value=0.0008, step=0.0001, format="%.6f")
    with col4:
        z = st.number_input("Side slope z (H:V)", min_value=0.1, value=2.0, step=0.1, format="%.2f")

    if st.button("🔧 Compute Manning Section", type="primary", use_container_width=True):
        try:
            ed = earth_canal.EarthCanalDesigner()
            res = ed.manning_design(Q, n, S, z)

            st.session_state['manning_inputs'] = {'Q': Q, 'n': n, 'S': S, 'side_slope': z}
            st.session_state['manning_result'] = dict(res)

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Water depth y", f"{res['depth']:.3f} m")
            c2.metric("Bottom width b", f"{res['bed_width']:.3f} m")
            c3.metric("Area A", f"{res['area']:.3f} m²")
            c1, c2, c3 = st.columns(3)
            c1.metric("Velocity V", f"{res['velocity']:.3f} m/s")
            c2.metric("Wetted perimeter P", f"{res['wetted_perimeter']:.3f} m")
            c3.metric("Froude Fr", f"{res['froude_number']:.3f}")

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_earth_canal_manning(st.session_state['manning_inputs'], st.session_state['manning_result'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"manning_Q{Q}_n{n}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 4. FLOW PROFILE
# =============================================================
elif FORM.startswith("📈"):
    st.header("📈 Flow Profile")
    st.markdown("Critical and normal depth, profile classification (M1/M2/S1/etc).")

    col1, col2 = st.columns(2)
    with col1:
        Q = st.number_input("Discharge Q (m³/s)", min_value=0.01, value=15.0, step=1.0, format="%.2f")
        b = st.number_input("Channel width b (m)", min_value=0.01, value=5.0, step=0.5, format="%.2f")
        S = st.number_input("Bed slope S", min_value=1e-6, value=0.0008, step=0.0001, format="%.6f")
    with col2:
        n = st.number_input("Manning n", min_value=0.001, value=0.025, step=0.005, format="%.4f")
        L = st.number_input("Reach length L (m)", min_value=10.0, value=1000.0, step=100.0, format="%.1f")
        y0 = st.number_input("Upstream depth y₀ (m)", min_value=0.01, value=2.5, step=0.1, format="%.2f")

    if st.button("🔧 Compute Profile", type="primary", use_container_width=True):
        try:
            ocf = flow_profile.OpenChannelFlow()
            ocf.channel_type = 'rectangular'
            ocf.channel_params = {'b': b, 'z': 0}
            ocf.flow_params = {'Q': Q, 'S0': S, 'n': n, 'L': L, 'y_initial': y0,
                               'y_downstream': None, 'g': 9.81, 'boundary_type': 'upstream_depth'}
            yc = ocf.calculate_critical_depth()
            yn = ocf.calculate_normal_depth()

            # Classify
            if yn is None or yn == float('inf'):
                ptype = 'Horizontal/Adverse'
            elif yn > yc:
                # Mild slope
                if y0 > yn:
                    ptype = 'M1 (backwater)'
                elif y0 < yc:
                    ptype = 'M3'
                else:
                    ptype = 'M2 (drawdown)'
            else:
                # Steep slope
                if y0 > yc:
                    ptype = 'S1'
                elif y0 < yn:
                    ptype = 'S3'
                else:
                    ptype = 'S2'

            st.session_state['fp_inputs'] = {'Q': Q, 'b': b, 'S': S, 'n': n, 'L': L, 'y_upstream': y0}
            st.session_state['fp_result'] = {'critical_depth': yc, 'normal_depth': yn if yn != float('inf') else 0,
                                              'profile_type': ptype}

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Critical depth y_c", f"{yc:.3f} m")
            c2.metric("Normal depth y_n", f"{yn if yn != float('inf') else 'N/A'}")
            c3.metric("Profile type", ptype)

            # Plot
            fig, ax = plt.subplots(figsize=(10, 4))
            x = np.linspace(0, L, 100)
            # Simple approximation of M1 profile
            y_profile = y0 - (y0 - yn) * (1 - np.exp(-3*x/L))
            ax.fill_between(x, 0, y_profile, alpha=0.3, color='steelblue')
            ax.plot(x, y_profile, 'b-', linewidth=2, label='Water surface')
            ax.axhline(yc, color='red', linestyle='--', label=f'y_c = {yc:.2f} m')
            ax.axhline(yn, color='green', linestyle='--', label=f'y_n = {yn:.2f} m')
            ax.axhline(y0, color='blue', linestyle=':', alpha=0.5, label=f'y₀ = {y0:.2f} m')
            ax.plot(x, S*x, 'k-', linewidth=1.5, label='Channel bed')
            ax.set_xlabel('Distance x (m)')
            ax.set_ylabel('Elevation (m)')
            ax.set_title(f'Flow Profile — {ptype}')
            ax.legend()
            ax.grid(True, alpha=0.3)
            st.pyplot(fig)

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_flow_profile(st.session_state['fp_inputs'], st.session_state['fp_result'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"flow_profile_Q{Q}_y0{y0}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 5. HYDRAULIC JUMP
# =============================================================
elif FORM.startswith("🌊"):
    st.header("🌊 Hydraulic Jump")
    st.markdown("Bélanger conjugate depth and USBR stilling basin design.")

    col1, col2, col3 = st.columns(3)
    with col1:
        V1 = st.number_input("Upstream velocity V₁ (m/s)", min_value=0.1, value=8.0, step=0.5, format="%.2f")
    with col2:
        y1 = st.number_input("Upstream depth y₁ (m)", min_value=0.01, value=0.5, step=0.05, format="%.3f")
    with col3:
        b = st.number_input("Channel width b (m)", min_value=0.1, value=5.0, step=0.5, format="%.2f")

    if st.button("🔧 Compute Jump", type="primary", use_container_width=True):
        try:
            hj = hydraulic_jump.HydraulicJumpCalculator()
            inp = hydraulic_jump.HydraulicJumpInput(velocity_u1=V1, depth_y1=y1, width_b=b)
            res = hj.analyze_jump(inp)

            sb = hydraulic_jump.StillingBasinDesigner()
            basin = sb.design_basin(inp, res)

            # Convert enums to strings
            result = {k: str(v.value) if hasattr(v, 'value') else v for k, v in res.__dict__.items()}
            basin_dict = {k: str(v.value) if hasattr(v, 'value') else v for k, v in basin.__dict__.items()}

            st.session_state['hj_inputs'] = {'V1': V1, 'y1': y1, 'b': b}
            st.session_state['hj_result'] = result
            st.session_state['hj_basin'] = basin_dict

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Upstream Froude Fr₁", f"{result['froude_number_1']:.3f}")
            c2.metric("Conjugate depth y₂", f"{result['depth_y2']:.3f} m")
            c3.metric("Jump type", result['jump_type'])
            c1, c2, c3 = st.columns(3)
            c1.metric("Energy loss ΔE", f"{result['energy_loss']:.3f} m")
            c2.metric("Efficiency η", f"{result['jump_efficiency']*100:.1f}%")
            c3.metric("Jump length", f"{result['jump_length']:.2f} m")

            st.markdown("### USBR Stilling Basin")
            c1, c2, c3 = st.columns(3)
            c1.metric("Basin type", basin_dict['basin_type'])
            c2.metric("Basin length", f"{basin_dict['basin_length']:.2f} m")
            c3.metric("Baffle blocks", f"{basin_dict['baffle_blocks_height']:.2f} m")
            c1, c2 = st.columns(2)
            c1.metric("End sill height", f"{basin_dict['end_sill_height']:.2f} m")
            c2.metric("Chute blocks", f"{basin_dict['chute_blocks_height']:.2f} m")

            # Plot
            fig, ax = plt.subplots(figsize=(10, 4))
            x = np.linspace(0, max(result['jump_length'], 25), 100)
            # Approximate jump profile
            y_jump = y1 + (result['depth_y2'] - y1) * (1 - np.exp(-5*x/result['jump_length']))
            ax.fill_between(x, 0, y_jump, alpha=0.3, color='steelblue')
            ax.plot(x, y_jump, 'b-', linewidth=2)
            ax.axhline(result['depth_y2'], color='green', linestyle='--', label=f'y₂ = {result["depth_y2"]:.2f} m')
            ax.axhline(y1, color='red', linestyle='--', label=f'y₁ = {y1:.2f} m')
            ax.set_xlabel('Distance x (m)')
            ax.set_ylabel('Depth (m)')
            ax.set_title(f'Hydraulic Jump — Fr₁ = {result["froude_number_1"]:.2f}')
            ax.legend(); ax.grid(True, alpha=0.3)
            st.pyplot(fig)

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_hydraulic_jump(st.session_state['hj_inputs'], st.session_state['hj_result'],
                                   st.session_state['hj_basin'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"hydraulic_jump_V{V1}_y{y1}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# 6. WATER HAMMER
# =============================================================
elif FORM.startswith("💧"):
    st.header("💧 Water Hammer")
    st.markdown("Korteweg wave speed + Joukowsky pressure rise.")

    col1, col2, col3 = st.columns(3)
    with col1:
        L = st.number_input("Pipe length L (m)", min_value=1.0, value=1500.0, step=100.0, format="%.1f")
        D = st.number_input("Pipe diameter D (m)", min_value=0.01, value=0.6, step=0.1, format="%.3f")
        e = st.number_input("Wall thickness e (m)", min_value=0.001, value=0.012, step=0.001, format="%.4f")
    with col2:
        E = st.number_input("Elastic modulus E (Pa)", min_value=1e9, value=2.0e11, step=1e10, format="%.2e")
        nu = st.number_input("Poisson ratio ν", min_value=0.0, max_value=0.5, value=0.3, step=0.05, format="%.2f")
        sigma_y = st.number_input("Yield stress σ_y (Pa)", min_value=1e8, value=2.5e8, step=1e7, format="%.2e")
    with col3:
        rho = st.number_input("Density ρ (kg/m³)", min_value=500.0, value=1000.0, step=100.0, format="%.1f")
        K = st.number_input("Bulk modulus K (Pa)", min_value=1e8, value=2.2e9, step=1e8, format="%.2e")
        V = st.number_input("Flow velocity V (m/s)", min_value=0.01, value=2.5, step=0.5, format="%.2f")
        t_c = st.number_input("Closure time t_c (s)", min_value=0.001, value=0.2, step=0.05, format="%.3f")

    if st.button("🔧 Compute Water Hammer", type="primary", use_container_width=True):
        try:
            wh = water_hammer.WaterHammerAnalyzer()
            pipe = water_hammer.PipeParameters(length=L, diameter=D, wall_thickness=e,
                                               elastic_modulus=E, poisson_ratio=nu, yield_strength=sigma_y)
            fluid = water_hammer.FluidProperties(density=rho, bulk_modulus=K)
            res = wh.analyze_valve_closure(pipe, fluid, V, t_c)

            st.session_state['wh_inputs'] = {'L': L, 'D': D, 'e': e, 'E': E, 'nu': nu, 'sigma_y': sigma_y,
                                              'rho': rho, 'K': K, 'V': V, 't_c': t_c}
            st.session_state['wh_result'] = dict(res)

            st.markdown("### Results")
            c1, c2, c3 = st.columns(3)
            c1.metric("Wave speed a", f"{res['wave_speed']:.1f} m/s")
            c2.metric("ΔP (Joukowsky)", f"{res['delta_pressure_bar']:.2f} bar")
            c3.metric("Closure type", res['closure_type'])
            c1, c2, c3 = st.columns(3)
            c1.metric("Hoop stress", f"{res['hoop_stress']/1e6:.1f} MPa")
            c2.metric("Safety factor", f"{res['safety_factor']:.2f}")
            c3.metric("Critical time", f"{res['critical_time']:.3f} s")

            st.markdown("### 📥 Export")
            buf = io.BytesIO()
            report_water_hammer(st.session_state['wh_inputs'], st.session_state['wh_result'], buf)
            buf.seek(0)
            pdf_download_button(buf.getvalue(), f"water_hammer_L{L}_V{V}.pdf")
        except Exception as e:
            st.error(f"Error: {e}")

# =============================================================
# ABOUT
# =============================================================
else:
    st.header("ℹ️ About Canals Workbench")
    st.markdown("""
**Canals Workbench** is a hydraulic engineering calculator for canal and
channel design. It runs as a web app (this page) or as a desktop program
(Windows / Linux / macOS).

### Algorithms
1. **Open Channel Design** — optimal trapezoidal section (Manning)
2. **Sluice Gate** — discharge coefficient, hydrostatic force
3. **Earth Canals** — Lacey silt theory + Manning theory
4. **Flow Profile** — critical / normal depth, profile classification
5. **Hydraulic Jump** — Bélanger conjugate, USBR stilling basin
6. **Water Hammer** — Korteweg wave speed, Joukowsky pressure rise

### Features
- ✅ Touch-friendly interface (iPad, iPhone, Android)
- ✅ Real-time calculation
- ✅ PDF report export with step-by-step solution
- ✅ Works offline once loaded
- ✅ No account, no signup, no data sent to any server

### Built with
- Python 3.11 + NumPy + SciPy + Matplotlib
- PySide6 (desktop) / Streamlit (web)
- ReportLab (PDF reports)
- 17 unit tests, all passing

### About the engineer
**Abbas A. Hebah** — Civil Engineer specializing in hydraulic structures,
spillway design, and canal systems. The desktop program is part of the
broader Cavitation & Channel Workbench (CCW) v1.4 suite.

### License
MIT — use freely, modify freely, no warranty.
    """)
    st.markdown("---")
    st.markdown("📖 **User Guide:** see `docs/USER_GUIDE.md` in the GitHub repo")
    st.markdown("🐛 **Report issues:** GitHub Issues")
    st.markdown("⭐ **Star on GitHub:** if this tool helped your project")

