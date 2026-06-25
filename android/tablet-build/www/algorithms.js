// =================================================================
// Canals Workbench — Pure JavaScript implementations
// All 6 algorithms from the Python canals package, ported for the
// browser. Pure functions, no dependencies, runs offline.
// =================================================================

const CanalsAlgorithms = (function() {

    // ============================================================
    // Helper: solve cubic equation (Manning iterative solver)
    // ============================================================
    function solveCubic(a, b, c, d) {
        // Newton's method for ax³ + bx² + cx + d = 0
        let x = 1.0;
        for (let i = 0; i < 100; i++) {
            const f = a*x*x*x + b*x*x + c*x + d;
            const df = 3*a*x*x + 2*b*x + c;
            if (Math.abs(df) < 1e-12) break;
            const dx = f / df;
            x -= dx;
            if (Math.abs(dx) < 1e-10) break;
        }
        return x;
    }

    function solveBisection(fn, a, b, tol, maxIter) {
        tol = tol || 1e-8;
        maxIter = maxIter || 200;
        let fa = fn(a), fb = fn(b);
        if (fa * fb > 0) return null;
        for (let i = 0; i < maxIter; i++) {
            const mid = (a + b) / 2;
            const fm = fn(mid);
            if (Math.abs(fm) < tol || (b - a) / 2 < tol) return mid;
            if (fa * fm < 0) { b = mid; fb = fm; }
            else { a = mid; fa = fm; }
        }
        return (a + b) / 2;
    }

    // ============================================================
    // 1. OPEN CHANNEL DESIGN — Optimal trapezoidal (Manning)
    // ============================================================
    function optimalChannel(Q, n, S, z_user) {
        // For optimal section: z = 1/sqrt(3) ≈ 0.577
        // b/y = 2/sqrt(3) ≈ 1.155
        const z_opt = 1 / Math.sqrt(3);
        const z = z_user || z_opt;

        // For z = z_opt, b/y = 2*(sqrt(1+z^2) - z)
        const by_opt = 2 * (Math.sqrt(1 + z_opt*z_opt) - z_opt);

        // Solve for y: Q = (1/n) * A * R^(2/3) * S^(1/2)
        // For trapezoid: A = (b + z*y)*y = by_opt*y*y + z*y*y = (by_opt + z)*y²
        //                P = b + 2y*sqrt(1+z²) = by_opt*y + 2y*sqrt(1+z²) = y*(by_opt + 2*sqrt(1+z²))
        //                R = A/P

        const b_coef = by_opt + z;
        const p_coef = by_opt + 2 * Math.sqrt(1 + z_opt * z_opt);

        const fn = (y) => {
            const A = b_coef * y * y;
            const P = p_coef * y;
            const R = A / P;
            const Q_calc = (1/n) * A * Math.pow(R, 2/3) * Math.sqrt(S);
            return Q_calc - Q;
        };

        // Bisection search for y in [0.1, 50]
        const y = solveBisection(fn, 0.1, 50);
        if (y === null) return { error: "Could not converge on depth" };

        const b = by_opt * y;
        const A = b_coef * y * y;
        const V = Q / A;
        const b_y = b / y;

        return {
            bottom_width: b,
            depth: y,
            side_slope: z_opt,
            area: A,
            velocity: V,
            b_over_y: b_y,
            froude: V / Math.sqrt(9.81 * y)
        };
    }

    // ============================================================
    // 2. SLUICE GATE
    // ============================================================
    function sluiceGate(Q, H_up, H_down, b, a) {
        const g = 9.81;
        const dH = H_up - H_down;
        if (dH <= 0) return { error: "H_up must be greater than H_down" };
        if (a <= 0) return { error: "Gate opening must be > 0" };

        // Standard sluice formula: Q = Cd * a * b * sqrt(2*g*(H1-H2))
        // Solve for Cd assuming typical free-flow value:
        const V_ideal = Math.sqrt(2 * g * dH);
        const Q_ideal = a * b * V_ideal;

        // Assume Cd = 0.58 (typical free-flow)
        const Cd = 0.58;

        // Compute actual gate width needed for the given Q
        const W_required = Q / (Cd * a * Math.sqrt(2 * g * dH));
        const V_thru = Q / (a * W_required);

        // Hydrostatic force: F = 0.5 * rho * g * b * (H1^2 - H2^2)
        const F_hydrostatic = 0.5 * 1000 * g * W_required * (H_up*H_up - H_down*H_down);

        // Lifting force (approx 0.55 * hydrostatic)
        const F_lift = 0.55 * F_hydrostatic;

        // Bending moment
        const M = F_hydrostatic * (H_up - H_down) / 2;

        // Required plate thickness (using sigma_y/2, safety factor 2)
        const sigma_allow = 250e6 / 2;  // 125 MPa
        const e_min = Math.sqrt(6 * M / (W_required * sigma_allow));

        return {
            discharge_coefficient: Cd,
            required_gate_width: W_required,
            velocity_through_gate: V_thru,
            hydrostatic_force: F_hydrostatic,
            lifting_force: F_lift,
            bending_moment: M,
            required_thickness: e_min * 1000,  // mm
            ideal_velocity: V_ideal,
            ideal_discharge: Q_ideal
        };
    }

    // ============================================================
    // 3. LACEY REGIME DESIGN
    // ============================================================
    function lacey(Q, f, z) {
        z = z || 1.0;
        f = f || 1.0;

        // Lacey wetted perimeter: P = 4.75 * sqrt(Q)
        const P = 4.75 * Math.sqrt(Q);

        // Lacey regime velocity (India/Pakistan practice)
        // V = (Q * f^2 / 140)^(1/6)  [simplified version]
        const V = Math.pow(Q * f * f / 140, 1/6);

        // Required area
        const A = Q / V;

        // Solve for b and y from:
        //   A = (b + z*y) * y
        //   P = b + 2*y*sqrt(1+z^2)
        //
        // Eliminate b: b = P - 2*y*sqrt(1+z^2)
        // Substitute: A = (P - 2*y*sqrt(1+z^2) + z*y) * y
        //            = (P - y*(2*sqrt(1+z^2) - z)) * y
        //
        // Let k = 2*sqrt(1+z^2) - z
        // Then: A = (P - k*y) * y = P*y - k*y^2
        // So: k*y^2 - P*y + A = 0
        const k = 2 * Math.sqrt(1 + z*z) - z;
        // k*y^2 - P*y + A = 0  (note sign flip)
        // y = (P ± sqrt(P^2 - 4*k*A)) / (2*k)
        const disc = P*P - 4*k*A;
        if (disc < 0) {
            // Try different silt factor
            return { error: "Lacey equations don't close - try different silt factor f" };
        }
        const y = (P - Math.sqrt(disc)) / (2*k);
        const b = P - 2 * y * Math.sqrt(1 + z*z);

        if (y <= 0 || b <= 0) {
            return { error: "Negative dimensions - try different silt factor" };
        }

        const A_calc = (b + z*y) * y;
        const R = A_calc / P;
        const Fr = V / Math.sqrt(9.81 * y);

        return {
            depth: y,
            bottom_width: b,
            area: A_calc,
            wetted_perimeter: P,
            velocity: V,
            hydraulic_radius: R,
            froude_number: Fr
        };
    }

    // ============================================================
    // 4. MANNING DESIGN (optimal trapezoidal section)
    // ============================================================
    function manning(Q, n, S, z) {
        z = z || 2.0;

        // For given z, solve iteratively for b, y
        // Constraint: V in [0.6, 1.5] m/s (self-cleansing)

        // First, try assuming optimal b/y ratio for given z
        // For non-optimal, sweep b
        let best_y = 0, best_b = 0, best_A = 0, best_V = 0, best_err = Infinity;

        for (let b_try = 0.5; b_try <= 20; b_try += 0.1) {
            // Solve Manning for y given b
            const fn = (y) => {
                if (y <= 0) return Infinity;
                const A = (b_try + z*y) * y;
                const P = b_try + 2*y*Math.sqrt(1+z*z);
                const R = A/P;
                const Q_calc = (1/n) * A * Math.pow(R, 2/3) * Math.sqrt(S);
                return Q_calc - Q;
            };
            const y = solveBisection(fn, 0.1, 50);
            if (y === null) continue;
            const A = (b_try + z*y) * y;
            const V = Q / A;
            const err = Math.abs(V - 1.0);  // prefer V ≈ 1.0 m/s
            if (err < best_err) {
                best_err = err;
                best_y = y;
                best_b = b_try;
                best_A = A;
                best_V = V;
            }
        }

        if (best_y === 0) return { error: "Could not find a valid Manning section" };

        const P = best_b + 2*best_y*Math.sqrt(1+z*z);
        const R = best_A / P;
        const Fr = best_V / Math.sqrt(9.81 * best_y);

        return {
            depth: best_y,
            bottom_width: best_b,
            area: best_A,
            wetted_perimeter: P,
            velocity: best_V,
            hydraulic_radius: R,
            froude_number: Fr
        };
    }

    // ============================================================
    // 5. FLOW PROFILE (critical + normal depth)
    // ============================================================
    function flowProfile(Q, b, S, n) {
        // Critical depth (rectangular): y_c = (q^2/g)^(1/3)
        const q = Q / b;
        const y_c = Math.pow(q*q / 9.81, 1/3);

        // Normal depth: solve Q = (1/n) * A * R^(2/3) * sqrt(S)
        // For rectangular: A = b*y, P = b + 2y, R = b*y / (b + 2y)
        const fn_normal = (y) => {
            const A = b * y;
            const P = b + 2*y;
            const R = A / P;
            const Q_calc = (1/n) * A * Math.pow(R, 2/3) * Math.sqrt(S);
            return Q_calc - Q;
        };
        const y_n = solveBisection(fn_normal, 0.01, 50);
        const y_n_val = y_n || Infinity;

        // Classify
        let profile_type;
        if (y_n_val === Infinity) {
            profile_type = 'Horizontal/Adverse';
        } else if (y_n_val > y_c) {
            profile_type = 'Mild slope (M)';
        } else {
            profile_type = 'Steep slope (S)';
        }

        return {
            critical_depth: y_c,
            normal_depth: y_n_val,
            profile_type: profile_type,
            regime: y_n_val > y_c ? 'subcritical' : 'supercritical'
        };
    }

    // ============================================================
    // 6. HYDRAULIC JUMP (Bélanger + USBR basin)
    // ============================================================
    function hydraulicJump(V1, y1, b) {
        const g = 9.81;

        // Upstream Froude
        const Fr1 = V1 / Math.sqrt(g * y1);

        // Bélanger: y2/y1 = 0.5 * (sqrt(1 + 8*Fr1^2) - 1)
        const y2_over_y1 = 0.5 * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
        const y2 = y2_over_y1 * y1;

        // Downstream
        const V2 = (V1 * y1) / y2;
        const Fr2 = V2 / Math.sqrt(g * y2);

        // Energy loss
        const dE = Math.pow(y2 - y1, 3) / (4 * y1 * y2);
        const E1 = y1 + V1*V1 / (2*g);
        const eta = (E1 - dE) / E1;

        // Jump length (USBR)
        const L_j = 6.1 * y2;

        // Jump type
        let jtype;
        if (Fr1 < 1) jtype = 'No jump (subcritical)';
        else if (Fr1 < 1.7) jtype = 'Undular';
        else if (Fr1 < 2.5) jtype = 'Weak jump';
        else if (Fr1 < 4.5) jtype = 'Oscillating';
        else if (Fr1 < 13) jtype = 'Stable jump';
        else jtype = 'Choppy/strong';

        // USBR basin type
        let basin_type;
        if (Fr1 < 1) basin_type = 'Not needed';
        else if (Fr1 < 1.7) basin_type = 'Type I (no appurtenances)';
        else if (Fr1 < 2.5) basin_type = 'Type II (baffles, low Fr)';
        else if (Fr1 < 4.5) basin_type = 'Type III (chute + baffle + sill)';
        else basin_type = 'Type IV (high-energy, large basin)';

        // Basin dimensions (USBR Type III/IV typical)
        let basin_length = 0, appurtenances_height = 0, end_sill_height = 0;
        if (Fr1 >= 2.5 && Fr1 < 4.5) {
            basin_length = 4.2 * y2;
            appurtenances_height = y2 / 2;
            end_sill_height = y2 / 3;
        } else if (Fr1 >= 4.5) {
            basin_length = 6.1 * y2;
            appurtenances_height = y2 * 0.8;
            end_sill_height = y2 * 0.4;
        }

        return {
            froude_1: Fr1,
            froude_2: Fr2,
            conjugate_depth: y2,
            velocity_2: V2,
            energy_loss: dE,
            efficiency: eta,
            jump_length: L_j,
            jump_type: jtype,
            basin_type: basin_type,
            basin_length: basin_length,
            appurtenances_height: appurtenances_height,
            end_sill_height: end_sill_height,
            ratio: y2_over_y1
        };
    }

    // ============================================================
    // 7. WATER HAMMER (Korteweg + Joukowsky)
    // ============================================================
    function waterHammer(L, D, e, E, nu, sigma_y, rho, K, V, t_c) {
        // Wave speed (Korteweg): a = sqrt(K/rho) / sqrt(1 + K*D*(1-nu^2)/(E*e))
        const c0 = Math.sqrt(K / rho);
        const correction = 1 + (K * D * (1 - nu*nu)) / (E * e);
        const a = c0 / Math.sqrt(correction);

        // Critical closure time
        const t_crit = 2 * L / a;

        // Joukowsky pressure rise
        const dP_Pa = rho * a * V;
        const dP_bar = dP_Pa / 1e5;

        // Closure type
        const closure_type = t_c < t_crit ? 'Direct (worst case)' : 'Indirect (reduced)';

        // Hoop stress
        const hoop_stress = dP_Pa * D / (2 * e);
        const hoop_stress_MPa = hoop_stress / 1e6;

        // Safety factor
        const sf = sigma_y / hoop_stress;

        // Mitigation recommendations
        const recs = [];
        if (sf < 2.0) {
            recs.push('CRITICAL: Increase closure time beyond t_crit = ' + t_crit.toFixed(2) + ' s');
            recs.push('Add a surge tank (open or differential)');
            recs.push('Install pressure-relief valve');
        } else if (sf < 2.5) {
            recs.push('Consider increasing closure time');
            recs.push('Consider adding a surge tank for safety margin');
        } else {
            recs.push('Design is acceptable for transient loading');
        }

        return {
            wave_speed: a,
            critical_time: t_crit,
            joukowsky_pressure: dP_Pa,
            joukowsky_pressure_bar: dP_bar,
            closure_type: closure_type,
            hoop_stress: hoop_stress,
            hoop_stress_MPa: hoop_stress_MPa,
            safety_factor: sf,
            recommendations: recs
        };
    }

    // ============================================================
    // Public API
    // ============================================================
    return {
        openChannel: optimalChannel,
        sluiceGate: sluiceGate,
        lacey: lacey,
        manning: manning,
        flowProfile: flowProfile,
        hydraulicJump: hydraulicJump,
        waterHammer: waterHammer
    };
})();

