process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.BABEL_ENV = process.env.BABEL_ENV || 'development';

const path = require('path');
const createReactAppWebpackConfig = require('react-scripts/config/webpack.config');

// Reutiliza la configuración de desarrollo de CRA para Cypress Component Testing
// y permite transpilar specs/componentes JSX dentro de cypress/component.
const webpackConfig = createReactAppWebpackConfig('development');

const cypressComponentDir = path.resolve(__dirname, 'cypress', 'component');

const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));

if (oneOfRule) {
	oneOfRule.oneOf.unshift({
		test: /\.css$/,
		use: [require.resolve('null-loader')],
	});

	const babelRule = oneOfRule.oneOf.find((rule) => {
		const loader = typeof rule.loader === 'string' ? rule.loader : '';
		return loader.includes('babel-loader') && rule.include;
	});

	if (babelRule) {
		const includeEntries = Array.isArray(babelRule.include)
			? babelRule.include
			: [babelRule.include];

		if (!includeEntries.includes(cypressComponentDir)) {
			babelRule.include = [...includeEntries, cypressComponentDir];
		}
	}
}

if (webpackConfig.resolve && Array.isArray(webpackConfig.resolve.plugins)) {
	webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
		(plugin) => plugin && plugin.constructor && plugin.constructor.name !== 'ModuleScopePlugin'
	);
}

module.exports = webpackConfig;
