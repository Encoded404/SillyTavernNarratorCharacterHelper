import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TerserPlugin from 'terser-webpack-plugin';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

// Path to SillyTavern's public/scripts directory for module resolution
const sillyTavernScriptsPath = path.resolve(__dirname, '../SillyTavern/public/scripts');

export default {
	entry: path.join(__dirname, 'src/index.ts'),
	output: {
		path: path.join(__dirname, 'dist/'),
		filename: 'index.js',
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'scripts': sillyTavernScriptsPath,
		},
		modules: ['node_modules', sillyTavernScriptsPath],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.html$/,
				use: { loader: 'html-loader' },
			},
		],
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				terserOptions: {
					format: {
						comments: false,
					},
				},
			}),
		],
	},
	externals: {
		// These modules are provided by SillyTavern at runtime
		'scripts/world-info.js': 'world-info',
		'scripts/extensions.js': 'extensions',
		'scripts/utils.js': 'utils',
		'script.js': 'script',
	},
};