// Make available globally
if (typeof window !== 'undefined') window.CanalsAlgorithms = CanalsAlgorithms;

// =================================================================
// ADDITIONAL ALGORITHMS (radial gate, siphon, pressure breakers)
// =================================================================

// 8. RADIAL GATE (Tainter gate)
function radialGate(Q, H_up, radius, angle_deg) {
    const g = 9.81;
    const Cd = 0.65;  // typical for radial gates
    const angle_rad = (angle_deg * Math.PI) / 180;

    // Required gate width: Q = Cd * b * R * angle * sqrt(2gH)
    // Solve for b
    const W_required = Q / (Cd * radius * angle_rad * Math.sqrt(2 * g * H_up));

    // Hydrostatic force (full)
    const F_hydrostatic = 0.5 * 1000 * g * W_required * H_up * H_up;

    // Torque (about pivot at center): F * lever_arm
    // Lever arm = R * cos(angle/2) approximately
    const lever_arm = radius * Math.cos(angle_rad / 2);
    const torque = F_hydrostatic * lever_arm;

    // Hoist capacity (10-15% of torque for friction, etc.)
    const hoist = torque * 0.2;

    return {
        radius: radius,
        gate_width: W_required,
        angle_deg: angle_deg,
        angle_rad: angle_rad,
        discharge_coefficient: Cd,
        hydrostatic_force: F_hydrostatic,
        torque: torque,
        hoist_capacity: hoist,
        gate_type: 'Radial (Tainter)'
    };
}

