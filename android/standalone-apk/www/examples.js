// =================================================================
// River Engineering Examples (canonical test cases)
// =================================================================

const RIVER_EXAMPLES = {
    // Irrigation canal example (Lacey's classic)
    irrigationCanal: {
        title: "🌾 Irrigation Canal — Lacey Design",
        description: "Classical 15 m³/s irrigation canal in medium silt, designed by Lacey's silt theory. Used in Punjab/UP India.",
        form: 'lacey',
        inputs: {Q: 15, f: 1.0, z: 1.0},
        expected: {
            depth: 5.21,
            bottom_width: 4.32,
            area: 49.7,
            velocity: 0.302
        }
    },

    // Manning optimal channel
    manningOptimal: {
        title: "🏞 Optimal Trapezoidal Channel",
        description: "Standard 15 m³/s canal, Manning-Strickler optimal section. Test case for most textbooks.",
        form: 'openChannel',
        inputs: {Q: 15, n: 0.025, S: 0.0008, z: 1.0},
        expected: {
            bottom_width: 2.88,
            depth: 2.55,
            velocity: 1.33,
            area: 11.27
        }
    },

    // High-head spillway (water hammer)
    highHeadPenstock: {
        title: "💧 High-Head Penstock — Direct Water Hammer",
        description: "1500m penstock, 0.6m diameter, fast valve closure (0.2s << t_crit). Tests Korteweg + Joukowsky.",
        form: 'waterHammer',
        inputs: {L: 1500, D: 0.6, e: 0.012, E: 2.0e11, nu: 0.3,
                 sigma_y: 2.5e8, rho: 1000, K: 2.2e9, V: 2.5, t_c: 0.2},
        expected: {
            wave_speed: 1210.9,
            pressure_rise_bar: 30.27,
            safety_factor: 3.30
        }
    },

    // Oscillating jump (USBR Type III)
    oscillatingJump: {
        title: "🌊 Oscillating Jump — USBR Type III Basin",
        description: "V=8 m/s, y=0.5 m, b=5 m. Fr=3.61 falls in oscillating range; needs Type III basin.",
        form: 'hydraulicJump',
        inputs: {V: 8, y: 0.5, b: 5},
        expected: {
            froude: 3.61,
            conjugate_depth: 2.32,
            basin_type: 'Type III'
        }
    },

    // Glen Canyon Dam spillway (real-world reference)
    glenCanyon: {
        title: "🏔 Glen Canyon Spillway Cavitation Check",
        description: "Real-world case: Glen Canyon Dam (Colorado River, USA). Q=283 m³/s through 4 outlets. Tests cavitation risk at high head.",
        form: 'sluiceGate',
        inputs: {Q: 283, H_up: 80, H_down: 12, b: 12, a: 5.5},
        expected: {
            cd: 0.58,
            velocity_through: 4.5,
            force_kN: 45000
        }
    },

    // Hoover Dam
    hooverDam: {
        title: "🏛 Hoover Dam Outlet Works",
        description: "Hoover Dam (Nevada/Arizona, USA). Q=184 m³/s per outlet, head=150m.",
        form: 'sluiceGate',
        inputs: {Q: 184, H_up: 150, H_down: 8, b: 5, a: 3.5},
        expected: {
            cd: 0.58,
            velocity_through: 9,
            force_kN: 5500
        }
    },

    // Three Gorges (largest spillway)
    threeGorges: {
        title: "🌊 Three Gorges Dam Spillway",
        description: "World's largest hydroelectric dam (Yangtze River, China). Deep outlet, high Q.",
        form: 'hydraulicJump',
        inputs: {V: 30, y: 2, b: 8},
        expected: {
            froude: 6.78,
            conjugate_depth: 14.4,
            basin_type: 'Type IV'
        }
    },

    // Canal drop (pressure breaker example)
    canalDrop: {
        title: "⛰ Canal Drop — Cascade Stilling",
        description: "5 m³/s canal with sudden 10m drop. Tests cascade (stepped spillway) design.",
        form: 'pressureBreaker',
        inputs: {Q: 5, H_total: 10, D_pipe: 1, L_total: 20, breaker_type: 'cascade'},
        expected: {
            n_steps: 14,
            step_height: 0.71,
            efficiency: 45
        }
    },

    // Siphon spillway
    siphonSpillway: {
        title: "🌊 Siphon Spillway Design",
        description: "5 m³/s reservoir siphon, 3m head, 20m pipe length.",
        form: 'siphon',
        inputs: {Q: 5, H_static: 3, L_pipe: 20, D_pipe: 1, n_manning: 0.013},
        expected: {
            velocity: 6.4,
            total_loss: 5.2,
            efficiency: 65
        }
    },

    // Radial gate (Tainter)
    radialGateEx: {
        title: "🚪 Radial (Tainter) Gate Design",
        description: "Standard dam radial gate, 15 m³/s, R=5m, 45° opening.",
        form: 'radialGate',
        inputs: {Q: 15, H_up: 4, radius: 5, angle: 45},
        expected: {
            gate_width: 5.5,
            hydrostatic_force: 580,
            torque: 2050
        }
    }
};

if (typeof window !== 'undefined') window.RIVER_EXAMPLES = RIVER_EXAMPLES;
