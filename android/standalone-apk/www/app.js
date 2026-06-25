// =================================================================
// Canals Workbench — App logic (forms, results, charts, PDF)
// =================================================================

let currentForm = 'openChannel';
let lastResult = null;
let lastInputs = null;

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
}

function setForm(formName) {
    currentForm = formName;
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.form === formName);
    });
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
    renderForm();
}

document.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => setForm(el.dataset.form));
});

// ============================================================
// Form rendering
// ============================================================
function renderForm() {
    const content = document.getElementById('content');
    switch (currentForm) {
        case 'openChannel':     content.innerHTML = formOpenChannel(); break;
        case 'sluiceGate':      content.innerHTML = formSluiceGate(); break;
        case 'lacey':           content.innerHTML = formLacey(); break;
        case 'manning':         content.innerHTML = formManning(); break;
        case 'flowProfile':     content.innerHTML = formFlowProfile(); break;
        case 'hydraulicJump':   content.innerHTML = formHydraulicJump(); break;
        case 'waterHammer':     content.innerHTML = formWaterHammer(); break;
        case 'about':           content.innerHTML = formAbout(); break;
    }
}

function inputRow(id, label, value, unit, step) {
    return `
        <div class="input-row">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" value="${value}" step="${step || '0.01'}" inputmode="decimal">
            <span class="unit">${unit}</span>
        </div>`;
}

// ============================================================
// Form 1: Open Channel
// ============================================================
function formOpenChannel() {
    return `
        <div class="form-section">
            <h2>🏞 Open Channel Design</h2>
            <p style="margin-bottom:12px;color:#555;">Optimal trapezoidal section using Manning-Strickler.</p>
            ${inputRow('oc_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('oc_n', "Manning's n", '0.025', '', '0.001')}
            ${inputRow('oc_S', 'Bed slope S', '0.0008', 'm/m', '0.0001')}
            <button class="primary" onclick="computeOpenChannel()">🔧 Compute Optimal Section</button>
        </div>
        <div id="results"></div>
    `;
}

function computeOpenChannel() {
    const Q = parseFloat(document.getElementById('oc_Q').value);
    const n = parseFloat(document.getElementById('oc_n').value);
    const S = parseFloat(document.getElementById('oc_S').value);
    if (!validateInputs({Q, n, S}, ['Q', 'n', 'S'])) return;

    const r = CanalsAlgorithms.openChannel(Q, n, S);
    if (r.error) { showError(r.error); return; }

    lastInputs = {Q, n, S, form: 'Open Channel Design'};
    lastResult = r;

    showOpenChannelResults(r, Q);
    drawOpenChannelSection(r);
}

// ============================================================
// Form 2: Sluice Gate
// ============================================================
function formSluiceGate() {
    return `
        <div class="form-section">
            <h2>🚰 Sluice Gate</h2>
            <p style="margin-bottom:12px;color:#555;">Discharge coefficient and hydrostatic force.</p>
            ${inputRow('sg_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('sg_Hup', 'Upstream depth H₁', '4', 'm', '0.1')}
            ${inputRow('sg_Hdown', 'Downstream depth H₂', '1', 'm', '0.1')}
            ${inputRow('sg_b', 'Gate width b', '3', 'm', '0.1')}
            ${inputRow('sg_a', 'Gate opening a', '0.4', 'm', '0.05')}
            <button class="primary" onclick="computeSluiceGate()">🔧 Compute Gate</button>
        </div>
        <div id="results"></div>
    `;
}