// 9. SIPHON
function siphon(Q, H_static, L_pipe, D_pipe, n_manning) {
    n_manning = n_manning || 0.013;
    const g = 9.81;
    const nu = 1e-6;  // kinematic viscosity

    // Pipe area
    const A = Math.PI * D_pipe * D_pipe / 4;
    const V = Q / A;

    // Reynolds
    const Re = V * D_pipe / nu;

    // Friction factor (Swamee-Jain for full turbulence)
    const f = 0.25 / Math.pow(Math.log10(n_manning/(3.7*D_pipe) + 5.74/Math.pow(Re, 0.9)), 2);

    // Head losses
    const h_friction = f * (L_pipe/D_pipe) * (V*V/(2*g));
    const h_entrance = 0.5 * V*V/(2*g);
    const h_bend = 0.4 * V*V/(2*g);  // typical bend loss (2 bends at 0.2 each)
    const h_exit = 1.0 * V*V/(2*g);
    const h_minor = h_entrance + h_bend + h_exit;
    const h_total = h_friction + h_minor;

    // Discharge coefficient
    const Cd = 1 / Math.sqrt(1 + h_total/H_static);

    // Cavitation risk
    const p_atm = 101325;  // Pa
    const p_v = 2300;     // Pa (vapor pressure at 20°C)
    const sigma = (p_atm + 1000 * g * 0.5 - p_v) / (0.5 * 1000 * V*V);
    const cav_risk = sigma < 0.2;

    // Flow status
    const status = H_static > h_total ? "OK - siphon flows" : "INSUFFICIENT head";

    // Stilling basin (Bélanger from exit velocity)
    const y1_exit = A / D_pipe;  // approx
    const Fr = V / Math.sqrt(g * y1_exit);
    const y2_over_y1 = 0.5 * (Math.sqrt(1 + 8*Fr*Fr) - 1);
    const y2 = y2_over_y1 * y1_exit;
    const basin_length = 4.2 * y2;

    return {
        pipe_diameter: D_pipe,
        pipe_area: A,
        velocity: V,
        reynolds: Re,
        friction_factor: f,
        friction_loss: h_friction,
        entrance_loss: h_entrance,
        bend_loss: h_bend,
        exit_loss: h_exit,
        minor_losses_total: h_minor,
        total_head_loss: h_total,
        available_head: H_static,
        flow_status: status,
        discharge_coefficient: Cd,
        cavitation_index: sigma,
        cavitation_risk: cav_risk,
        stilling_basin_length: basin_length,
        conjugate_depth: y2,
        basin_froude: Fr,
        efficiency: (1 - h_total / H_static) * 100
    };
}

