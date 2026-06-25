// =================================================================
// Unit Conversion Module (SI ↔ US Customary)
// =================================================================

const UnitConverter = (function() {

    // Length
    const LENGTH = {
        'm':   {factor: 1.0,         us: 'ft',  usFactor: 3.28084},
        'ft':  {factor: 0.3048,      us: 'm',   usFactor: 1/0.3048},
        'cm':  {factor: 0.01,        us: 'in',  usFactor: 0.393701},
        'in':  {factor: 0.0254,      us: 'cm',  usFactor: 1/0.0254},
    };

    // Discharge (volume / time)
    const DISCHARGE = {
        'm³/s':  {factor: 1.0,            us: 'cfs',     usFactor: 35.3147},
        'cfs':   {factor: 0.0283168,      us: 'm³/s',    usFactor: 1/0.0283168},
        'L/s':   {factor: 0.001,          us: 'gpm',     usFactor: 15.8503},
        'gpm':   {factor: 0.0000630902,   us: 'L/s',     usFactor: 1/0.0000630902},
        'm³/h':  {factor: 0.000277778,    us: 'gpm',     usFactor: 4.40287},
    };

    // Velocity
    const VELOCITY = {
        'm/s':   {factor: 1.0,       us: 'ft/s', usFactor: 3.28084},
        'ft/s':  {factor: 0.3048,    us: 'm/s',  usFactor: 1/0.3048},
        'ft/min':{factor: 0.00508,   us: 'm/s',  usFactor: 196.85},
        'mph':   {factor: 0.44704,   us: 'm/s',  usFactor: 2.23694},
    };

    // Area
    const AREA = {
        'm²':    {factor: 1.0,        us: 'ft²',  usFactor: 10.7639},
        'ft²':   {factor: 0.092903,   us: 'm²',   usFactor: 1/0.092903},
        'cm²':   {factor: 1e-4,       us: 'in²',  usFactor: 0.155},
        'in²':   {factor: 0.00064516, us: 'cm²',  usFactor: 1/0.00064516},
    };

    // Pressure
    const PRESSURE = {
        'Pa':    {factor: 1.0,           us: 'psi',  usFactor: 0.000145038},
        'kPa':   {factor: 1000,          us: 'psi',  usFactor: 0.145038},
        'bar':   {factor: 100000,        us: 'psi',  usFactor: 14.5038},
        'psi':   {factor: 6894.76,      us: 'kPa',  usFactor: 6.89476},
        'm H2O': {factor: 9806.65,       us: 'ft H2O',usFactor: 3.28084},
        'ft H2O':{factor: 2989.07,       us: 'm H2O',usFactor: 1/3.28084},
        'atm':   {factor: 101325,        us: 'psi',  usFactor: 14.6959},
    };

    // Force
    const FORCE = {
        'N':     {factor: 1.0,        us: 'lbf',    usFactor: 0.224809},
        'kN':    {factor: 1000,      us: 'lbf',    usFactor: 224.809},
        'lbf':   {factor: 4.44822,   us: 'N',      usFactor: 1/4.44822},
        'kip':   {factor: 4448.22,   us: 'kN',     usFactor: 4.44822},
        'kgf':   {factor: 9.80665,   us: 'lbf',    usFactor: 2.20462},
    };

    // Temperature
    const TEMP = {
        'C':   {factor: 1.0,    offset: 0,    us: 'F'},
        'F':   {factor: 5/9,    offset: -32,  us: 'C'},
        'K':   {factor: 1.0,    offset: -273.15, us: 'C'},
    };

    // Density
    const DENSITY = {
        'kg/m³':   {factor: 1.0,             us: 'lb/ft³',  usFactor: 0.062428},
        'lb/ft³':  {factor: 16.0185,         us: 'kg/m³',   usFactor: 16.0185},
        'g/cm³':   {factor: 1000,            us: 'lb/ft³',  usFactor: 62.428},
    };

    // Viscosity (dynamic)
    const VISCOSITY = {
        'Pa·s':    {factor: 1.0,        us: 'lb/(ft·s)', usFactor: 0.020885},
        'cP':      {factor: 0.001,      us: 'lb/(ft·s)', usFactor: 0.000020885},
        'lb/(ft·s)':{factor: 47.8803,  us: 'Pa·s',    usFactor: 0.020885},
    };

    // Power
    const POWER = {
        'W':     {factor: 1.0,      us: 'hp',    usFactor: 0.00134102},
        'kW':    {factor: 1000,    us: 'hp',    usFactor: 1.34102},
        'hp':    {factor: 745.7,   us: 'kW',    usFactor: 0.7457},
        'hp(metric)':{factor: 735.5, us: 'kW',  usFactor: 0.7355},
    };

    function convert(value, fromUnit, toUnit, category) {
        if (value === null || value === undefined || isNaN(value)) return value;
        if (fromUnit === toUnit) return value;

        const cat = eval(category);
        const from = cat[fromUnit];
        const to = cat[toUnit];

        if (!from || !to) return value;

        // Convert to base unit, then to target
        const baseValue = value * from.factor;
        const targetValue = baseValue / to.factor;

        // Handle temperature (has offset)
        if (category === 'TEMP') {
            let celsius;
            if (fromUnit === 'C') celsius = value;
            else if (fromUnit === 'F') celsius = (value - 32) * 5/9;
            else if (fromUnit === 'K') celsius = value - 273.15;

            if (toUnit === 'C') return celsius;
            else if (toUnit === 'F') return celsius * 9/5 + 32;
            else if (toUnit === 'K') return celsius + 273.15;
        }

        return targetValue;
    }

    return {
        convert: convert,
        LENGTH: LENGTH,
        DISCHARGE: DISCHARGE,
        VELOCITY: VELOCITY,
        AREA: AREA,
        PRESSURE: PRESSURE,
        FORCE: FORCE,
        TEMP: TEMP,
        DENSITY: DENSITY,
        VISCOSITY: VISCOSITY,
        POWER: POWER
    };
})();

// Available unit categories with SI default and US alternate
const UNIT_CATEGORIES = {
    'length':    {si: 'm',     us: 'ft',    options: ['m', 'ft', 'cm', 'in']},
    'discharge': {si: 'm³/s',  us: 'cfs',   options: ['m³/s', 'cfs', 'L/s', 'gpm', 'm³/h']},
    'velocity':  {si: 'm/s',   us: 'ft/s',  options: ['m/s', 'ft/s', 'ft/min', 'mph']},
    'area':      {si: 'm²',    us: 'ft²',   options: ['m²', 'ft²', 'cm²', 'in²']},
    'pressure':  {si: 'kPa',   us: 'psi',   options: ['Pa', 'kPa', 'bar', 'psi', 'm H2O', 'ft H2O', 'atm']},
    'force':     {si: 'kN',    us: 'lbf',   options: ['N', 'kN', 'lbf', 'kip', 'kgf']},
    'temperature':{si: 'C',    us: 'F',    options: ['C', 'F', 'K']},
    'density':   {si: 'kg/m³', us: 'lb/ft³', options: ['kg/m³', 'lb/ft³', 'g/cm³']},
    'viscosity': {si: 'Pa·s',  us: 'lb/(ft·s)', options: ['Pa·s', 'cP', 'lb/(ft·s)']},
    'power':     {si: 'kW',    us: 'hp',    options: ['W', 'kW', 'hp', 'hp(metric)']},
};

// Make available globally
if (typeof window !== 'undefined') {
    window.UnitConverter = UnitConverter;
    window.UNIT_CATEGORIES = UNIT_CATEGORIES;
}