function computeSluiceGate() {
    const Q = parseFloat(document.getElementById('sg_Q').value);
    const H_up = parseFloat(document.getElementById('sg_Hup').value);
    const H_down = parseFloat(document.getElementById('sg_Hdown').value);
    const b = parseFloat(document.getElementById('sg_b').value);
    const a = parseFloat(document.getElementById('sg_a').value);
    if (!validateInputs({Q, H_up, H_down, b, a}, ['Q', 'H₁', 'H₂', 'b', 'a'])) return;

    const r = CanalsAlgorithms.sluiceGate(Q, H_up, H_down, b, a);
    if (r.error) { showError(r.error); return; }

    lastInputs = {Q, H_up, H_down, b, a, form: 'Sluice Gate'};
    lastResult = r;

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Discharge coeff C_d</div><div class="value">${r.discharge_coefficient.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Required gate width</div><div class="value">${r.required_gate_width.toFixed(2)} m</div></div>
                <div class="result-item"><div class="label">Velocity through gate</div><div class="value">${r.velocity_through_gate.toFixed(2)} m/s</div></div>
                <div class="result-item"><div class="label">Hydrostatic force</div><div class="value">${(r.hydrostatic_force/1000).toFixed(1)} kN</div></div>
                <div class="result-item"><div class="label">Lifting force</div><div class="value">${(r.lifting_force/1000).toFixed(1)} kN</div></div>
                <div class="result-item"><div class="label">Plate thickness</div><div class="value">${r.required_thickness.toFixed(1)} mm</div></div>
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
}

// ============================================================
// Form 3: Lacey
// ============================================================
function formLacey() {
    return `
        <div class="form-section">
            <h2>🌾 Earth Canal — Lacey</h2>
            <p style="margin-bottom:12px;color:#555;">Silt-theory regime dimensions.</p>
            ${inputRow('l_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('l_f', 'Silt factor f', '1.0', '', '0.1')}
            ${inputRow('l_z', 'Side slope z (H:V)', '1.0', '', '0.1')}
            <button class="primary" onclick="computeLacey()">🔧 Compute Lacey Section</button>
        </div>
        <div id="results"></div>
    `;
}

function computeLacey() {
    const Q = parseFloat(document.getElementById('l_Q').value);
    const f = parseFloat(document.getElementById('l_f').value);
    const z = parseFloat(document.getElementById('l_z').value);
    if (!validateInputs({Q, f, z}, ['Q', 'f', 'z'])) return;

    const r = CanalsAlgorithms.lacey(Q, f, z);
    if (r.error) { showError(r.error); return; }

    lastInputs = {Q, f, z, form: 'Lacey Earth Canal'};
    lastResult = r;

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Depth y</div><div class="value">${r.depth.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Bottom width b</div><div class="value">${r.bottom_width.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Area A</div><div class="value">${r.area.toFixed(2)} m²</div></div>
                <div class="result-item"><div class="label">Velocity V</div><div class="value">${r.velocity.toFixed(3)} m/s</div></div>
                <div class="result-item"><div class="label">Wetted perimeter P</div><div class="value">${r.wetted_perimeter.toFixed(2)} m</div></div>
                <div class="result-item"><div class="label">Froude number</div><div class="value">${r.froude_number.toFixed(3)}</div></div>
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
            <div class="canvas-wrap"><canvas id="sectionCanvas" width="400" height="200"></canvas></div>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
    drawTrapezoid(r.bottom_width, r.depth, z, 'sectionCanvas');
}

// ============================================================
// Form 4: Manning
// ============================================================
function formManning() {
    return `
        <div class="form-section">
            <h2>🌾 Earth Canal — Manning</h2>
            <p style="margin-bottom:12px;color:#555;">Bed-roughness based design.</p>
            ${inputRow('m_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('m_n', "Manning's n", '0.025', '', '0.001')}
            ${inputRow('m_S', 'Bed slope S', '0.0008', 'm/m', '0.0001')}
            ${inputRow('m_z', 'Side slope z (H:V)', '2.0', '', '0.1')}
            <button class="primary" onclick="computeManning()">🔧 Compute Manning Section</button>
        </div>
        <div id="results"></div>
    `;
}

function computeManning() {
    const Q = parseFloat(document.getElementById('m_Q').value);
    const n = parseFloat(document.getElementById('m_n').value);
    const S = parseFloat(document.getElementById('m_S').value);
    const z = parseFloat(document.getElementById('m_z').value);
    if (!validateInputs({Q, n, S, z}, ['Q', 'n', 'S', 'z'])) return;

    const r = CanalsAlgorithms.manning(Q, n, S, z);
    if (r.error) { showError(r.error); return; }

    lastInputs = {Q, n, S, z, form: 'Manning Earth Canal'};
    lastResult = r;

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Depth y</div><div class="value">${r.depth.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Bottom width b</div><div class="value">${r.bottom_width.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Area A</div><div class="value">${r.area.toFixed(2)} m²</div></div>
                <div class="result-item"><div class="label">Velocity V</div><div class="value">${r.velocity.toFixed(3)} m/s</div></div>
                <div class="result-item"><div class="label">Wetted perimeter P</div><div class="value">${r.wetted_perimeter.toFixed(2)} m</div></div>
                <div class="result-item"><div class="label">Froude number</div><div class="value">${r.froude_number.toFixed(3)}</div></div>
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
}

// ============================================================
// Form 5: Flow Profile
// ============================================================
function formFlowProfile() {
    return `
        <div class="form-section">
            <h2>📈 Flow Profile</h2>
            <p style="margin-bottom:12px;color:#555;">Critical and normal depth classification.</p>
            ${inputRow('fp_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('fp_b', 'Channel width b', '5', 'm', '0.1')}
            ${inputRow('fp_S', 'Bed slope S', '0.0008', 'm/m', '0.0001')}
            ${inputRow('fp_n', "Manning's n", '0.025', '', '0.001')}
            <button class="primary" onclick="computeFlowProfile()">🔧 Compute Profile</button>
        </div>
        <div id="results"></div>
    `;
}

function computeFlowProfile() {
    const Q = parseFloat(document.getElementById('fp_Q').value);
    const b = parseFloat(document.getElementById('fp_b').value);
    const S = parseFloat(document.getElementById('fp_S').value);
    const n = parseFloat(document.getElementById('fp_n').value);
    if (!validateInputs({Q, b, S, n}, ['Q', 'b', 'S', 'n'])) return;

    const r = CanalsAlgorithms.flowProfile(Q, b, S, n);
    lastInputs = {Q, b, S, n, form: 'Flow Profile'};
    lastResult = r;

    const y_n_str = isFinite(r.normal_depth) ? r.normal_depth.toFixed(3) + ' m' : 'N/A';

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Critical depth y_c</div><div class="value">${r.critical_depth.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Normal depth y_n</div><div class="value">${y_n_str}</div></div>
                <div class="result-item"><div class="label">Slope class</div><div class="value">${r.profile_type}</div></div>
                <div class="result-item"><div class="label">Flow regime</div><div class="value">${r.regime}</div></div>
            </div>
            <div class="info">
                <b>Classification:</b><br>
                • If y_n > y_c: <b>Mild slope</b><br>
                • If y_n < y_c: <b>Steep slope</b><br>
                • y₀ (upstream depth) > y_n → M1 backwater<br>
                • y₀ between y_c and y_n → M2 drawdown
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
}

// ============================================================
// Form 6: Hydraulic Jump
// ============================================================
function formHydraulicJump() {
    return `
        <div class="form-section">
            <h2>🌊 Hydraulic Jump</h2>
            <p style="margin-bottom:12px;color:#555;">Bélanger conjugate and USBR basin.</p>
            ${inputRow('hj_V', 'Upstream velocity V₁', '8', 'm/s', '0.1')}
            ${inputRow('hj_y', 'Upstream depth y₁', '0.5', 'm', '0.05')}
            ${inputRow('hj_b', 'Channel width b', '5', 'm', '0.1')}
            <button class="primary" onclick="computeJump()">🔧 Compute Jump</button>
        </div>
        <div id="results"></div>
    `;
}

function computeJump() {
    const V = parseFloat(document.getElementById('hj_V').value);
    const y = parseFloat(document.getElementById('hj_y').value);
    const b = parseFloat(document.getElementById('hj_b').value);
    if (!validateInputs({V, y, b}, ['V₁', 'y₁', 'b'])) return;

    const r = CanalsAlgorithms.hydraulicJump(V, y, b);
    lastInputs = {V, y, b, form: 'Hydraulic Jump'};
    lastResult = r;

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Upstream Froude Fr₁</div><div class="value">${r.froude_1.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Conjugate depth y₂</div><div class="value">${r.conjugate_depth.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Downstream Fr Fr₂</div><div class="value">${r.froude_2.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Energy loss ΔE</div><div class="value">${r.energy_loss.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Efficiency η</div><div class="value">${(r.efficiency*100).toFixed(1)} %</div></div>
                <div class="result-item"><div class="label">Jump length</div><div class="value">${r.jump_length.toFixed(2)} m</div></div>
            </div>
            <div class="info">
                <b>Jump classification:</b> ${r.jump_type}<br>
                <b>USBR basin:</b> ${r.basin_type}<br>
                ${r.basin_length > 0 ? `<b>Basin length:</b> ${r.basin_length.toFixed(2)} m<br>` : ''}
                ${r.appurtenances_height > 0 ? `<b>Appurtenances height:</b> ${r.appurtenances_height.toFixed(2)} m<br>` : ''}
                ${r.end_sill_height > 0 ? `<b>End sill height:</b> ${r.end_sill_height.toFixed(2)} m` : ''}
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
}

// ============================================================
// Form 7: Water Hammer
// ============================================================
function formWaterHammer() {
    return `
        <div class="form-section">
            <h2>💧 Water Hammer</h2>
            <p style="margin-bottom:12px;color:#555;">Korteweg wave speed + Joukowsky surge.</p>
            ${inputRow('wh_L', 'Pipe length L', '1500', 'm', '100')}
            ${inputRow('wh_D', 'Pipe diameter D', '0.6', 'm', '0.05')}
            ${inputRow('wh_e', 'Wall thickness e', '0.012', 'm', '0.001')}
            ${inputRow('wh_E', 'Elastic modulus E', '200000000000', 'Pa', '1000000000')}
            ${inputRow('wh_nu', 'Poisson ratio ν', '0.3', '', '0.05')}
            ${inputRow('wh_sigma', 'Yield stress σ_y', '250000000', 'Pa', '10000000')}
            ${inputRow('wh_rho', 'Density ρ', '1000', 'kg/m³', '50')}
            ${inputRow('wh_K', 'Bulk modulus K', '2200000000', 'Pa', '100000000')}
            ${inputRow('wh_V', 'Flow velocity V', '2.5', 'm/s', '0.1')}
            ${inputRow('wh_tc', 'Closure time t_c', '0.2', 's', '0.05')}
            <button class="primary" onclick="computeWaterHammer()">🔧 Compute Water Hammer</button>
        </div>
        <div id="results"></div>
    `;
}

function computeWaterHammer() {
    const inputs = {
        L: parseFloat(document.getElementById('wh_L').value),
        D: parseFloat(document.getElementById('wh_D').value),
        e: parseFloat(document.getElementById('wh_e').value),
        E: parseFloat(document.getElementById('wh_E').value),
        nu: parseFloat(document.getElementById('wh_nu').value),
        sigma_y: parseFloat(document.getElementById('wh_sigma').value),
        rho: parseFloat(document.getElementById('wh_rho').value),
        K: parseFloat(document.getElementById('wh_K').value),
        V: parseFloat(document.getElementById('wh_V').value),
        t_c: parseFloat(document.getElementById('wh_tc').value),
    };
    if (!validateInputs(inputs, ['L', 'D', 'e', 'E', 'ν', 'σ_y', 'ρ', 'K', 'V', 't_c'])) return;

    const r = CanalsAlgorithms.waterHammer(
        inputs.L, inputs.D, inputs.e, inputs.E, inputs.nu,
        inputs.sigma_y, inputs.rho, inputs.K, inputs.V, inputs.t_c
    );
    lastInputs = {...inputs, form: 'Water Hammer'};
    lastResult = r;

    const sfColor = r.safety_factor >= 2.5 ? '#28a745' : r.safety_factor >= 2.0 ? '#ffc107' : '#dc3545';

    const recsHtml = r.recommendations.map(rec => `<li>${rec}</li>`).join('');

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Wave speed a</div><div class="value">${r.wave_speed.toFixed(1)} m/s</div></div>
                <div class="result-item"><div class="label">ΔP (Joukowsky)</div><div class="value">${r.joukowsky_pressure_bar.toFixed(2)} bar</div></div>
                <div class="result-item"><div class="label">Closure type</div><div class="value" style="font-size:1em;">${r.closure_type}</div></div>
                <div class="result-item"><div class="label">Hoop stress</div><div class="value">${r.hoop_stress_MPa.toFixed(1)} MPa</div></div>
                <div class="result-item"><div class="label">Safety factor</div><div class="value" style="color:${sfColor};">${r.safety_factor.toFixed(2)}</div></div>
                <div class="result-item"><div class="label">Critical time t_crit</div><div class="value">${r.critical_time.toFixed(3)} s</div></div>
            </div>
            <div class="info">
                <b>Recommendations:</b>
                <ul style="margin:6px 0 0 16px;padding:0;">${recsHtml}</ul>
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
}

// ============================================================
// About page
// ============================================================
function formAbout() {
    return `
        <div class="form-section">
            <h2>ℹ️ About Canals Workbench</h2>
            <p style="margin-bottom:12px;line-height:1.5;">
                <b>Canals Workbench v1.4</b> is a standalone hydraulic engineering calculator.
                This Android version contains all 6 algorithms running entirely on your device —
                no internet, no server, no cloud.
            </p>
            <p style="margin-bottom:12px;line-height:1.5;">
                <b>Algorithms included:</b><br>
                1. <b>Open Channel</b> — Optimal trapezoidal section (Manning)<br>
                2. <b>Sluice Gate</b> — Discharge coefficient & hydrostatic force<br>
                3. <b>Lacey Earth Canal</b> — Silt theory regime dimensions<br>
                4. <b>Manning Earth Canal</b> — Bed-roughness based design<br>
                5. <b>Flow Profile</b> — Critical & normal depth classification<br>
                6. <b>Hydraulic Jump</b> — Bélanger conjugate + USBR basin<br>
                7. <b>Water Hammer</b> — Korteweg wave speed + Joukowsky surge
            </p>
            <p style="margin-bottom:12px;line-height:1.5;">
                <b>About:</b> Abbas A. Hebah · Civil Engineer<br>
                <b>License:</b> MIT — use freely<br>
                <b>Standard test cases verified:</b> Open Channel b=2.88m, Lacey y=5.21m,
                Hydraulic Jump y₂=2.32m, Water Hammer a=1210.9 m/s.
            </p>
        </div>
    `;
}

// ============================================================
// Helpers
// ============================================================
function validateInputs(values, names) {
    for (let i = 0; i < names.length; i++) {
        const v = Object.values(values)[i];
        if (isNaN(v) || v <= 0) {
            showError(`${names[i]} must be a positive number`);
            return false;
        }
    }
    return true;
}

function showError(msg) {
    document.getElementById('results').innerHTML = `<div class="error">❌ ${msg}</div>`;
}

function showOpenChannelResults(r, Q) {
    const selfClean = r.velocity >= 0.6 && r.velocity <= 1.5;
    const interp = selfClean
        ? `Velocity ${r.velocity.toFixed(2)} m/s is in the self-cleansing, non-scouring range. Design is acceptable.`
        : r.velocity < 0.6
            ? `Velocity ${r.velocity.toFixed(2)} m/s is BELOW silting threshold.`
            : `Velocity ${r.velocity.toFixed(2)} m/s is ABOVE scour threshold.`;

    const html = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Bottom width b</div><div class="value">${r.bottom_width.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Depth y</div><div class="value">${r.depth.toFixed(3)} m</div></div>
                <div class="result-item"><div class="label">Side slope z</div><div class="value">${r.side_slope.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Area A</div><div class="value">${r.area.toFixed(3)} m²</div></div>
                <div class="result-item"><div class="label">Velocity V</div><div class="value">${r.velocity.toFixed(3)} m/s</div></div>
                <div class="result-item"><div class="label">Froude number</div><div class="value">${r.froude.toFixed(3)}</div></div>
            </div>
            <div class="info">${interp}</div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
            <div class="canvas-wrap"><canvas id="sectionCanvas" width="400" height="200"></canvas></div>
        </div>
    `;
    document.getElementById('results').innerHTML = html;
    drawTrapezoid(r.bottom_width, r.depth, r.side_slope, 'sectionCanvas');
}

function drawTrapezoid(b, y, z, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const margin = 30;
    const totalW = b + 2*z*y;
    const scale = Math.min((W - 2*margin) / totalW, (H - 2*margin) / y);
    const offsetX = (W - totalW * scale) / 2;
    const offsetY = H - margin;

    // Trapezoid
    ctx.fillStyle = 'rgba(0, 102, 170, 0.2)';
    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX + totalW * scale, offsetY);
    ctx.lineTo(offsetX + (b + z*y) * scale, offsetY - y * scale);
    ctx.lineTo(offsetX + z*y * scale, offsetY - y * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Water line
    ctx.strokeStyle = '#0066aa';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(offsetX - 5, offsetY - y * scale);
    ctx.lineTo(offsetX + totalW * scale + 5, offsetY - y * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#003366';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`b = ${b.toFixed(2)} m`, offsetX + totalW * scale / 2, offsetY + 18);
    ctx.fillText(`y = ${y.toFixed(2)} m`, offsetX - 20, offsetY - y * scale / 2);
    ctx.fillText(`z = ${z.toFixed(2)}`, offsetX + z*y * scale / 2, offsetY - y * scale / 2 + 16);
}

// ============================================================
// PDF Export
// ============================================================
function exportPDF() {
    if (!lastResult) {
        alert('Compute a result first');
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Try again when online.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Canals Workbench Report', 10, 15);
    doc.setFontSize(11);
    doc.text(lastInputs.form || 'Calculation', 10, 23);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 38);

    // Inputs section
    let y = 50;
    doc.setFontSize(13);
    doc.setTextColor(0, 51, 102);
    doc.text('Inputs', 10, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    for (const [k, v] of Object.entries(lastInputs)) {
        if (k === 'form') continue;
        doc.text(`${k}: ${typeof v === 'number' ? v.toFixed(4) : v}`, 15, y);
        y += 5;
    }

    y += 5;
    doc.setFontSize(13);
    doc.setTextColor(0, 51, 102);
    doc.text('Results', 10, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    for (const [k, v] of Object.entries(lastResult)) {
        if (typeof v === 'object') continue;
        let valStr;
        if (typeof v === 'number') valStr = v.toFixed(4);
        else valStr = String(v);
        if (valStr.length > 60) valStr = valStr.substring(0, 60) + '...';
        doc.text(`${k}: ${valStr}`, 15, y);
        y += 5;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    }

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Canals Workbench v1.4 · Page ${i} of ${pages}`, 105, 290, { align: 'center' });
    }

    const filename = `canals_${currentForm}_${Date.now()}.pdf`;
    doc.save(filename);
}

// ============================================================
// Initialize
// ============================================================
renderForm();

// =================================================================
// EXTENSIONS: New forms, examples, unit toggle
// =================================================================

// Global unit system state
let unitSystem = 'SI';  // 'SI' or 'US'

// Toggle unit system
function toggleUnits() {
    unitSystem = unitSystem === 'SI' ? 'US' : 'SI';
    const btn = document.getElementById('unitToggle');
    if (btn) {
        btn.textContent = unitSystem;
        btn.style.background = unitSystem === 'US' ? 'rgba(255,193,7,0.4)' : 'rgba(255,255,255,0.25)';
    }
    renderForm();  // re-render with new units
}

// Format a number with the active unit system
function fmt(value, siUnit, usUnit, decimals) {
    decimals = decimals || 3;
    if (value === null || value === undefined || isNaN(value)) return '—';
    const unit = unitSystem === 'SI' ? siUnit : usUnit;
    // Convert
    let display;
    if (unitSystem === 'SI') {
        display = value;
    } else {
        // Convert to US
        try {
            // Determine category from unit
            let cat = null;
            if (['m', 'ft', 'cm', 'in'].includes(siUnit)) cat = 'length';
            else if (['m³/s', 'cfs', 'L/s', 'gpm'].includes(siUnit)) cat = 'discharge';
            else if (['m/s', 'ft/s'].includes(siUnit)) cat = 'velocity';
            else if (['m²', 'ft²', 'cm²', 'in²'].includes(siUnit)) cat = 'area';
            else if (['Pa', 'kPa', 'bar', 'psi', 'm H2O', 'ft H2O', 'atm'].includes(siUnit)) cat = 'pressure';
            else if (['N', 'kN', 'lbf', 'kip', 'kgf'].includes(siUnit)) cat = 'force';

            if (cat && window.UnitConverter) {
                display = UnitConverter.convert(value, siUnit, usUnit, cat.toUpperCase());
            } else {
                display = value;
            }
        } catch (e) {
            display = value;
        }
    }
    return display.toFixed(decimals) + ' ' + unit;
}

// Helper: get the unit string for display in a form
function unitStr(siUnit) {
    return unitSystem === 'SI' ? siUnit : (UNIT_CATEGORIES[findCategory(siUnit)]?.us || siUnit);
}
function findCategory(siUnit) {
    for (const [k, v] of Object.entries(UNIT_CATEGORIES)) {
        if (v.options.includes(siUnit)) return k;
    }
    return 'length';
}

// Override inputRow to use unit system
const _origInputRow = inputRow;
function inputRow(id, label, value, siUnit, step) {
    const unit = unitStr(siUnit);
    return `
        <div class="input-row">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" value="${value}" step="${step || '0.01'}" inputmode="decimal">
            <span class="unit">${unit}</span>
        </div>`;
}

// =================================================================
// Form: Radial Gate (Tainter)
// =================================================================
function formRadialGate() {
    return `
        <div class="form-section">
            <h2>🚪 Radial Gate (Tainter)</h2>
            <p style="margin-bottom:12px;color:#555;">Tainter gate with curved face, pivots at center.</p>
            ${inputRow('rg_Q', 'Discharge Q', '15', 'm³/s', '0.1')}
            ${inputRow('rg_Hup', 'Upstream depth H', '4', 'm', '0.1')}
            ${inputRow('rg_R', 'Gate radius R', '5', 'm', '0.5')}
            ${inputRow('rg_angle', 'Opening angle', '45', '°', '5')}
            <button class="primary" onclick="computeRadialGate()">🔧 Compute Radial Gate</button>
        </div>
        <div id="results"></div>
    `;
}

function computeRadialGate() {
    const Q = parseFloat(document.getElementById('rg_Q').value);
    const H = parseFloat(document.getElementById('rg_Hup').value);
    const R = parseFloat(document.getElementById('rg_R').value);
    const angle = parseFloat(document.getElementById('rg_angle').value);
    if (!validateInputs({Q, H, R, angle}, ['Q', 'H', 'R', 'angle'])) return;

    const r = CanalsAlgorithms.radialGate(Q, H, R, angle);
    lastInputs = {Q, H, R, angle, form: 'Radial Gate'};
    lastResult = r;

    document.getElementById('results').innerHTML = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Gate width</div><div class="value">${fmt(r.gate_width, 'm', 'ft', 2)}</div></div>
                <div class="result-item"><div class="label">Discharge coeff C_d</div><div class="value">${r.discharge_coefficient.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Hydrostatic force</div><div class="value">${fmt(r.hydrostatic_force, 'N', 'lbf', 0)}</div></div>
                <div class="result-item"><div class="label">Torque</div><div class="value">${fmt(r.torque, 'N', 'lbf', 0)}</div></div>
                <div class="result-item"><div class="label">Hoist capacity</div><div class="value">${fmt(r.hoist_capacity, 'N', 'lbf', 0)}</div></div>
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
}

// =================================================================
// Form: Siphon
// =================================================================
function formSiphon() {
    return `
        <div class="form-section">
            <h2>🌊 Siphon Spillway</h2>
            <p style="margin-bottom:12px;color:#555;">Closed-conduit spillway with negative pressure inside.</p>
            ${inputRow('si_Q', 'Discharge Q', '5', 'm³/s', '0.1')}
            ${inputRow('si_H', 'Static head H', '3', 'm', '0.1')}
            ${inputRow('si_L', 'Pipe length L', '20', 'm', '1')}
            ${inputRow('si_D', 'Pipe diameter D', '1', 'm', '0.05')}
            ${inputRow('si_n', "Manning's n", '0.013', '', '0.001')}
            <button class="primary" onclick="computeSiphon()">🔧 Compute Siphon</button>
        </div>
        <div id="results"></div>
    `;
}

function computeSiphon() {
    const Q = parseFloat(document.getElementById('si_Q').value);
    const H = parseFloat(document.getElementById('si_H').value);
    const L = parseFloat(document.getElementById('si_L').value);
    const D = parseFloat(document.getElementById('si_D').value);
    const n = parseFloat(document.getElementById('si_n').value);
    if (!validateInputs({Q, H, L, D, n}, ['Q', 'H', 'L', 'D', 'n'])) return;

    const r = CanalsAlgorithms.siphon(Q, H, L, D, n);
    lastInputs = {Q, H, L, D, n, form: 'Siphon'};
    lastResult = r;

    const cavColor = r.cavitation_risk ? '#dc3545' : '#28a745';

    document.getElementById('results').innerHTML = `
        <div class="results">
            <h2>Results</h2>
            <div class="result-grid">
                <div class="result-item"><div class="label">Pipe velocity</div><div class="value">${fmt(r.velocity, 'm/s', 'ft/s', 2)}</div></div>
                <div class="result-item"><div class="label">Reynolds</div><div class="value">${r.reynolds.toExponential(2)}</div></div>
                <div class="result-item"><div class="label">Friction loss</div><div class="value">${fmt(r.friction_loss, 'm', 'ft', 3)}</div></div>
                <div class="result-item"><div class="label">Minor losses</div><div class="value">${fmt(r.minor_losses_total, 'm', 'ft', 3)}</div></div>
                <div class="result-item"><div class="label">Total head loss</div><div class="value">${fmt(r.total_head_loss, 'm', 'ft', 3)}</div></div>
                <div class="result-item"><div class="label">Flow status</div><div class="value" style="font-size:0.95em;">${r.flow_status}</div></div>
                <div class="result-item"><div class="label">Cavitation index σ</div><div class="value" style="color:${cavColor};">${r.cavitation_index.toFixed(3)}</div></div>
                <div class="result-item"><div class="label">Stilling basin L</div><div class="value">${fmt(r.stilling_basin_length, 'm', 'ft', 2)}</div></div>
            </div>
            <div class="info">
                <b>Cavitation risk:</b> ${r.cavitation_risk ? '⚠️ HIGH (σ < 0.2)' : '✓ OK'}<br>
                <b>Efficiency:</b> ${r.efficiency.toFixed(1)}% (energy recovered as flow)<br>
                ${r.flow_status.includes('INSUFFICIENT') ? '<b>Recommendation:</b> Increase static head or reduce pipe length.' : '<b>Design OK.</b>'}
            </div>
            <button class="success" onclick="exportPDF()">📄 Download PDF Report</button>
        </div>
    `;
}

// =================================================================
// Form: Pressure Breaker
// =================================================================
function formPressureBreaker() {
    return `
        <div class="form-section">
            <h2>⛰ Pressure Breaker</h2>
            <p style="margin-bottom:12px;color:#555;">Dissipate energy from high-head flows. Choose type:</p>
            ${inputRow('pb_Q', 'Discharge Q', '5', 'm³/s', '0.1')}
            ${inputRow('pb_H', 'Total head H', '10', 'm', '0.5')}
            ${inputRow('pb_D', 'Pipe diameter D', '1', 'm', '0.05')}
            ${inputRow('pb_L', 'Total length L', '20', 'm', '1')}
            <div class="input-row">
                <label for="pb_type">Breaker type</label>
                <select id="pb_type" style="flex:1;padding:10px;border:1px solid #d0d0d0;border-radius:6px;background:#fafafa;font-size:1em;min-height:44px;">
                    <option value="auto">🤖 Auto-select</option>
                    <option value="stilling_well">🪣 Stilling Well</option>
                    <option value="impact_basin">💥 Impact Basin</option>
                    <option value="cascade">📐 Cascade (Stepped Spillway)</option>
                </select>
                <span class="unit"></span>
            </div>
            <button class="primary" onclick="computePressureBreaker()">🔧 Compute Breaker</button>
        </div>
        <div id="results"></div>
    `;
}

function computePressureBreaker() {
    const Q = parseFloat(document.getElementById('pb_Q').value);
    const H = parseFloat(document.getElementById('pb_H').value);
    const D = parseFloat(document.getElementById('pb_D').value);
    const L = parseFloat(document.getElementById('pb_L').value);
    const type = document.getElementById('pb_type').value;
    if (!validateInputs({Q, H, D, L}, ['Q', 'H', 'D', 'L'])) return;

    const r = CanalsAlgorithms.pressureBreaker(Q, H, D, L, type);
    lastInputs = {Q, H, D, L, type, form: 'Pressure Breaker'};
    lastResult = r;

    let html = `<div class="results"><h2>Results — ${r.type}</h2>`;
    html += `<div class="result-grid">`;
    html += `<div class="result-item"><div class="label">Type</div><div class="value" style="font-size:0.95em;">${r.type}</div></div>`;
    if (r.n_stages) html += `<div class="result-item"><div class="label">Number of stages</div><div class="value">${r.n_stages}</div></div>`;
    if (r.well_diameter) html += `<div class="result-item"><div class="label">Well diameter</div><div class="value">${fmt(r.well_diameter, 'm', 'ft', 2)}</div></div>`;
    if (r.basin_width) html += `<div class="result-item"><div class="label">Basin width</div><div class="value">${fmt(r.basin_width, 'm', 'ft', 2)}</div></div>`;
    if (r.basin_length) html += `<div class="result-item"><div class="label">Basin length</div><div class="value">${fmt(r.basin_length, 'm', 'ft', 2)}</div></div>`;
    if (r.wall_height) html += `<div class="result-item"><div class="label">Wall height</div><div class="value">${fmt(r.wall_height, 'm', 'ft', 2)}</div></div>`;
    if (r.step_height) html += `<div class="result-item"><div class="label">Step height</div><div class="value">${fmt(r.step_height, 'm', 'ft', 2)}</div></div>`;
    if (r.total_loss) html += `<div class="result-item"><div class="label">Energy dissipated</div><div class="value">${fmt(r.total_loss, 'm', 'ft', 2)}</div></div>`;
    if (r.efficiency) html += `<div class="result-item"><div class="label">Efficiency</div><div class="value">${r.efficiency.toFixed(1)} %</div></div>`;
    html += `</div>`;

    if (r.stages && r.stages.length > 0 && r.stages.length <= 20) {
        html += `<div class="info"><b>Stage details:</b><br>`;
        html += r.stages.map(s => {
            if (s.step_number) {
                return `Step ${s.step_number}: h=${s.step_height?.toFixed(2)}m, L=${s.step_length?.toFixed(2)}m, V=${s.velocity?.toFixed(2)}m/s, Fr=${s.froude?.toFixed(2)}`;
            } else if (s.stage_number) {
                return `Stage ${s.stage_number}: D=${s.well_diameter?.toFixed(2)}m, h=${s.water_depth?.toFixed(2)}m`;
            }
        }).join('<br>');
        html += `</div>`;
    }

    html += `<button class="success" onclick="exportPDF()">📄 Download PDF Report</button></div>`;
    document.getElementById('results').innerHTML = html;
}

// =================================================================
// Form: River Examples (preset test cases)
// =================================================================
function formExamples() {
    let html = `<div class="form-section"><h2>🌍 River Engineering Examples</h2>`;
    html += `<p style="margin-bottom:12px;color:#555;">Real-world engineering case studies. Tap any example to load values into the relevant form.</p></div>`;

    for (const [key, ex] of Object.entries(RIVER_EXAMPLES)) {
        html += `
            <div class="form-section" style="cursor:pointer;" onclick="loadExample('${key}')">
                <h2 style="font-size:1em;">${ex.title}</h2>
                <p style="font-size:0.85em;color:#666;line-height:1.4;">${ex.description}</p>
                <p style="font-size:0.75em;color:#888;margin-top:6px;">
                    → opens <b>${ex.form}</b> form
                </p>
            </div>
        `;
    }
    return html;
}

function loadExample(key) {
    const ex = RIVER_EXAMPLES[key];
    if (!ex) return;
    currentForm = ex.form;
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.form === ex.form);
    });
    renderForm();
    // After render, populate inputs
    setTimeout(() => {
        for (const [k, v] of Object.entries(ex.inputs)) {
            const el = document.getElementById(prefix(ex.form) + k);
            if (el) el.value = v;
        }
        // Show a tip
        const tip = document.createElement('div');
        tip.className = 'success';
        tip.innerHTML = `✓ Loaded example: <b>${ex.title}</b><br><span style="font-size:0.85em;">Tap "Compute" to see results.</span>`;
        document.getElementById('content').insertBefore(tip, document.getElementById('content').firstChild.nextSibling);
    }, 50);
}

function prefix(form) {
    const m = {
        openChannel: 'oc_',
        sluiceGate: 'sg_',
        lacey: 'l_',
        manning: 'm_',
        flowProfile: 'fp_',
        hydraulicJump: 'hj_',
        waterHammer: 'wh_',
        radialGate: 'rg_',
        siphon: 'si_',
        pressureBreaker: 'pb_'
    };
    return m[form] || '';
}

// Update the sidebar to include new items
const _origRenderForm = renderForm;
function renderFormNew() {
    const content = document.getElementById('content');
    switch (currentForm) {
        case 'openChannel':     content.innerHTML = formOpenChannel(); break;
        case 'sluiceGate':      content.innerHTML = formSluiceGate(); break;
        case 'lacey':           content.innerHTML = formLacey(); break;
        case 'manning':         content.innerHTML = formManning(); break;
        case 'flowProfile':     content.innerHTML = formFlowProfile(); break;
        case 'hydraulicJump':   content.innerHTML = formHydraulicJump(); break;
        case 'waterHammer':     content.innerHTML = formWaterHammer(); break;
        case 'radialGate':      content.innerHTML = formRadialGate(); break;
        case 'siphon':          content.innerHTML = formSiphon(); break;
        case 'pressureBreaker': content.innerHTML = formPressureBreaker(); break;
        case 'examples':        content.innerHTML = formExamples(); break;
        case 'about':           content.innerHTML = formAbout(); break;
    }
}

// Replace the original renderForm
renderForm = renderFormNew;

// Add new sidebar items to index.html (do this at runtime via DOM)
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Find a divider spot - insert new items before About
        const items = [
            {form: 'radialGate', text: '🚪 Radial Gate'},
            {form: 'siphon', text: '🌊 Siphon Spillway'},
            {form: 'pressureBreaker', text: '⛰ Pressure Breaker'},
            {form: 'examples', text: '🌍 River Examples'},
        ];

        // Add a divider
        const divider = document.createElement('div');
        divider.style.cssText = 'border-top:1px solid rgba(255,255,255,0.15);margin:8px 0;';
        sidebar.insertBefore(divider, sidebar.children[7]);  // Before "About"

        items.forEach(it => {
            const div = document.createElement('div');
            div.className = 'sidebar-item';
            div.dataset.form = it.form;
            div.textContent = it.text;
            div.addEventListener('click', () => setForm(it.form));
            sidebar.insertBefore(div, sidebar.children[7]);
        });
    }
});

// Initial render
renderForm();