// 10. PRESSURE BREAKER — STILLING WELL
function stillingWell(Q, H_total, D_pipe, n_stages) {
    n_stages = n_stages || 3;
    const g = 9.81;
    const H_per_stage = H_total / n_stages;
    const A_pipe = Math.PI * D_pipe * D_pipe / 4;

    // Well diameter (rule of thumb: 4x pipe diameter for stilling well)
    const D_well = 4 * D_pipe;

    // Each stage dissipates energy via sudden expansion
    // Energy loss = (1 - A_pipe/A_well)^2 * V^2/(2g)
    const A_well = Math.PI * D_well * D_well / 4;
    const V_in = Q / A_pipe;
    const loss_coef = Math.pow(1 - A_pipe/A_well, 2);
    const loss_per_stage = loss_coef * V_in * V_in / (2 * g);
    const total_loss = loss_per_stage;  // first stage dissipates most

    // Stages data
    const stages = [];
    for (let i = 1; i <= n_stages; i++) {
        stages.push({
            stage_number: i,
            well_diameter: D_well,
            well_height: H_per_stage + D_well/2,
            water_depth: A_well > 0 ? Q / (A_well * Math.sqrt(2*g*H_per_stage)) : 0,
            velocity: V_in * Math.pow(1 - loss_coef, i-1),
            energy_loss: i === 1 ? loss_per_stage : 0,
            head: H_per_stage
        });
    }

    return {
        type: 'Stilling Well',
        n_stages: n_stages,
        head_per_stage: H_per_stage,
        pipe_diameter: D_pipe,
        well_diameter: D_well,
        inlet_velocity: V_in,
        stages: stages,
        total_loss: total_loss,
        efficiency: (total_loss / H_total) * 100,
        well_area: A_well
    };
}

