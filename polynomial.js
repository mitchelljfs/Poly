const ohm = require('ohm-js');

const grammar = ohm.grammar(`Polynomial {
  Poly
    = Poly "+" term               -- add
    | Poly "-" term               -- subtract
    | "-" Poly                    -- negate
    | term
  term
    = coefficient "x^" exponent   -- coeff_var_exp
    | coefficient "x"             -- coeff_var
    | coefficient                 -- coeff
    | "x^" exponent               -- var_exp
    | "x"                         -- var
  coefficient
    = digit+ ("." digit+)?
  exponent
    = "-"? digit+
}`);

const semantics = grammar.createSemantics().addOperation('deriv', {
  Poly_add(p, op, t) { return `${p.deriv()}+${t.deriv()}`; },
  Poly_subtract(p, op, t) { return `${p.deriv()}-${t.deriv()}`; },
  Poly_negate(_, p) { return `-${p.deriv()}`; },
  term_coeff_var_exp(c, _, e) { return `${e.value * c.value}x^${e.value - 1}`; },
  /* eslint-disable no-unused-vars, quotes */
  term_coeff_var(c, _) { return `${c.value}`; },
  term_coeff(c) { return `0`; },
  term_var_exp(_, e) { return `${e.value}x^${e.value - 1}`; },
  term_var(_) { return `1`; },
}).addOperation('eval', {
  Poly_add(p, op, t) { return x => p.eval()(x) + t.eval()(x); },
  Poly_subtract(p, op, t) { return x => p.eval()(x) - t.eval()(x); },
  Poly_negate(_, p) { return x => -p.eval()(x); },
  term_coeff_var_exp(c, _, e) { return x => c.value * (x ** e.value); },
  term_coeff_var(c, _) { return x => c.value * x; },
  term_coeff(c) { return x => c.value; },
  term_var_exp(_, e) { return x => x ** e.value; },
  term_var(_) { return x => x; },
}).addAttribute('value', {
  coefficient(whole, dot, fraction) { return +this.sourceString; },
  exponent(sign, magnitude) { return +this.sourceString; },
  /* eslint-enable no-unused-vars, quotes */
});

exports.derivative = (poly) => {
  const match = grammar.match(poly);
  if (!match.succeeded()) {
    throw new Error(match.message);
  }
  return semantics(match).deriv().replace(/--/g, '+').replace(/\+-/g, '-');
};

exports.evaluate = (poly, x) => {
  const match = grammar.match(poly);
  if (!match.succeeded()) {
    throw new Error(match.message);
  }
  return semantics(match).eval()(x);
};

if (!module.parent) {
  const match = grammar.match(process.argv[3]);
  if (match.succeeded() && (process.argv.length === 4 || process.argv.length === 5)) {
    switch (process.argv[2]) {
      case 'deriv': {
        console.log(semantics(match).deriv()); // eslint-disable-line no-console
        break;
      }
      case 'eval': {
        const outFunction = semantics(match).eval();
        console.log(outFunction(parseInt(process.argv[4], 10))); // eslint-disable-line no-console
        break;
      }
      default:
        console.log(`Please either specify either 'deriv' or 'eval' in the #2 commandline position.`); // eslint-disable-line no-console, quotes

    }
  } else {
    console.error(match.message); // eslint-disable-line no-console
    process.exitCode = 1;
  }
}