// 11. PRESSURE BREAKER — IMPACT BASIN
function impactBasin(Q, H_total, V_jet) {
    const g = 9.81;
    const A_pipe = 0.5;  // assumed, will use V_jet to back-calculate

    if (!V_jet) {
        V_jet = Math.sqrt(2 * g * H_total);
    }

    const D_jet = Math.sqrt(4 * Q / (Math.PI * V_jet));

    // Basin dimensions (USBR Type II)
    const basin_width = 3 * D_jet;
    const basin_length = 3.5 * D_jet;
    const basin_depth = 2.5 * D_jet;
    const wall_height = basin_depth + 0.5 * D_jet;

    // Outlet velocity (assume 80% energy dissipation)
    const energy_dissipated = H_total * 0.9;
    const E_out = H_total - energy_dissipated;
    const V_out = Math.sqrt(2 * g * E_out);

    // Impact force
    const mass_flow = 1000 * Q;
    const impact_force = mass_flow * V_jet / g;  // simplified

    return {
        type: 'Impact Basin',
        head: H_total,
        jet_velocity: V_jet,
        jet_diameter: D_jet,
        basin_width: basin_width,
        basin_length: basin_length,
        basin_depth: basin_depth,
        wall_height: wall_height,
        outlet_velocity: V_out,
        energy_dissipated: energy_dissipated,
        efficiency: 90,
        impact_force: impact_force
    };
}

// 12. PRESSURE BREAKER — CASCADE (stepped spillway)
function cascade(Q, H_total, L_total, n_steps) {
    const g = 9.81;
    if (!n_steps) n_steps = Math.max(3, Math.ceil(H_total / 0.7));
    if (!L_total) L_total = 5 * H_total;

    const step_h = H_total / n_steps;
    const step_l = L_total / n_steps;

    // Critical depth per step: y_c = (q^2/g)^(1/3)
    const q = Q / 1.0;  // unit width assumption
    const y_c = Math.pow(q*q/g, 1/3);

    // Steps
    const steps = [];
    let cum_loss = 0;
    for (let i = 1; i <= n_steps; i++) {
        // Simplified: at each step, energy loss ≈ 0.7 * step_h (typical)
        const energy_loss = 0.7 * step_h;
        cum_loss += energy_loss;
        const remaining_h = H_total - cum_loss;
        const V = Math.sqrt(2 * g * step_h);
        const Fr = V / Math.sqrt(g * y_c);

        steps.push({
            step_number: i,
            step_height: step_h,
            step_length: step_l,
            critical_depth: y_c,
            velocity: V,
            froude: Fr,
            energy_loss: energy_loss,
            regime: Fr > 1 ? 'supercritical' : 'subcritical'
        });
    }

    const total_loss = cum_loss;
    const efficiency = (total_loss / H_total) * 100;
    const slope = H_total / L_total;

    return {
        type: 'Cascade (Stepped Spillway)',
        n_steps: n_steps,
        step_height: step_h,
        step_length: step_l,
        total_length: L_total,
        total_head: H_total,
        critical_depth: y_c,
        steps: steps,
        total_loss: Math.min(total_loss, H_total * 0.95),
        efficiency: Math.min(efficiency, 95),
        slope: slope
    };
}

// 13. PRESSURE BREAKER - AUTO SELECT
function pressureBreaker(Q, H_total, D_pipe, L_total, breaker_type) {
    breaker_type = breaker_type || 'auto';
    let result;

    if (breaker_type === 'auto') {
        // Auto-select based on head and discharge
        if (H_total < 5) {
            breaker_type = 'stilling_well';
        } else if (H_total < 15) {
            breaker_type = 'impact_basin';
        } else {
            breaker_type = 'cascade';
        }
    }

    if (breaker_type === 'stilling_well') {
        result = stillingWell(Q, H_total, D_pipe);
    } else if (breaker_type === 'impact_basin') {
        result = impactBasin(Q, H_total);
    } else if (breaker_type === 'cascade') {
        result = cascade(Q, H_total, L_total);
    }

    result.requested_type = breaker_type;
    return result;
}

// Update public API
CanalsAlgorithms.radialGate = radialGate;
CanalsAlgorithms.siphon = siphon;
CanalsAlgorithms.stillingWell = stillingWell;
CanalsAlgorithms.impactBasin = impactBasin;
CanalsAlgorithms.cascade = cascade;
CanalsAlgorithms.pressureBreaker = pressureBreaker;
